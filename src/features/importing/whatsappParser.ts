import {KUWAIT_AREA_GROUPS,normalizeAreaSearch} from '../../data/kuwaitAreas.ts';
import type {Furnishing,PropertyType} from '../../types/domain.ts';

export type WhatsAppImportKind = 'requirement' | 'property';

export interface ParsedWhatsAppText {
  kind: WhatsAppImportKind;
  propertyType: PropertyType;
  area: string;
  minRent: number | null;
  maxRent: number | null;
  monthlyRent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnishing: Furnishing;
  phone: string;
  paci: string;
  mapUrl: string;
  sourceText: string;
  missing: Array<'area'|'rent'>;
}

const propertyTypes: Array<{value:PropertyType;patterns:RegExp[]}> = [
  {value:'apartment',patterns:[/شقه|شقة/i,/apartment|flat/i]},
  {value:'villa',patterns:[/فيلا/i,/villa/i]},
  {value:'floor',patterns:[/\bدور\b/i,/\bfloor\b/i]},
  {value:'building',patterns:[/بنايه|بناية|عماره|عمارة/i,/building/i]},
  {value:'office',patterns:[/مكتب/i,/office/i]},
  {value:'shop',patterns:[/محل/i,/shop/i]},
  {value:'warehouse',patterns:[/مخزن/i,/warehouse|storehouse/i]},
  {value:'chalet',patterns:[/شاليه/i,/chalet/i]},
];

const areaAliases: Record<string,string> = {
  farwaniya:'الفروانية', salmiya:'السالمية', hawally:'حولي', jabriya:'الجابرية',
  khaitan:'خيطان', mahboula:'المهبولة', mangaf:'المنقف', fahaheel:'الفحيحيل',
  sabahalsalem:'صباح السالم', jahra:'الجهراء الجديدة',
};

export function parseWhatsAppText(sourceText:string): ParsedWhatsAppText {
  const text=sourceText.trim();
  const normalized=normalizeAreaSearch(text);
  const kind:WhatsAppImportKind=/مطلوب|يبحث|ابحث|wanted|looking\s+for|required/i.test(text)?'requirement':'property';
  const propertyType=propertyTypes.find(item=>item.patterns.some(pattern=>pattern.test(text)))?.value??'apartment';
  const area=findArea(normalized);
  const [rangeMin,rangeMax]=findRentRange(text);
  const monthlyRent=kind==='property'?(rangeMin??findSingleRent(text)):null;
  const minRent=kind==='requirement'?(rangeMin??findSingleRent(text)):null;
  const maxRent=kind==='requirement'?(rangeMax??minRent):null;
  const bedrooms=findCount(text,'bedrooms');
  const bathrooms=findCount(text,'bathrooms');
  const furnishing:Furnishing=/غير\s*مفروش|unfurnished/i.test(text)?'unfurnished'
    :/نصف\s*مفروش|semi[-\s]?furnished/i.test(text)?'semi_furnished'
    :/مفروش|furnished/i.test(text)?'furnished':'any';
  const mapUrl=text.match(/https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[^\s/]+)[^\s]+/i)?.[0]??'';
  const paci=text.match(/(?:PACI|الرقم\s*(?:الآلي|الالي))\D{0,10}(\d{8,12})/i)?.[1]??'';
  const phone=(text.match(/\+?965[\s-]?\d{4}[\s-]?\d{4}/)?.[0]
    ??text.match(/(?:^|\D)([569]\d{7})(?!\d)/)?.[1]??'').replace(/[\s-]/g,'');
  const rent=kind==='property'?monthlyRent:minRent;
  return {kind,propertyType,area,minRent,maxRent,monthlyRent,bedrooms,bathrooms,
    furnishing,phone,paci,mapUrl,sourceText:text,missing:[...(!area?['area' as const]:[]),...(!rent?['rent' as const]:[])]};
}

function findArea(normalizedText:string):string {
  const areas=KUWAIT_AREA_GROUPS.flatMap(group=>group.areas).sort((a,b)=>b.length-a.length);
  const exact=areas.find(area=>normalizedText.includes(normalizeAreaSearch(area)));
  if(exact)return exact;
  const collapsed=normalizedText.replace(/\s/g,'');
  const alias=Object.entries(areaAliases).find(([name])=>collapsed.includes(name));
  return alias?.[1]??'';
}

function findRentRange(text:string):[number|null,number|null] {
  const match=text.match(/(?:من|between)?\s*(\d{2,4})\s*(?:إلى|الى|لغاية|حتى|[-–]|to|and)\s*(\d{2,4})/i);
  if(!match)return[null,null];
  const first=Number(match[1]);const second=Number(match[2]);
  if(!validRent(first)||!validRent(second))return[null,null];
  return first<=second?[first,second]:[second,first];
}

function findSingleRent(text:string):number|null {
  const direct=text.match(/(?:إيجار|الايجار|الإيجار|ميزانية|الميزانيه|budget|rent)\D{0,18}(\d{2,4})/i)?.[1]
    ??text.match(/(\d{2,4})\s*(?:د\.?\s*ك|دينار|kwd)/i)?.[1];
  const value=direct?Number(direct):NaN;
  return validRent(value)?value:null;
}

function validRent(value:number):boolean{return Number.isFinite(value)&&value>=50&&value<=9999}

function findCount(text:string,field:'bedrooms'|'bathrooms'):number|null {
  const pattern=field==='bedrooms'?/(\d{1,2})\s*(?:غرف|غرفة|bedrooms?|beds?)/i:/(\d{1,2})\s*(?:حمام|حمامات|bathrooms?|baths?)/i;
  const numeric=text.match(pattern)?.[1];if(numeric)return bounded(Number(numeric));
  const words=field==='bedrooms'
    ?[['غرفه واحده',1],['غرفة واحدة',1],['غرفتين',2],['ثلاث غرف',3],['اربع غرف',4],['أربع غرف',4]] as const
    :[['حمام واحد',1],['حمامين',2],['ثلاث حمامات',3],['اربع حمامات',4],['أربع حمامات',4]] as const;
  const normalized=normalizeAreaSearch(text);
  return words.find(([word])=>normalized.includes(normalizeAreaSearch(word)))?.[1]??null;
}

function bounded(value:number):number|null{return Number.isInteger(value)&&value>=1&&value<=20?value:null}
