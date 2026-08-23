import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareDeviceContactRows,selectExecutable} from '../src/features/contacts/deviceImport.ts';
import {buildImportPlan,excludeKnownStoredConflicts,filterImportCandidates,resetSelectedRoleOverrides,selectedHasRoleOverrides} from '../src/features/contacts/importPlan.ts';

test('domain import plan preserves identity, applies row roles, and reports every excluded phone category',()=>{
  const candidates=prepareDeviceContactRows([
    {key:'a',name:'  اسم أصلي  ',notes:' Note unchanged ',phones:[{number:'5555 1234',label:'هاتف شخصي'},{number:'+96555551234',label:'Duplicate label'},{number:'bad'},{number:'+971501234567',label:'Work'}]},
    {key:'b',name:'Second',notes:'',phones:[{number:'+96555551234',label:'Shared'},{number:'+966501234567',label:'Mobile'}]},
  ],[{normalized:'+971501234567',contactId:'saved',contactName:'Existing'}]);
  let sequence=0;const plan=buildImportPlan({candidates,selected:new Set(['a','b']),assignments:new Map([['+96555551234','a']]),defaultRole:'tenant',roleOverrides:new Map([['b','owner']]),now:'2026-08-22T00:00:00.000Z',createIdentifier:prefix=>`${prefix}:${++sequence}`});
  assert.deepEqual(plan.report,{people:2,phones:2,problems:3,invalid:1,duplicates:0,storedConflicts:1,batchConflicts:1,unselected:0});
  assert.equal(plan.values[0]!.contact.name,'  اسم أصلي  ');assert.equal(plan.values[0]!.contact.notes,' Note unchanged ');assert.equal(plan.values[0]!.contact.role,'tenant');
  assert.equal(plan.values[0]!.phones[0]!.display,'5555 1234');assert.equal(plan.values[0]!.phones[0]!.label,'هاتف شخصي');assert.equal(plan.values[1]!.contact.role,'owner');
});

test('search and select-visible preserve selections outside the current result',()=>{
  const candidates=prepareDeviceContactRows([{key:'a',name:'Ali',phones:[{number:'5555 1234'}]},{key:'b',name:'Bader',phones:[{number:'+966501234567'}]}],[]);
  const selected=new Set(['b']);const visible=filterImportCandidates(candidates,'Ali');const next=selectExecutable(selected,visible,new Map());
  assert.deepEqual(visible.map(row=>row.key),['a']);assert.deepEqual([...next].sort(),['a','b']);assert.deepEqual([...selected],['b']);
});

test('role reset needs confirmation only when selected rows contain overrides',()=>{
  const selected=new Set(['a']);const overrides=new Map([['a','owner' as const],['b','broker' as const]]);
  assert.equal(selectedHasRoleOverrides(selected,overrides),true);const reset=resetSelectedRoleOverrides(selected,overrides);assert.equal(reset.has('a'),false);assert.equal(reset.get('b'),'broker');
  assert.equal(selectedHasRoleOverrides(new Set(['c']),overrides),false);
});

test('late known conflicts exclude only affected phones and rows without blocking unrelated executable rows',()=>{
  const candidates=prepareDeviceContactRows([{key:'a',name:'A',phones:[{number:'5555 1234'},{number:'+966501234567'}]},{key:'b',name:'B',phones:[{number:'+971501234567'}]},{key:'c',name:'C',phones:[{number:'+97433123456'}]}],[]);
  let sequence=0;const plan=buildImportPlan({candidates,selected:new Set(['a','b','c']),assignments:new Map(),defaultRole:'tenant',roleOverrides:new Map(),now:'now',createIdentifier:prefix=>`${prefix}:${++sequence}`});
  const filtered=excludeKnownStoredConflicts(plan.values,new Map([['+96555551234',['saved-a']],['+971501234567',['saved-b']]]));
  assert.equal(filtered.values.length,2);assert.deepEqual(filtered.values.map(row=>row.contact.name),['A','C']);assert.equal(filtered.values[0]!.contact.phone,'+966501234567');
  assert.equal(filtered.values[0]!.phones[0]!.isPrimary,true);assert.deepEqual(filtered.conflicts.map(conflict=>conflict.normalized),['+96555551234','+971501234567']);
});
