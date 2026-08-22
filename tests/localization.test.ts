import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createPropertyMessage} from '../src/features/sharing/propertyMessage.ts';
import type {Property} from '../src/types/domain.ts';
const catalog=readFileSync(new URL('../src/i18n/I18nContext.tsx',import.meta.url),'utf8');
test('approved contact roles have complete Arabic and English labels',()=>{for(const label of ['باحث للإيجار','مالك','دلال','شركة عقارية','حارس','Tenant','Owner','Broker','Real Estate Company','Building Guard'])assert.ok(catalog.includes(label),`missing role: ${label}`)});
test('approved property types have complete Arabic and English labels',()=>{for(const label of ['شقة','فيلا','دور','بناية','مكتب','محل','مخزن','شاليه','Apartment','Villa','Floor','Building','Office','Shop','Warehouse','Chalet'])assert.ok(catalog.includes(label),`missing type: ${label}`)});
test('English property share card is actually English',()=>{const property:Property={id:'p1',title:'',type:'apartment',area:'Salmiya',monthlyRent:450,bedrooms:2,bathrooms:1,sizeSqm:90,furnishing:'unfurnished',description:'Near services',privateNotes:'never share',paci:'123',mapUrl:'https://maps.google.com/example',latitude:null,longitude:null,paciNumberCount:null,activityType:null,ownerContactId:null,offeredByContactId:null,status:'available',createdAt:'',updatedAt:''};const message=createPropertyMessage(property,{language:'en'});assert.match(message,/Apartment for rent/);assert.match(message,/KWD 450 monthly/);assert.match(message,/2 bedrooms/);assert.doesNotMatch(message,/للإيجار|شهريًا|غرف|ملاحظ/)});
