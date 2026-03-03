/** Known valid credit pack sizes — prevents tampered metadata from granting arbitrary credits */
export const VALID_CREDIT_PACK_SIZES = [5, 10, 25, 50, 100] as const;

export type CreditPackSize = typeof VALID_CREDIT_PACK_SIZES[number];

export function isValidCreditPackSize(value: number): value is CreditPackSize {
  return VALID_CREDIT_PACK_SIZES.includes(value as CreditPackSize);
}
