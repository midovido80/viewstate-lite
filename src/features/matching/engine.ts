import type {MatchCriterion,MatchResult,Property,Requirement} from '@/types/domain';

export const MINIMUM_MATCH_SCORE=70;
export const MAX_RENT_TOLERANCE_KWD=50;

const W={area:30,type:25,rent:25,bedrooms:12,bathrooms:8} as const;

function normalized(value:string):string{return value.trim().toLocaleLowerCase('ar-KW').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')}

function notSpecified(field:MatchCriterion['field'],label:string):MatchCriterion{
  return {field,label,weight:0,earned:0,state:'not_specified',explanation:'غير محدد في الطلب'};
}

function rentDistance(price:number,min:number|null,max:number|null):number{
  if(min!==null&&price<min)return min-price;
  if(max!==null&&price>max)return price-max;
  return 0;
}

function countCriterion(field:'bedrooms'|'bathrooms',label:string,requested:number|null,actual:number|null,weight:number):MatchCriterion{
  if(requested===null)return notSpecified(field,label);
  if(actual===null)return {field,label,weight,earned:0,state:'missed',explanation:`${label} غير مسجل في العقار`};
  const difference=Math.abs(actual-requested);
  if(difference===0)return {field,label,weight,earned:weight,state:'matched',explanation:`مطابق: ${actual}`};
  if(difference===1)return {field,label,weight,earned:Math.round(weight/2),state:'partial',explanation:`المطلوب ${requested}، العقار ${actual}`};
  return {field,label,weight,earned:0,state:'missed',explanation:`المطلوب ${requested}، العقار ${actual}`};
}

export function calculateMatch(requirement:Requirement,property:Property):MatchResult{
  const criteria:MatchCriterion[]=[];

  if(requirement.areas.length){
    const matched=requirement.areas.some(area=>normalized(area)===normalized(property.area));
    criteria.push({field:'area',label:'المنطقة',weight:W.area,earned:matched?W.area:0,state:matched?'matched':'missed',
      explanation:matched?`مطابقة: ${property.area}`:`العقار في ${property.area}`});
  }else criteria.push(notSpecified('area','المنطقة'));

  if(requirement.propertyTypes.length){
    const matched=requirement.propertyTypes.includes(property.type);
    criteria.push({field:'type',label:'نوع العقار',weight:W.type,earned:matched?W.type:0,state:matched?'matched':'missed',
      explanation:matched?'نوع العقار مطابق':'نوع العقار مختلف'});
  }else criteria.push(notSpecified('type','نوع العقار'));

  const hasRent=requirement.minRent!==null||requirement.maxRent!==null;
  const rentDelta=hasRent?rentDistance(property.monthlyRent,requirement.minRent,requirement.maxRent):0;
  if(!hasRent)criteria.push(notSpecified('rent','الإيجار'));
  else if(rentDelta===0)criteria.push({field:'rent',label:'الإيجار',weight:W.rent,earned:W.rent,state:'matched',explanation:'داخل الميزانية المطلوبة'});
  else if(rentDelta<=20)criteria.push({field:'rent',label:'الإيجار',weight:W.rent,earned:20,state:'partial',explanation:`خارج الميزانية بـ ${rentDelta} د.ك`});
  else if(rentDelta<=MAX_RENT_TOLERANCE_KWD)criteria.push({field:'rent',label:'الإيجار',weight:W.rent,earned:10,state:'partial',explanation:`خارج الميزانية بـ ${rentDelta} د.ك`});
  else criteria.push({field:'rent',label:'الإيجار',weight:W.rent,earned:0,state:'missed',explanation:`خارج الميزانية بـ ${rentDelta} د.ك`});

  criteria.push(countCriterion('bedrooms','الغرف',requirement.minBedrooms,property.bedrooms,W.bedrooms));
  criteria.push(countCriterion('bathrooms','الحمامات',requirement.minBathrooms,property.bathrooms,W.bathrooms));

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

export function findMatches(requirements:Requirement[],properties:Property[]):MatchResult[]{
  return requirements.flatMap(requirement=>properties.map(property=>calculateMatch(requirement,property)))
    .filter(match=>match.eligible&&match.score>=MINIMUM_MATCH_SCORE)
    .sort((a,b)=>b.score-a.score);
}
