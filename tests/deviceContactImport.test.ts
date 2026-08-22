import assert from 'node:assert/strict';
import test from 'node:test';
import {preserveDeviceContactName,preserveDeviceContactNotes} from '../src/features/contacts/deviceImport.ts';

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
