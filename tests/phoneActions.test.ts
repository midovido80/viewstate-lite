import assert from 'node:assert/strict';import test from 'node:test';
import {callUri,orderedPhoneChoices,whatsappUri} from '../src/features/contacts/phoneActions.ts';
import type {ContactPhone} from '../src/types/domain.ts';
const phone=(id:string,normalized:string,isPrimary:boolean):ContactPhone=>({id,contactId:'c1',normalized,display:normalized,label:'',isPrimary,createdAt:'',updatedAt:''});
test('call and WhatsApp actions target the explicitly selected number',()=>{const selected=phone('secondary','+966501234567',false);assert.equal(callUri(selected),'tel:+966501234567');assert.equal(whatsappUri(selected),'https://wa.me/966501234567')});
test('primary number is presented first without discarding secondary choices',()=>{const choices=orderedPhoneChoices([phone('secondary','+966501234567',false),phone('primary','+96555551234',true)]);assert.deepEqual(choices.map(item=>item.id),['primary','secondary'])});
