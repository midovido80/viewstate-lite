export function normalizeKuwaitPhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('00965')) digits = digits.slice(5);
  else if (digits.startsWith('965')) digits = digits.slice(3);
  if (digits.length !== 8) return null;
  return `+965${digits}`;
}

