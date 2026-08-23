import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareDevicePhones,preserveDeviceContactName,preserveDeviceContactNotes} from '../src/features/contacts/deviceImport.ts';

test('keeps Arabic, English, and mixed device names byte-for-byte',()=>{
  for(const name of ['أبو عبد الرحمن الإقليمية','John Smith','Mona - منى','  اسم بمسافات  ']){
    assert.equal(preserveDeviceContactName(name,'+96555551234'),name);
  }
});

test('keeps device contact notes exactly as saved',()=>{
  const notes='طالب شقة\nCall after 6 PM — لا تترجم';
  assert.equal(preserveDeviceContactNotes(notes),notes);
});

test('uses the normalized phone only when the device contact has no name',()=>{
  assert.equal(preserveDeviceContactName('', '+96555551234'),'+96555551234');
  assert.equal(preserveDeviceContactName(undefined,'+96555551234'),'+96555551234');
});

test('imports every usable number while preserving display values and labels',()=>{const result=prepareDevicePhones([{number:'5555 1234',label:'هاتف شخصي'},{number:'+966 50 123 4567',label:'Work'}]);assert.deepEqual(result.phones,[
  {normalized:'+96555551234',display:'5555 1234',label:'هاتف شخصي'},{normalized:'+966501234567',display:'+966 50 123 4567',label:'Work'}])});
test('silently collapses Android service aliases for the same real number',()=>{const result=prepareDevicePhones([
  {number:'bad'},{number:'+965 5555 1234',label:'Messages'},{number:'5555 1234',label:'Voice call'},{number:'+96555551234',label:'Mobile',isPrimary:true},
]);assert.equal(result.invalid,1);assert.equal(result.duplicates,0);assert.deepEqual(result.phones,[{normalized:'+96555551234',display:'+96555551234',label:'Mobile'}])});
