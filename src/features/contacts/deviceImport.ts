import {normalizePhone} from '../../lib/phone.ts';

/**
 * Device contact identity is user-owned data. Keep the display name and notes
 * exactly as the phone provides them; never translate, trim, or normalize them.
 */
export function preserveDeviceContactName(name:string|undefined|null,phone:string):string{
  return name&&name.length>0?name:phone;
}

export function preserveDeviceContactNotes(notes:string|undefined|null):string{
  return notes??'';
}

export interface DevicePhoneInput{number?:string|null;label?:string|null}
export interface PreparedDevicePhone{normalized:string;display:string;label:string}

export function prepareDevicePhones(values:readonly DevicePhoneInput[]):{phones:PreparedDevicePhone[];invalid:number;duplicates:number}{
  const phones:PreparedDevicePhone[]=[];const seen=new Set<string>();let invalid=0;let duplicates=0;
  for(const value of values){const display=value.number??'';const normalized=normalizePhone(display);if(!normalized){invalid++;continue}
    if(seen.has(normalized)){duplicates++;continue}seen.add(normalized);phones.push({normalized,display,label:value.label??''})}
  return {phones,invalid,duplicates};
}
