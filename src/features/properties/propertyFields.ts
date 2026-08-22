import type {ActivityType,PropertyType} from '@/types/domain';

export const ACTIVITY_OPTIONS: readonly {value:ActivityType;label:string}[] = [
  {value:'company_headquarters',label:'مقر شركة'},
  {value:'educational_institute',label:'معهد تعليمي'},
  {value:'health_institute',label:'معهد صحي'},
  {value:'law_office',label:'مكتب محامي'},
  {value:'other',label:'نشاط آخر'},
] as const;

export function usesCommercialDetails(type: PropertyType): boolean {
  return type === 'floor' || type === 'office';
}

export function activityLabel(value: ActivityType | null): string | null {
  return ACTIVITY_OPTIONS.find(option=>option.value===value)?.label ?? null;
}
