import type { Property } from '@/types/domain';
import {activityLabel} from '../properties/propertyFields.ts';

const typeAr: Record<Property['type'], string> = {
  apartment:'شقة', villa:'فيلا', floor:'دور', building:'بناية', office:'مكتب', shop:'محل', warehouse:'مخزن', chalet:'شاليه'
};
const furnishingAr: Record<Property['furnishing'], string> = {
  furnished:'مفروش', semi_furnished:'نصف مفروش', unfurnished:'غير مفروش'
};

export interface PropertyMessageOptions {
  includeDescription?: boolean;
  includePaci?: boolean;
  includeLocation?: boolean;
}

export function createPropertyMessage(property: Property,options:PropertyMessageOptions={}): string {
  const {includeDescription=true,includePaci=false,includeLocation=false}=options;
  const lines = [
    `🏠 ${property.title || `${typeAr[property.type]} للإيجار`}`,
    `📍 ${property.area}`,
    `💰 ${new Intl.NumberFormat('ar-KW').format(property.monthlyRent)} د.ك شهريًا`,
  ];
  if (property.bedrooms !== null) lines.push(`🛏️ ${property.bedrooms} غرف`);
  if (property.bathrooms !== null) lines.push(`🚿 ${property.bathrooms} حمام`);
  if (property.paciNumberCount !== null) lines.push(`🔢 ${property.paciNumberCount} أرقام آلية`);
  const activity=activityLabel(property.activityType);
  if (activity) lines.push(`💼 النشاط: ${activity}`);
  if (property.sizeSqm !== null) lines.push(`📐 ${property.sizeSqm} م²`);
  lines.push(`🪑 ${furnishingAr[property.furnishing]}`);
  if (includePaci&&property.paci) lines.push(`📌 PACI: ${property.paci}`);
  if (includeLocation&&property.mapUrl) lines.push(`🗺️ الموقع: ${property.mapUrl}`);
  if (includeDescription&&property.description) lines.push(`📝 ${property.description}`);
  return lines.join('\n');
}
