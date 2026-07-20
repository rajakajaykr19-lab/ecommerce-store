import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as invoice from '../controllers/invoice.controller';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { generateInvoicePDF, generateShippingLabel } from '../services/pdf.service';

const router = Router();

router.use(authenticate);

router.post('/generate/:orderId', invoice.generateInvoice);
router.get('/:orderNumber', invoice.getInvoice);
router.get('/html/:invoiceNumber', invoice.getInvoiceHTML);

router.get('/pdf/:invoiceNumber', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoiceNumber = parseInt(req.params.invoiceNumber as string);
    const invoiceRecord = await prisma.invoice.findUnique({
      where: { invoiceNumber },
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

    if (!invoiceRecord) throw new AppError('Invoice not found', 404);

    const order = invoiceRecord.order;
    const settings = await prisma.siteSetting.findMany();
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const companySettings = {
      storeName: settingsMap.store_name || settingsMap.storeName || 'Your Store',
      address: settingsMap.store_address || settingsMap.storeAddress || '',
      gstin: settingsMap.gstin || '',
      pan: settingsMap.pan || '',
      phone: settingsMap.store_phone || settingsMap.storePhone || '',
      email: settingsMap.store_email || settingsMap.storeEmail || '',
      website: settingsMap.store_website || settingsMap.storeWebsite || '',
      logo: settingsMap.store_logo || settingsMap.storeLogo || '',
    };

    const pdfBuffer = await generateInvoicePDF(
      { invoiceNumber: invoiceRecord.invoiceNumber, createdAt: invoiceRecord.createdAt },
      {
        orderNumber: order.orderNumber,
        items: order.items.map((item: any) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          gstRate: item.gstRate || 12,
        })),
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shipping: Number(order.shipping),
        tax: Number(order.tax),
        total: Number(order.total),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      },
      { name: order.user.name, email: order.user.email, phone: order.user.phone || undefined },
      {
        fullName: order.address.fullName,
        phone: order.address.phone,
        line1: order.address.line1,
        line2: order.address.line2 || undefined,
        city: order.address.city,
        state: order.address.state,
        pincode: order.address.pincode,
        country: order.address.country,
      },
      companySettings,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=INV-${String(invoiceRecord.invoiceNumber).padStart(6, '0')}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.get('/shipping-label/:shipmentId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.shipmentId as string },
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

    if (!shipment) throw new AppError('Shipment not found', 404);

    const settings = await prisma.siteSetting.findMany();
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const companySettings = {
      storeName: settingsMap.store_name || settingsMap.storeName || 'Your Store',
      address: settingsMap.store_address || settingsMap.storeAddress || '',
      phone: settingsMap.store_phone || settingsMap.storePhone || '',
    };

    const pdfBuffer = await generateShippingLabel(
      {
        trackingNumber: shipment.trackingNumber,
        courierPartner: shipment.courierPartner,
        weight: shipment.weight || undefined,
      },
      { orderNumber: shipment.order.orderNumber },
      { name: shipment.order.user.name, phone: shipment.order.user.phone || shipment.order.address.phone },
      {
        fullName: shipment.order.address.fullName,
        phone: shipment.order.address.phone,
        line1: shipment.order.address.line1,
        line2: shipment.order.address.line2 || undefined,
        city: shipment.order.address.city,
        state: shipment.order.address.state,
        pincode: shipment.order.address.pincode,
        country: shipment.order.address.country,
      },
      companySettings,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shipping-label-${shipment.trackingNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

export default router;
