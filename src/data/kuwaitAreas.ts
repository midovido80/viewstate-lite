export interface KuwaitAreaGroup {
  governorate: string;
  areas: readonly string[];
}

export const KUWAIT_AREA_GROUPS: readonly KuwaitAreaGroup[] = [
  {
    governorate: 'محافظة العاصمة',
    areas: [
      'مدينة الكويت', 'الشرق', 'القبلة', 'المرقاب', 'دسمان', 'بنيد القار', 'الدعية', 'الدسمة',
      'الدوحة', 'ميناء الدوحة', 'الفيحاء', 'فيلكا', 'غرناطة', 'كيفان', 'الخالدية', 'المنصورية',
      'النهضة', 'شمال غرب الصليبيخات', 'النزهة', 'القادسية', 'قرطبة', 'الروضة', 'الشامية',
      'الشويخ', 'الشويخ السكنية', 'الشويخ الصناعية', 'ميناء الشويخ', 'الصليبخات', 'القيروان',
      'السرة', 'اليرموك', 'ضاحية عبدالله السالم', 'العديلية', 'الصالحية', 'الصوابر', 'الوطية',
      'حدائق السور', 'مدينة جابر الأحمد',
    ],
  },
  {
    governorate: 'محافظة حولي',
    areas: [
      'بيان', 'الجابرية', 'الرميثية', 'السلام', 'سلوى', 'البدع', 'أنجفة', 'حولي', 'ميدان حولي',
      'حطين', 'مشرف', 'ضاحية مبارك العبدالله', 'السالمية', 'الشعب', 'الشعب البحري', 'الشهداء',
      'الصديق', 'منطقة الوزارات', 'الزهراء', 'النقرة',
    ],
  },
  {
    governorate: 'محافظة مبارك الكبير',
    areas: [
      'أبو الحصانية', 'أبو فطيرة', 'العدان', 'القرين', 'القصور', 'الفنيطيس', 'المسيلة',
      'المسايل', 'مبارك الكبير', 'صباح السالم', 'صبحان', 'غرب أبو فطيرة الحرفية',
    ],
  },
  {
    governorate: 'محافظة الأحمدي',
    areas: [
      'الفنطاس', 'العقيلة', 'الظهر', 'المقوع', 'المهبولة', 'الرقة', 'هدية', 'أبو حليفة',
      'الصباحية', 'المنقف', 'الفحيحيل', 'الأحمدي', 'الوفرة', 'الزور', 'الخيران', 'ميناء عبدالله',
      'الوفرة الزراعية', 'بنيدر', 'الجليعة', 'الضباعية', 'ضاحية جابر العلي', 'ضاحية فهد الأحمد',
      'الشعيبة', 'واره', 'مدينة صباح الأحمد', 'النويصيب', 'مدينة الخيران',
      'ضاحية علي صباح السالم', 'مدينة صباح الأحمد البحرية',
    ],
  },
  {
    governorate: 'محافظة الفروانية',
    areas: [
      'أبرق خيطان', 'الأندلس', 'إشبيلية', 'جليب الشيوخ', 'خيطان', 'خيطان الجديدة', 'العمرية',
      'العارضية', 'العارضية الصناعية', 'العباسية', 'الفردوس', 'الفروانية', 'الحساوي', 'الشدادية',
      'الرابية', 'الرحاب', 'الرقعي', 'الري الصناعية', 'ضاحية صباح الناصر', 'ضاحية عبدالله المبارك',
      'غرب عبدالله المبارك', 'جنوب عبدالله المبارك', 'الضجيج',
    ],
  },
  {
    governorate: 'محافظة الجهراء',
    areas: [
      'مدينة نواف الأحمد', 'الصليبية', 'أمغرة', 'النعيم', 'القصر', 'الواحة', 'تيماء', 'النسيم',
      'العيون', 'القيصرية', 'العبدلي', 'الجهراء القديمة', 'الجهراء الجديدة', 'كاظمة',
      'مدينة سعد العبدالله', 'السالمي', 'المطلاع', 'مدينة الحرير', 'كبد', 'الروضتين', 'الصبية',
      'جزيرة بوبيان', 'جزيرة وربة',
    ],
  },
] as const;

export function normalizeAreaSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('ar-KW')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export function filterKuwaitAreaGroups(query: string): KuwaitAreaGroup[] {
  const normalizedQuery = normalizeAreaSearch(query);
  if (!normalizedQuery) return KUWAIT_AREA_GROUPS.map(group => ({...group, areas:[...group.areas]}));
  return KUWAIT_AREA_GROUPS
    .map(group => ({
      ...group,
      areas: group.areas.filter(area => {
        const normalizedArea=normalizeAreaSearch(area);
        return normalizedArea.includes(normalizedQuery)||isSubsequence(normalizedQuery,normalizedArea);
      }),
    }))
    .filter(group => group.areas.length > 0);
}

function isSubsequence(query:string,value:string):boolean {
  let queryIndex=0;
  for(const character of value){if(character===query[queryIndex])queryIndex+=1;if(queryIndex===query.length)return true}
  return false;
}

export function governorateForArea(area: string): string | null {
  return KUWAIT_AREA_GROUPS.find(group => group.areas.includes(area))?.governorate ?? null;
}
