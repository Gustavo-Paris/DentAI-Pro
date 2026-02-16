export function getContralateral(tooth: string): string | null {
  const num = parseInt(tooth);
  if (num >= 11 && num <= 18) return String(num + 10);
  if (num >= 21 && num <= 28) return String(num - 10);
  if (num >= 31 && num <= 38) return String(num + 10);
  if (num >= 41 && num <= 48) return String(num - 10);
  return null;
}
