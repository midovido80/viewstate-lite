import {normalizePhone} from '../../lib/phone.ts';
import type {ContactRole} from '../../types/domain.ts';

/** Device-owned identity fields are never translated, trimmed, or rewritten. */
export function preserveDeviceContactName(name:string|undefined|null,phone:string):string{return name&&name.length>0?name:phone}
export function preserveDeviceContactNotes(notes:string|undefined|null):string{return notes??''}

export interface DevicePhoneInput{number?:string|null;label?:string|null;isPrimary?:boolean|null}
export interface DeviceContactInput{key:string;name?:string|null;notes?:string|null;phones:readonly DevicePhoneInput[]}
export interface PreparedDevicePhone{normalized:string;display:string;label:string}
export interface StoredPhoneOwner{normalized:string;contactId:string;contactName:string}
export interface ImportCandidatePhone extends PreparedDevicePhone{
  storedConflicts:StoredPhoneOwner[];
  batchContactKeys:string[];
}
export interface ImportCandidate{
  key:string;
  name:string;
  notes:string;
  phones:ImportCandidatePhone[];
  invalidDisplays:string[];
  duplicateDisplays:string[];
}
export interface ImportIssueCounts{invalid:number;duplicates:number;storedConflicts:number;batchConflicts:number}

export function prepareDevicePhones(values:readonly DevicePhoneInput[]):{phones:PreparedDevicePhone[];invalid:number;duplicates:number}{
  const prepared=preparePhoneValues(values);return {phones:prepared.phones,invalid:prepared.invalidDisplays.length,duplicates:prepared.duplicateDisplays.length};
}

function preparePhoneValues(values:readonly DevicePhoneInput[]):Pick<ImportCandidate,'invalidDisplays'|'duplicateDisplays'>&{phones:PreparedDevicePhone[]}{
  const phones:PreparedDevicePhone[]=[];const phoneIndexes=new Map<string,number>();const phoneRanks=new Map<string,number>();const invalidDisplays:string[]=[];const duplicateDisplays:string[]=[];
  for(const value of values){const display=value.number??'';const normalized=normalizePhone(display);
    if(!normalized){invalidDisplays.push(display);continue}
    const rank=phonePreference(value);const existingIndex=phoneIndexes.get(normalized);
    // Android may expose one real number several times for Message, Voice call,
    // Video call or voicemail services. These are aliases, not user duplicates.
    if(existingIndex!==undefined){if(rank>(phoneRanks.get(normalized)??0)){phones[existingIndex]={normalized,display,label:value.label??''};phoneRanks.set(normalized,rank)}continue}
    phoneIndexes.set(normalized,phones.length);phoneRanks.set(normalized,rank);phones.push({normalized,display,label:value.label??''});}
  return {phones,invalidDisplays,duplicateDisplays};
}

function phonePreference(value:DevicePhoneInput):number{
  if(value.isPrimary)return 3;
  return /mobile|cell|personal|جوال|موبايل|هاتف/i.test(value.label??'')?2:1;
}

type PreparedContactRow={input:DeviceContactInput;prepared:ReturnType<typeof preparePhoneValues>};

function finalizeCandidates(base:readonly PreparedContactRow[],owners:readonly StoredPhoneOwner[]):ImportCandidate[]{
  const ownerMap=new Map<string,StoredPhoneOwner[]>();for(const owner of owners){const current=ownerMap.get(owner.normalized)??[];current.push(owner);ownerMap.set(owner.normalized,current)}
  const deviceNumberOwners=new Map<string,string[]>();for(const row of base)for(const phone of row.prepared.phones){
    if(ownerMap.has(phone.normalized))continue;const keys=deviceNumberOwners.get(phone.normalized)??[];if(!keys.includes(row.input.key))keys.push(row.input.key);deviceNumberOwners.set(phone.normalized,keys)}
  return base.map(({input,prepared})=>({key:input.key,name:preserveDeviceContactName(input.name,prepared.phones[0]?.display??input.phones[0]?.number??''),notes:preserveDeviceContactNotes(input.notes),
    phones:prepared.phones.map(phone=>({...phone,storedConflicts:ownerMap.get(phone.normalized)??[],batchContactKeys:deviceNumberOwners.get(phone.normalized)??[input.key]})),
    invalidDisplays:prepared.invalidDisplays,duplicateDisplays:prepared.duplicateDisplays}));
}

export function prepareDeviceContactRows(inputs:readonly DeviceContactInput[],owners:readonly StoredPhoneOwner[]):ImportCandidate[]{
  return finalizeCandidates(inputs.filter(input=>input.phones.length>0).map(input=>({input,prepared:preparePhoneValues(input.phones)})),owners)}

export async function prepareDeviceContactRowsChunked(inputs:readonly DeviceContactInput[],owners:readonly StoredPhoneOwner[],chunkSize=100,
  yieldToUi:()=>Promise<void>=()=>new Promise(resolve=>setTimeout(resolve,0))):Promise<ImportCandidate[]>{
  const prepared:PreparedContactRow[]=[];for(let index=0;index<inputs.length;index+=chunkSize){for(const input of inputs.slice(index,index+chunkSize))if(input.phones.length)prepared.push({input,prepared:preparePhoneValues(input.phones)});if(index+chunkSize<inputs.length)await yieldToUi()}
  return finalizeCandidates(prepared,owners);
}

export function executablePhones(candidate:ImportCandidate,assignments:ReadonlyMap<string,string>):ImportCandidatePhone[]{return candidate.phones.filter(phone=>
  phone.storedConflicts.length===0&&(phone.batchContactKeys.length===1||assignments.get(phone.normalized)===candidate.key))}

export function candidateIsExecutable(candidate:ImportCandidate,assignments:ReadonlyMap<string,string>):boolean{return executablePhones(candidate,assignments).length>0}

export function selectExecutable(current:ReadonlySet<string>,visible:readonly ImportCandidate[],assignments:ReadonlyMap<string,string>):Set<string>{
  const next=new Set(current);for(const candidate of visible)if(candidateIsExecutable(candidate,assignments))next.add(candidate.key);return next}
export function clearVisibleSelection(current:ReadonlySet<string>,visible:readonly ImportCandidate[]):Set<string>{
  const next=new Set(current);for(const candidate of visible)next.delete(candidate.key);return next}
export function removeNonExecutableSelection(current:ReadonlySet<string>,candidates:readonly ImportCandidate[],assignments:ReadonlyMap<string,string>):Set<string>{
  const next=new Set(current);for(const candidate of candidates)if(next.has(candidate.key)&&!candidateIsExecutable(candidate,assignments))next.delete(candidate.key);return next}

export function issueCounts(candidate:ImportCandidate,assignments:ReadonlyMap<string,string>):ImportIssueCounts{
  let storedConflicts=0;let batchConflicts=0;for(const phone of candidate.phones){if(phone.storedConflicts.length)storedConflicts++;
    else if(phone.batchContactKeys.length>1&&assignments.get(phone.normalized)!==candidate.key)batchConflicts++}
  return {invalid:candidate.invalidDisplays.length,duplicates:candidate.duplicateDisplays.length,storedConflicts,batchConflicts};
}

export function resolvedRole(candidateKey:string,defaultRole:ContactRole,overrides:ReadonlyMap<string,ContactRole>):ContactRole{return overrides.get(candidateKey)??defaultRole}
