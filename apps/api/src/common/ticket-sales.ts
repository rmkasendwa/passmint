export function isWithinSalesWindow(type: { salesStart: Date | null; salesEnd: Date | null }, now = new Date()) {
  return (!type.salesStart || type.salesStart <= now) && (!type.salesEnd || type.salesEnd > now);
}
