import type {Contact,ContactPhone,ContactRole} from '../../types/domain.ts';
import {candidateIsExecutable,executablePhones,issueCounts,type ImportCandidate} from './deviceImport.ts';

export interface PlannedImportRow{contact:Contact;phones:ContactPhone[]}
export interface ImportReport{people:number;phones:number;problems:number;invalid:number;duplicates:number;storedConflicts:number;batchConflicts:number;unselected:number}
export interface ImportPlan{values:PlannedImportRow[];report:ImportReport}
export interface LateStoredConflict{normalized:string;contactIds:string[]}

export function filterImportCandidates(candidates:readonly ImportCandidate[],query:string):ImportCandidate[]{
  const needle=query.trim().toLocaleLowerCase('ar-KW');return candidates.filter(candidate=>!needle||candidate.name.toLocaleLowerCase('ar-KW').includes(needle)||
    candidate.phones.some(phone=>phone.display.includes(needle)||phone.normalized.includes(needle)));
}

export function selectedHasRoleOverrides(selected:ReadonlySet<string>,overrides:ReadonlyMap<string,ContactRole>):boolean{
  for(const key of selected)if(overrides.has(key))return true;return false;
}

export function resetSelectedRoleOverrides(selected:ReadonlySet<string>,overrides:ReadonlyMap<string,ContactRole>):Map<string,ContactRole>{
  const next=new Map(overrides);for(const key of selected)next.delete(key);return next;
}

export function buildImportPlan({candidates,selected,assignments,defaultRole,roleOverrides,now,createIdentifier}:{
  candidates:readonly ImportCandidate[];selected:ReadonlySet<string>;assignments:ReadonlyMap<string,string>;defaultRole:ContactRole;
  roleOverrides:ReadonlyMap<string,ContactRole>;now:string;createIdentifier:(prefix:string)=>string;
}):ImportPlan{
  let invalid=0;let duplicates=0;let storedConflicts=0;let batchConflicts=0;let phoneCount=0;const values:PlannedImportRow[]=[];
  for(const candidate of candidates){if(!selected.has(candidate.key)||!candidateIsExecutable(candidate,assignments))continue;const usable=executablePhones(candidate,assignments);const counts=issueCounts(candidate,assignments);
    invalid+=counts.invalid;duplicates+=counts.duplicates;storedConflicts+=counts.storedConflicts;batchConflicts+=counts.batchConflicts;
    const contactId=createIdentifier('contact');const primary=usable[0];if(!primary)continue;phoneCount+=usable.length;
    const contact:Contact={id:contactId,name:candidate.name,phone:primary.normalized,role:roleOverrides.get(candidate.key)??defaultRole,notes:candidate.notes,source:'device',createdAt:now,updatedAt:now};
    const phones:ContactPhone[]=usable.map((phone,index)=>({id:createIdentifier('phone'),contactId,normalized:phone.normalized,display:phone.display,label:phone.label,isPrimary:index===0,createdAt:now,updatedAt:now}));
    values.push({contact,phones});
  }
  const problems=invalid+duplicates+storedConflicts+batchConflicts;return {values,report:{people:values.length,phones:phoneCount,problems,invalid,duplicates,storedConflicts,batchConflicts,unselected:candidates.length-selected.size}};
}

export function excludeKnownStoredConflicts(values:readonly PlannedImportRow[],ownersByNormalized:ReadonlyMap<string,readonly string[]>):{values:PlannedImportRow[];conflicts:LateStoredConflict[]}{
  const executable:PlannedImportRow[]=[];const conflicts:LateStoredConflict[]=[];
  for(const value of values){const remaining=value.phones.filter(phone=>{const contactIds=ownersByNormalized.get(phone.normalized)??[];if(!contactIds.length)return true;
      conflicts.push({normalized:phone.normalized,contactIds:[...contactIds]});return false});
    if(!remaining.length)continue;const retainedPrimary=remaining.find(phone=>phone.isPrimary)??remaining[0]!;const phones=remaining.map(phone=>({...phone,isPrimary:phone.id===retainedPrimary.id}));
    executable.push({contact:{...value.contact,phone:retainedPrimary.normalized},phones});
  }
  return {values:executable,conflicts};
}
