import type { Property } from '@/types/domain';

const typeAr: Record<Property['type'], string> = {
  apartment:'شقة', villa:'فيلا', floor:'دور', building:'بناية', office:'مكتب', shop:'محل', warehouse:'مخزن', chalet:'شاليه'
};
const furnishingAr: Record<Property['furnishing'], string> = {
  furnished:'مفروش', semi_furnished:'نصف مفروش', unfurnished:'غير مفروش'
};

export function createPropertyMessage(property: Property): string {
  const lines = [
    `🏠 ${property.title || `${typeAr[property.type]} للإيجار`}`,
    `📍 ${property.area}`,
    `💰 ${new Intl.NumberFormat('ar-KW').format(property.monthlyRent)} د.ك شهريًا`,
  ];
  if (property.bedrooms !== null) lines.push(`🛏️ ${property.bedrooms} غرف`);
  if (property.bathrooms !== null) lines.push(`🚿 ${property.bathrooms} حمام`);
  if (property.sizeSqm !== null) lines.push(`📐 ${property.sizeSqm} م²`);
  lines.push(`🪑 ${furnishingAr[property.furnishing]}`);
  if (property.paci) lines.push(`📌 PACI: ${property.paci}`);
  if (property.mapUrl) lines.push(`🗺️ الموقع: ${property.mapUrl}`);
  if (property.description) lines.push(`📝 ${property.description}`);
  return lines.join('\n');
}

