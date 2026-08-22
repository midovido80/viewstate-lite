import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeKuwaitPhone,normalizePhone,phoneSearchDigits,validatePhoneSet} from '../src/lib/phone.ts';

test('normalizes local Kuwait number', () => assert.equal(normalizeKuwaitPhone('5555 1234'), '+96555551234'));
test('normalizes international Kuwait number', () => assert.equal(normalizeKuwaitPhone('+965 5555 1234'), '+96555551234'));
test('rejects invalid length', () => assert.equal(normalizeKuwaitPhone('123'), null));
test('normalizes explicit GCC and international prefixes',()=>{assert.equal(normalizePhone('+966 50 123 4567'),'+966501234567');assert.equal(normalizePhone('00971 50 123 4567'),'+971501234567');assert.equal(normalizePhone('+44 7700 900123'),'+447700900123')});
test('does not silently assign ambiguous numbers to Kuwait',()=>{assert.equal(normalizePhone('966501234567'),null);assert.equal(normalizePhone('501234567'),null)});
test('search strips formatting consistently',()=>assert.equal(phoneSearchDigits('+966 (50) 123-4567'),'966501234567'));
test('requires unique numbers and exactly one primary',()=>{validatePhoneSet([{normalized:'+96555551234',isPrimary:true},{normalized:'+966501234567',isPrimary:false}]);assert.throws(()=>validatePhoneSet([{normalized:'+96555551234',isPrimary:true},{normalized:'+96555551234',isPrimary:false}]));assert.throws(()=>validatePhoneSet([{normalized:'+96555551234',isPrimary:false}]))});
