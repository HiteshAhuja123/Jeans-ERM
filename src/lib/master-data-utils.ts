export function isCodeUnique<T extends { id: string; code: string }>(
  list: T[],
  code: string,
  excludeId?: string,
): boolean {
  const normalized = code.trim().toLowerCase();
  return !list.some((item) => item.id !== excludeId && item.code.trim().toLowerCase() === normalized);
}

export function isSkuComboUnique<T extends { id: string; styleId: string; colorId: string; sizeId: string }>(
  list: T[],
  styleId: string,
  colorId: string,
  sizeId: string,
  excludeId?: string,
): boolean {
  return !list.some(
    (item) =>
      item.id !== excludeId &&
      item.styleId === styleId &&
      item.colorId === colorId &&
      item.sizeId === sizeId,
  );
}
