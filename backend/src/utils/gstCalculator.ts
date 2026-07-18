export function calculateGST(unitPrice: number, quantity: number, discount: number, gstRate: number) {
  const taxableValue = (unitPrice * quantity) - discount;
  const cgst = (taxableValue * gstRate) / 200;
  const sgst = (taxableValue * gstRate) / 200;
  const total = taxableValue + cgst + sgst;
  return { taxableValue: Math.round(taxableValue * 100) / 100, cgst: Math.round(cgst * 100) / 100, sgst: Math.round(sgst * 100) / 100, total: Math.round(total * 100) / 100 };
}
