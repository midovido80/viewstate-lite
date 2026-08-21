import assert from 'node:assert/strict';
import test from 'node:test';
import {createPropertyMessage} from '../src/features/sharing/propertyMessage.ts';
import type {Property} from '../src/types/domain.ts';

const property:Property={id:'p1',title:'شقة اختبار',type:'apartment',area:'السالمية',monthlyRent:450,bedrooms:2,bathrooms:2,sizeSqm:90,furnishing:'unfurnished',description:'قريبة من الخدمات',privateNotes:'رقم المالك سري',paci:'12345678',mapUrl:'https://maps.google.com/example',latitude:null,longitude:null,paciNumberCount:null,activityType:null,ownerContactId:'owner-secret',offeredByContactId:'source-secret',status:'available',createdAt:'',updatedAt:''};

test('safe share hides exact location and PACI by default',()=>{const message=createPropertyMessage(property);assert.equal(message.includes('12345678'),false);assert.equal(message.includes('maps.google.com'),false);assert.equal(message.includes('رقم المالك سري'),false);assert.equal(message.includes('owner-secret'),false);assert.equal(message.includes('source-secret'),false);assert.equal(message.includes('قريبة من الخدمات'),true)});
test('explicit toggles can include PACI and exact location but never private data',()=>{const message=createPropertyMessage(property,{includePaci:true,includeLocation:true,includeDescription:false});assert.equal(message.includes('12345678'),true);assert.equal(message.includes('maps.google.com'),true);assert.equal(message.includes('قريبة من الخدمات'),false);assert.equal(message.includes('رقم المالك سري'),false)});
