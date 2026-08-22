import type {MatchCriterion,MatchResult,Property,Requirement} from '@/types/domain';

export const MINIMUM_MATCH_SCORE=70;
export const MAX_RENT_TOLERANCE_KWD=50;

const W={area:30,type:25,rent:25,bedrooms:12,bathrooms:8} as const;

function normalized(value:string):string{return value.trim().toLocaleLowerCase('ar-KW').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')}

type MatchLanguage='ar'|'en';
const labels={ar:{area:'المنطقة',type:'نوع العقار',rent:'الإيجار',bedrooms:'الغرف',bathrooms:'الحمامات'},en:{area:'Area',type:'Property type',rent:'Rent',bedrooms:'Bedrooms',bathrooms:'Bathrooms'}} as const;
function notSpecified(field:MatchCriterion['field'],label:string,language:MatchLanguage):MatchCriterion{
  return {field,label,weight:0,earned:0,state:'not_specified',explanation:language==='ar'?'غير محدد في الطلب':'Not specified in the requirement'};
}

function rentDistance(price:number,min:number|null,max:number|null):number{
  if(min!==null&&price<min)return min-price;
  if(max!==null&&price>max)return price-max;
  return 0;
}

function countCriterion(field:'bedrooms'|'bathrooms',label:string,requested:number|null,actual:number|null,weight:number,language:MatchLanguage):MatchCriterion{
  if(requested===null)return notSpecified(field,label,language);
  if(actual===null)return {field,label,weight,earned:0,state:'missed',explanation:language==='ar'?`${label} غير مسجل في العقار`:`${label} not recorded for the property`};
  const difference=Math.abs(actual-requested);
  if(difference===0)return {field,label,weight,earned:weight,state:'matched',explanation:language==='ar'?`مطابق: ${actual}`:`Matched: ${actual}`};
  const explanation=language==='ar'?`المطلوب ${requested}، العقار ${actual}`:`Required ${requested}; property has ${actual}`;
  if(difference===1)return {field,label,weight,earned:Math.round(weight/2),state:'partial',explanation};
  return {field,label,weight,earned:0,state:'missed',explanation};
}

export function calculateMatch(requirement:Requirement,property:Property,language:MatchLanguage='ar'):MatchResult{
  const criteria:MatchCriterion[]=[];
  const l=labels[language];

  if(requirement.areas.length){
    const matched=requirement.areas.some(area=>normalized(area)===normalized(property.area));
    criteria.push({field:'area',label:l.area,weight:W.area,earned:matched?W.area:0,state:matched?'matched':'missed',
      explanation:matched?(language==='ar'?`مطابقة: ${property.area}`:`Matched: ${property.area}`):(language==='ar'?`العقار في ${property.area}`:`Property is in ${property.area}`)});
  }else criteria.push(notSpecified('area',l.area,language));

  if(requirement.propertyTypes.length){
    const matched=requirement.propertyTypes.includes(property.type);
    criteria.push({field:'type',label:l.type,weight:W.type,earned:matched?W.type:0,state:matched?'matched':'missed',
      explanation:language==='ar'?(matched?'نوع العقار مطابق':'نوع العقار مختلف'):(matched?'Property type matches':'Different property type')});
  }else criteria.push(notSpecified('type',l.type,language));

  const hasRent=requirement.minRent!==null||requirement.maxRent!==null;
  const rentDelta=hasRent?rentDistance(property.monthlyRent,requirement.minRent,requirement.maxRent):0;
  const rentOutside=language==='ar'?`خارج الميزانية بـ ${rentDelta} د.ك`:`KWD ${rentDelta} outside budget`;
  if(!hasRent)criteria.push(notSpecified('rent',l.rent,language));
  else if(rentDelta===0)criteria.push({field:'rent',label:l.rent,weight:W.rent,earned:W.rent,state:'matched',explanation:language==='ar'?'داخل الميزانية المطلوبة':'Within the requested budget'});
  else if(rentDelta<=20)criteria.push({field:'rent',label:l.rent,weight:W.rent,earned:20,state:'partial',explanation:rentOutside});
  else if(rentDelta<=MAX_RENT_TOLERANCE_KWD)criteria.push({field:'rent',label:l.rent,weight:W.rent,earned:10,state:'partial',explanation:rentOutside});
  else criteria.push({field:'rent',label:l.rent,weight:W.rent,earned:0,state:'missed',explanation:rentOutside});

  criteria.push(countCriterion('bedrooms',l.bedrooms,requirement.minBedrooms,property.bedrooms,W.bedrooms,language));
  criteria.push(countCriterion('bathrooms',l.bathrooms,requirement.minBathrooms,property.bathrooms,W.bathrooms,language));

  const evaluated=criteria.filter(item=>item.state!=='not_specified');
  const possible=evaluated.reduce((sum,item)=>sum+item.weight,0);
  const earned=evaluated.reduce((sum,item)=>sum+item.earned,0);
  const score=possible?Math.min(100,Math.round(earned/possible*100)):0;
  const areaOk=!requirement.areas.length||criteria.find(item=>item.field==='area')?.state==='matched';
  const typeOk=!requirement.propertyTypes.length||criteria.find(item=>item.field==='type')?.state==='matched';
  const rentOk=!hasRent||rentDelta<=MAX_RENT_TOLERANCE_KWD;
  return {propertyId:property.id,requirementId:requirement.id,score,criteria,evaluatedCriteria:evaluated.length,
    eligible:property.status==='available'&&Boolean(areaOk)&&Boolean(typeOk)&&rentOk};
}

export function findMatches(requirements:Requirement[],properties:Property[],language:MatchLanguage='ar'):MatchResult[]{
  return requirements.flatMap(requirement=>properties.map(property=>calculateMatch(requirement,property,language)))
    .filter(match=>match.eligible&&match.score>=MINIMUM_MATCH_SCORE)
    .sort((a,b)=>b.score-a.score);
}
