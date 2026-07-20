const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED', 'REFUNDED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export const validateTransition = (currentStatus: string, newStatus: string): boolean => {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
};

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'];
