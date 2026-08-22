import assert from 'node:assert/strict';
import test from 'node:test';
import {candidateIsExecutable,clearVisibleSelection,executablePhones,issueCounts,prepareDeviceContactRows,prepareDeviceContactRowsChunked,removeNonExecutableSelection,resolvedRole,selectExecutable} from '../src/features/contacts/deviceImport.ts';

test('keeps a contact visible and imports its valid number when another number is invalid',()=>{
  const [candidate]=prepareDeviceContactRows([{key:'a',name:'Exact Name',notes:' Note ',phones:[{number:'bad'},{number:'5555 1234',label:'بيت'}]}],[]);
  assert.ok(candidate);assert.equal(candidate.name,'Exact Name');assert.equal(candidate.notes,' Note ');assert.deepEqual(candidate.invalidDisplays,['bad']);
  assert.deepEqual(executablePhones(candidate,new Map()).map(phone=>phone.normalized),['+96555551234']);assert.equal(candidateIsExecutable(candidate,new Map()),true);
});

test('keeps an invalid-only contact visible but disabled',()=>{
  const [candidate]=prepareDeviceContactRows([{key:'a',name:'Bad phone',phones:[{number:'ambiguous 12345'}]}],[]);
  assert.ok(candidate);assert.equal(candidate.phones.length,0);assert.equal(candidate.invalidDisplays.length,1);assert.equal(candidateIsExecutable(candidate,new Map()),false);
});

test('stored conflict excludes only that phone and preserves other usable phones',()=>{
  const [candidate]=prepareDeviceContactRows([{key:'a',name:'Mixed',phones:[{number:'5555 1234'},{number:'+966501234567'}]}],[{normalized:'+96555551234',contactId:'saved',contactName:'Saved Person'}]);
  assert.ok(candidate);assert.deepEqual(executablePhones(candidate,new Map()).map(phone=>phone.normalized),['+966501234567']);
  assert.deepEqual(issueCounts(candidate,new Map()),{invalid:0,duplicates:0,storedConflicts:1,batchConflicts:0});
});

test('batch conflict has no first-row winner and radio assignment gives the number to one person only',()=>{
  const candidates=prepareDeviceContactRows([{key:'a',name:'A',phones:[{number:'5555 1234'}]},{key:'b',name:'B',phones:[{number:'+96555551234'},{number:'+966501234567'}]}],[]);
  const a=candidates[0]!;const b=candidates[1]!;assert.equal(candidateIsExecutable(a,new Map()),false);assert.deepEqual(executablePhones(b,new Map()).map(phone=>phone.normalized),['+966501234567']);
  const assignedToA=new Map([['+96555551234','a']]);assert.deepEqual(executablePhones(a,assignedToA).map(phone=>phone.normalized),['+96555551234']);assert.deepEqual(executablePhones(b,assignedToA).map(phone=>phone.normalized),['+966501234567']);
  const assignedToB=new Map([['+96555551234','b']]);assert.equal(candidateIsExecutable(a,assignedToB),false);assert.deepEqual(executablePhones(b,assignedToB).map(phone=>phone.normalized),['+96555551234','+966501234567']);
});

test('visible selection affects only executable visible rows and can be cleared without losing hidden selection',()=>{
  const candidates=prepareDeviceContactRows([{key:'a',phones:[{number:'5555 1234'}]},{key:'b',phones:[{number:'bad'}]},{key:'c',phones:[{number:'+966501234567'}]}],[]);
  const selected=selectExecutable(new Set(['c']),candidates.slice(0,2),new Map());assert.deepEqual([...selected].sort(),['a','c']);
  assert.deepEqual([...clearVisibleSelection(selected,candidates.slice(0,2))],['c']);
});

test('changing a batch assignment removes a selected row only when it has no executable phone left',()=>{
  const candidates=prepareDeviceContactRows([{key:'a',phones:[{number:'5555 1234'}]},{key:'b',phones:[{number:'+96555551234'},{number:'+966501234567'}]}],[]);
  const selected=removeNonExecutableSelection(new Set(['a','b']),candidates,new Map([['+96555551234','b']]));assert.deepEqual([...selected],['b']);
});

test('individual role overrides win while untouched rows follow the changing batch default',()=>{
  const overrides=new Map([['a','owner' as const]]);assert.equal(resolvedRole('a','tenant',overrides),'owner');assert.equal(resolvedRole('b','tenant',overrides),'tenant');assert.equal(resolvedRole('b','broker',overrides),'broker');
});

test('chunked preparation yields between chunks and normalizes 5000 synthetic contacts',async()=>{
  const inputs=Array.from({length:5000},(_,index)=>({key:`c${index}`,name:`Contact ${index}`,phones:[{number:`+1${String(2020000000+index)}`}]}));let yields=0;
  const result=await prepareDeviceContactRowsChunked(inputs,[],100,async()=>{yields++});assert.equal(result.length,5000);assert.equal(yields,49);
});
