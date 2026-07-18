import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { calculateGST } from '../utils/gstCalculator';

export const generateInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.orderId as string;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        user: { select: { name: true, email: true, phone: true } },
        invoice: true,
      },
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== req.user!.userId && req.user!.role === 'CUSTOMER') {
      throw new AppError('Unauthorized', 403);
    }

    if (order.invoice) {
      return res.json({ success: true, data: order.invoice });
    }

    const setting = await prisma.siteSetting.findUnique({ where: { key: 'next_invoice_number' } });
    const invoiceNumber = parseInt(setting?.value || '1001');
    await prisma.siteSetting.upsert({
      where: { key: 'next_invoice_number' },
      update: { value: String(invoiceNumber + 1) },
      create: { key: 'next_invoice_number', value: String(invoiceNumber + 1), group: 'invoice' },
    });

    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber,
      },
    });

    res.status(201).json({ success: true, message: 'Invoice generated', data: invoice });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orderNumber = req.params.orderNumber as string;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { invoice: true },
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== req.user!.userId && req.user!.role === 'CUSTOMER') {
      throw new AppError('Unauthorized', 403);
    }

    if (!order.invoice) {
      throw new AppError('Invoice not found. Please generate one first.', 404);
    }

    res.json({ success: true, data: order.invoice });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceHTML = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoiceNumberParam = parseInt(req.params.invoiceNumber as string);
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: invoiceNumberParam },
      include: {
        order: {
          include: {
            items: true,
            address: true,
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!invoice) throw new AppError('Invoice not found', 404);

    const order = invoice.order;
    const address = order.address;

    const lineItems = order.items.map((item: any, index: number) => {
      const gst = calculateGST(Number(item.price), item.quantity, 0, 12);
      return {
        sno: index + 1,
        description: item.name,
        hsnCode: item.sku || '9403',
        quantity: item.quantity,
        unitPrice: Number(item.price),
        ...gst,
        gstRate: 12,
      };
    });

    const totalTaxable = lineItems.reduce((sum: number, i: any) => sum + i.taxableValue, 0);
    const totalCgst = lineItems.reduce((sum: number, i: any) => sum + i.cgst, 0);
    const totalSgst = lineItems.reduce((sum: number, i: any) => sum + i.sgst, 0);
    const grandTotal = totalTaxable + totalCgst + totalSgst;

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice ${invoice.invoiceNumber}</title>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#333}
.invoice-box{max-width:800px;margin:auto;border:1px solid #ccc;padding:30px}
.header{display:flex;justify-content:space-between;border-bottom:2px solid #1a1a2e;padding-bottom:15px;margin-bottom:20px}
.header h1{margin:0;color:#1a1a2e;font-size:24px}
.header .inv-num{font-size:14px;color:#666}
table{width:100%;border-collapse:collapse;margin:20px 0}
th{background:#1a1a2e;color:#fff;padding:10px;text-align:left;font-size:12px}
td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}
.text-right{text-align:right}
.totals{margin-top:20px;border-top:2px solid #1a1a2e;padding-top:10px}
.totals .row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px}
.totals .row.total{font-weight:bold;font-size:16px;border-top:1px solid #333;padding-top:10px}
.section{margin:20px 0;font-size:13px}
.section h3{margin-bottom:5px;font-size:14px}
.footer{margin-top:30px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:10px}
</style></head><body>
<div class="invoice-box">
<div class="header"><div><h1>TAX INVOICE</h1><p>Seller: [Your Store Name]<br>123 Business Street<br>Maharashtra, India - 400001<br>GSTIN: 27AAAAA0000A1Z5</p></div>
<div class="inv-num"><h2>INV-${String(invoice.invoiceNumber).padStart(6, '0')}</h2><p>Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p></div></div>
<div class="section"><h3>Bill To:</h3><p>${address.fullName}<br>${address.line1}${address.line2 ? `, ${address.line2}` : ''}<br>${address.city}, ${address.state} - ${address.pincode}<br>Phone: ${address.phone}</p></div>
<table><thead><tr><th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Unit Price</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total</th></tr></thead><tbody>
${lineItems.map((i: any) => `<tr><td>${i.sno}</td><td>${i.description}</td><td>${i.hsnCode}</td><td>${i.quantity}</td><td class="text-right">\u20B9${i.unitPrice.toFixed(2)}</td><td class="text-right">\u20B9${i.taxableValue.toFixed(2)}</td><td class="text-right">\u20B9${i.cgst.toFixed(2)}</td><td class="text-right">\u20B9${i.sgst.toFixed(2)}</td><td class="text-right">\u20B9${i.total.toFixed(2)}</td></tr>`).join('')}
</tbody></table>
<div class="totals"><div class="row"><span>Subtotal:</span><span>\u20B9${Number(order.subtotal).toFixed(2)}</span></div>
${Number(order.discount) > 0 ? `<div class="row"><span>Discount:</span><span>-\u20B9${Number(order.discount).toFixed(2)}</span></div>` : ''}
<div class="row"><span>CGST:</span><span>\u20B9${totalCgst.toFixed(2)}</span></div>
<div class="row"><span>SGST:</span><span>\u20B9${totalSgst.toFixed(2)}</span></div>
<div class="row total"><span>Grand Total:</span><span>\u20B9${grandTotal.toFixed(2)}</span></div></div>
<div class="footer"><p>This is a computer-generated invoice. | Thank you for your purchase!</p></div></div></body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};
