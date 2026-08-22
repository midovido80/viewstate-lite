import {parsePhoneNumberFromString,type CountryCode} from 'libphonenumber-js/max';

export interface ParsedPhone {normalized:string;display:string}

export function normalizePhone(input:string,defaultCountry:CountryCode='KW'):string|null{
  const display=input;
  const compact=input.trim();
  if(!compact)return null;
  const digits=compact.replace(/\D/g,'');
  let candidate:string;
  if(/^\+/.test(compact))candidate=`+${digits}`;
  else if(/^00/.test(compact))candidate=`+${digits.slice(2)}`;
  else if(digits.length===8&&defaultCountry==='KW')candidate=`+965${digits}`;
  else return null;
  const parsed=parsePhoneNumberFromString(candidate);
  return parsed?.isPossible()&&parsed.number.length<=16?parsed.number:null;
}

export function parsePhone(input:string,defaultCountry:CountryCode='KW'):ParsedPhone|null{
  const normalized=normalizePhone(input,defaultCountry);
  return normalized?{normalized,display:input}:null;
}

export const phoneSearchDigits=(input:string)=>input.replace(/\D/g,'');

export function validatePhoneSet(phones:readonly {normalized:string;isPrimary:boolean}[]):void{
  if(!phones.length)throw new Error('At least one phone is required');
  if(phones.filter(phone=>phone.isPrimary).length!==1)throw new Error('Exactly one primary phone is required');
  if(new Set(phones.map(phone=>phone.normalized)).size!==phones.length)throw new Error('Duplicate phone for contact');
}

/** @deprecated Kuwait-compatible alias retained for existing callers during LITE-03A2. */
export const normalizeKuwaitPhone=(input:string)=>normalizePhone(input,'KW');
