import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeKuwaitPhone } from '../src/lib/phone.ts';

test('normalizes local Kuwait number', () => assert.equal(normalizeKuwaitPhone('5555 1234'), '+96555551234'));
test('normalizes international Kuwait number', () => assert.equal(normalizeKuwaitPhone('+965 5555 1234'), '+96555551234'));
test('rejects invalid length', () => assert.equal(normalizeKuwaitPhone('123'), null));
