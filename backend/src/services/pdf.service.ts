import PDFDocument from 'pdfkit';

const INR = (value: number): string => `\u20B9${value.toFixed(2)}`;

function collectStream(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

function drawLine(doc: PDFKit.PDFDocument, x1: number, y: number, x2: number): void {
  doc.moveTo(x1, y).lineTo(x2, y).stroke();
}

function drawRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill?: string, stroke?: boolean): void {
  if (fill) {
    doc.fill(fill).rect(x, y, w, h).fill();
  } else if (stroke !== undefined) {
    doc.rect(x, y, w, h).stroke();
  } else {
    doc.rect(x, y, w, h).stroke();
  }
}

function generateHSN(): string {
  return '9983';
}

export async function generateInvoicePDF(
  invoiceData: { invoiceNumber: number; createdAt: Date },
  orderData: {
    orderNumber: string;
    items: Array<{ name: string; sku: string; quantity: number; price: number; total: number; gstRate?: number }>;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
  },
  customerData: { name: string; email: string; phone?: string },
  addressData: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  },
  companySettings: {
    storeName?: string;
    address?: string;
    gstin?: string;
    pan?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  }
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const pageWidth = 595.28;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a1a2e');
  doc.text(companySettings.storeName || 'My Store', margin, y);
  y += 25;

  doc.font('Helvetica').fontSize(9).fillColor('#444444');
  if (companySettings.address) {
    doc.text(companySettings.address, margin, y, { width: contentWidth });
    y += doc.heightOfString(companySettings.address, { width: contentWidth }) + 4;
  }
  const contactParts: string[] = [];
  if (companySettings.gstin) contactParts.push(`GSTIN: ${companySettings.gstin}`);
  if (companySettings.pan) contactParts.push(`PAN: ${companySettings.pan}`);
  if (companySettings.phone) contactParts.push(`Ph: ${companySettings.phone}`);
  if (companySettings.email) contactParts.push(`${companySettings.email}`);
  if (companySettings.website) contactParts.push(`${companySettings.website}`);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), margin, y, { width: contentWidth });
    y += doc.heightOfString(contactParts.join('  |  '), { width: contentWidth }) + 8;
  }

  drawLine(doc, margin, y, pageWidth - margin);
  y += 10;

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a1a2e');
  doc.text('TAX INVOICE', margin, y, { width: contentWidth, align: 'center' });
  y += 22;

  drawLine(doc, margin, y, pageWidth - margin);
  y += 12;

  const leftCol = margin;
  const rightCol = pageWidth / 2 + 20;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a2e');
  doc.text('Invoice Details', leftCol, y);
  y += 16;

  doc.font('Helvetica').fontSize(9).fillColor('#444444');
  doc.text(`Invoice No: INV-${String(invoiceData.invoiceNumber).padStart(6, '0')}`, leftCol, y);
  y += 14;
  doc.text(`Invoice Date: ${invoiceData.createdAt.toLocaleDateString('en-IN')}`, leftCol, y);
  y += 14;
  doc.text(`Order No: ${orderData.orderNumber}`, leftCol, y);
  y += 20;

  drawLine(doc, margin, y, pageWidth - margin);
  y += 12;

  const addrY = y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a2e');
  doc.text('Bill To:', margin, addrY);
  doc.text('Ship To:', rightCol, addrY);
  y = addrY + 16;

  doc.font('Helvetica').fontSize(9).fillColor('#444444');

  const billingAddrLines: string[] = [addressData.fullName];
  if (customerData.phone) billingAddrLines.push(customerData.phone);
  if (customerData.email) billingAddrLines.push(customerData.email);
  billingAddrLines.push(addressData.line1);
  if (addressData.line2) billingAddrLines.push(addressData.line2);
  billingAddrLines.push(`${addressData.city}, ${addressData.state} - ${addressData.pincode}`);
  billingAddrLines.push(addressData.country);

  const shippingAddrLines: string[] = [addressData.fullName, addressData.phone];
  shippingAddrLines.push(addressData.line1);
  if (addressData.line2) shippingAddrLines.push(addressData.line2);
  shippingAddrLines.push(`${addressData.city}, ${addressData.state} - ${addressData.pincode}`);
  shippingAddrLines.push(addressData.country);

  const billingText = billingAddrLines.join('\n');
  const shippingText = shippingAddrLines.join('\n');

  doc.text(billingText, margin, y, { width: contentWidth / 2 - 20 });
  doc.text(shippingText, rightCol, y, { width: contentWidth / 2 - 20 });
  y += Math.max(doc.heightOfString(billingText, { width: contentWidth / 2 - 20 }), doc.heightOfString(shippingText, { width: contentWidth / 2 - 20 })) + 16;

  drawLine(doc, margin, y, pageWidth - margin);
  y += 12;

  const cols = [
    { x: margin, w: 25, align: 'center' as const },
    { x: margin + 28, w: 160, align: 'left' as const },
    { x: margin + 191, w: 55, align: 'center' as const },
    { x: margin + 249, w: 35, align: 'center' as const },
    { x: margin + 287, w: 65, align: 'right' as const },
    { x: margin + 355, w: 65, align: 'right' as const },
    { x: margin + 423, w: 48, align: 'right' as const },
    { x: margin + 474, w: 48, align: 'right' as const },
  ];

  drawRect(doc, margin, y, contentWidth, 18, '#1a1a2e');

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
  const headers = ['#', 'Description', 'HSN', 'Qty', 'Unit Price', 'Taxable Value', 'CGST', 'SGST'];
  headers.forEach((h, i) => {
    doc.text(h, cols[i].x, y + 4, { width: cols[i].w, align: cols[i].align });
  });
  y += 22;

  doc.font('Helvetica').fontSize(9).fillColor('#333333');

  orderData.items.forEach((item, idx) => {
    const gstRate = item.gstRate ?? 12;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    const taxableValue = item.total;
    const cgstAmount = (taxableValue * cgstRate) / 100;
    const sgstAmount = (taxableValue * sgstRate) / 100;

    if (y > 700) {
      doc.addPage();
      y = margin;
    }

    const bgColor = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
    drawRect(doc, margin, y, contentWidth, 22, bgColor);

    doc.font('Helvetica').fontSize(9).fillColor('#333333');
    doc.text(String(idx + 1), cols[0].x, y + 5, { width: cols[0].w, align: 'center' });
    doc.text(item.name, cols[1].x, y + 5, { width: cols[1].w, align: 'left' });
    doc.text(generateHSN(), cols[2].x, y + 5, { width: cols[2].w, align: 'center' });
    doc.text(String(item.quantity), cols[3].x, y + 5, { width: cols[3].w, align: 'center' });
    doc.text(INR(item.price), cols[4].x, y + 5, { width: cols[4].w, align: 'right' });
    doc.text(INR(taxableValue), cols[5].x, y + 5, { width: cols[5].w, align: 'right' });
    doc.text(INR(cgstAmount), cols[6].x, y + 5, { width: cols[6].w, align: 'right' });
    doc.text(INR(sgstAmount), cols[7].x, y + 5, { width: cols[7].w, align: 'right' });
    y += 24;
  });

  drawLine(doc, margin, y, pageWidth - margin);
  y += 12;

  const summaryX = margin + 310;
  const summaryLabelW = 120;
  const summaryValueW = 100;

  doc.font('Helvetica').fontSize(9).fillColor('#444444');

  doc.text('Subtotal', summaryX, y, { width: summaryLabelW, align: 'left' });
  doc.text(INR(orderData.subtotal), summaryX + summaryLabelW, y, { width: summaryValueW, align: 'right' });
  y += 16;

  if (orderData.discount > 0) {
    doc.text('Discount', summaryX, y, { width: summaryLabelW, align: 'left' });
    doc.text(`-${INR(orderData.discount)}`, summaryX + summaryLabelW, y, { width: summaryValueW, align: 'right' });
    y += 16;
  }

  doc.text('Shipping', summaryX, y, { width: summaryLabelW, align: 'left' });
  doc.text(INR(orderData.shipping), summaryX + summaryLabelW, y, { width: summaryValueW, align: 'right' });
  y += 16;

  doc.text('Tax (GST)', summaryX, y, { width: summaryLabelW, align: 'left' });
  doc.text(INR(orderData.tax), summaryX + summaryLabelW, y, { width: summaryValueW, align: 'right' });
  y += 20;

  drawLine(doc, summaryX, y, summaryX + summaryLabelW + summaryValueW);
  y += 8;

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a2e');
  doc.text('Total', summaryX, y, { width: summaryLabelW, align: 'left' });
  doc.text(INR(orderData.total), summaryX + summaryLabelW, y, { width: summaryValueW, align: 'right' });
  y += 24;

  drawLine(doc, margin, y, pageWidth - margin);
  y += 12;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a2e');
  doc.text('Payment Information', margin, y);
  y += 16;

  doc.font('Helvetica').fontSize(9).fillColor('#444444');
  doc.text(`Payment Method: ${orderData.paymentMethod}`, margin, y);
  y += 14;
  doc.text(`Payment Status: ${orderData.paymentStatus}`, margin, y);
  y += 20;

  drawLine(doc, margin, y, pageWidth - margin);
  y += 12;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a2e');
  doc.text('Terms & Conditions', margin, y);
  y += 16;

  doc.font('Helvetica').fontSize(8).fillColor('#666666');
  const terms = [
    '1. This is a computer-generated invoice and does not require a physical signature.',
    '2. All disputes arising from this invoice shall be subject to the jurisdiction of local courts.',
    '3. Goods once sold will not be returned or exchanged unless there is a manufacturing defect.',
    '4. Payment is due as per the agreed payment terms.',
    '5. Prices are inclusive of applicable taxes unless stated otherwise.',
  ];
  terms.forEach(term => {
    doc.text(term, margin, y, { width: contentWidth });
    y += 12;
  });

  y += 10;
  drawLine(doc, margin, y, pageWidth - margin);
  y += 8;
  doc.font('Helvetica').fontSize(8).fillColor('#999999');
  doc.text('Thank you for your business!', margin, y, { width: contentWidth, align: 'center' });

  return collectStream(doc);
}

export async function generateShippingLabel(
  shipmentData: {
    trackingNumber: string;
    courierPartner: string;
    weight?: number;
  },
  orderData: {
    orderNumber: string;
  },
  customerData: {
    name: string;
    phone: string;
  },
  addressData: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  },
  companySettings: {
    storeName?: string;
    address?: string;
    phone?: string;
  }
): Promise<Buffer> {
  const doc = new PDFDocument({ size: [400, 600], margin: 30 });
  const pageWidth = 400;
  const margin = 30;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  drawRect(doc, margin, y, contentWidth, 40, '#1a1a2e');
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff');
  doc.text('SHIPPING LABEL', margin, y + 12, { width: contentWidth, align: 'center' });
  y += 52;

  const sectionPadding = 10;
  const boxWidth = contentWidth / 2 - 5;

  const fromX = margin;
  const toX = margin + boxWidth + 10;

  doc.rect(fromX, y, boxWidth, 120).stroke();
  doc.rect(toX, y, boxWidth, 120).stroke();

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a2e');
  doc.text('FROM', fromX + 8, y + 8);
  doc.font('Helvetica').fontSize(9).fillColor('#444444');

  let fromY = y + 24;
  if (companySettings.storeName) {
    doc.font('Helvetica-Bold').text(companySettings.storeName, fromX + 8, fromY, { width: boxWidth - 16 });
    fromY += 14;
    doc.font('Helvetica');
  }
  if (companySettings.address) {
    doc.text(companySettings.address, fromX + 8, fromY, { width: boxWidth - 16 });
    fromY += doc.heightOfString(companySettings.address, { width: boxWidth - 16 }) + 4;
  }
  if (companySettings.phone) {
    doc.text(`Ph: ${companySettings.phone}`, fromX + 8, fromY, { width: boxWidth - 16 });
  }

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a2e');
  doc.text('TO', toX + 8, y + 8);
  doc.font('Helvetica').fontSize(9).fillColor('#444444');

  let toY = y + 24;
  doc.font('Helvetica-Bold').text(addressData.fullName, toX + 8, toY, { width: boxWidth - 16 });
  toY += 14;
  doc.font('Helvetica');
  doc.text(`Ph: ${addressData.phone}`, toX + 8, toY, { width: boxWidth - 16 });
  toY += 14;
  doc.text(addressData.line1, toX + 8, toY, { width: boxWidth - 16 });
  toY += 14;
  if (addressData.line2) {
    doc.text(addressData.line2, toX + 8, toY, { width: boxWidth - 16 });
    toY += 14;
  }
  doc.text(`${addressData.city}, ${addressData.state} - ${addressData.pincode}`, toX + 8, toY, { width: boxWidth - 16 });
  toY += 14;
  doc.text(addressData.country, toX + 8, toY, { width: boxWidth - 16 });

  y += 132;

  drawLine(doc, margin, y, pageWidth - margin);
  y += 12;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a2e');
  doc.text(`Order ID: ${orderData.orderNumber}`, margin, y, { width: contentWidth, align: 'center' });
  y += 20;

  doc.font('Helvetica').fontSize(9).fillColor('#444444');
  doc.text(`Courier Partner: ${shipmentData.courierPartner}`, margin, y, { width: contentWidth, align: 'center' });
  y += 16;

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a1a2e');
  doc.text(`Tracking: ${shipmentData.trackingNumber}`, margin, y, { width: contentWidth, align: 'center' });
  y += 20;

  if (shipmentData.weight) {
    doc.font('Helvetica').fontSize(9).fillColor('#444444');
    doc.text(`Weight: ${shipmentData.weight} kg`, margin, y, { width: contentWidth, align: 'center' });
    y += 16;
  }

  drawLine(doc, margin, y, pageWidth - margin);
  y += 12;

  const barcodeY = y;
  doc.font('Helvetica').fontSize(8).fillColor('#888888');
  doc.text('||| ||| || |||| | ||| || |||', margin, barcodeY, { width: contentWidth, align: 'center' });
  y += 20;

  doc.font('Helvetica').fontSize(8).fillColor('#999999');
  doc.text(shipmentData.trackingNumber, margin, y, { width: contentWidth, align: 'center' });

  return collectStream(doc);
}
