import type { Property } from '@/types/domain';
import type {ActivityType,Furnishing,PropertyType} from '../../types/domain.ts';
type Language='ar'|'en';
const propertyTypes:Record<Language,Record<PropertyType,string>>={ar:{apartment:'شقة',villa:'فيلا',floor:'دور',building:'بناية',office:'مكتب',shop:'محل',warehouse:'مخزن',chalet:'شاليه'},en:{apartment:'Apartment',villa:'Villa',floor:'Floor',building:'Building',office:'Office',shop:'Shop',warehouse:'Warehouse',chalet:'Chalet'}};
const furnishings:Record<Language,Record<Furnishing,string>>={ar:{any:'أي',furnished:'مفروش',semi_furnished:'نصف مفروش',unfurnished:'غير مفروش'},en:{any:'Any',furnished:'Furnished',semi_furnished:'Semi-furnished',unfurnished:'Unfurnished'}};
const activities:Record<Language,Record<ActivityType,string>>={ar:{company_headquarters:'مقر شركة',educational_institute:'معهد تعليمي',health_institute:'معهد صحي',law_office:'مكتب محامي',other:'نشاط آخر'},en:{company_headquarters:'Company headquarters',educational_institute:'Educational institute',health_institute:'Health institute',law_office:'Law office',other:'Other activity'}};

export interface PropertyMessageOptions {
  includeDescription?: boolean;
  includePaci?: boolean;
  includeLocation?: boolean;
  language?: Language;
}

export function createPropertyMessage(property: Property,options:PropertyMessageOptions={}): string {
  const {includeDescription=true,includePaci=false,includeLocation=false,language='ar'}=options;
  const arabic=language==='ar';const currency=new Intl.NumberFormat(arabic?'ar-KW':'en-KW').format(property.monthlyRent);
  const lines = [
    `🏠 ${property.title || (arabic?`${propertyTypes[language][property.type]} للإيجار`:`${propertyTypes[language][property.type]} for rent`)}`,
    `📍 ${property.area}`,
    arabic?`💰 ${currency} د.ك شهريًا`:`💰 KWD ${currency} monthly`,
  ];
  if (property.blockNumber !== null) lines.splice(2,0,arabic?`🏘️ رقم القطعة: ${property.blockNumber}`:`🏘️ Block number: ${property.blockNumber}`);
  if (property.bedrooms !== null) lines.push(arabic?`🛏️ ${property.bedrooms} غرف`:`🛏️ ${property.bedrooms} bedrooms`);
  if (property.bathrooms !== null) lines.push(arabic?`🚿 ${property.bathrooms} حمام`:`🚿 ${property.bathrooms} bathrooms`);
  if (property.paciNumberCount !== null) lines.push(arabic?`🔢 ${property.paciNumberCount} أرقام آلية`:`🔢 ${property.paciNumberCount} PACI numbers`);
  const activity=property.activityType?activities[language][property.activityType]:null;
  if (activity) lines.push(arabic?`💼 النشاط: ${activity}`:`💼 Activity: ${activity}`);
  if (property.sizeSqm !== null) lines.push(`📐 ${property.sizeSqm} م²`);
  lines.push(`🪑 ${furnishings[language][property.furnishing]}`);
  if (includePaci&&property.paci) lines.push(`📌 PACI: ${property.paci}`);
  if (includeLocation&&property.mapUrl) lines.push(`🗺️ ${arabic?'الموقع':'Location'}: ${property.mapUrl}`);
  if (includeDescription&&property.description) lines.push(`📝 ${property.description}`);
  return lines.join('\n');
}
