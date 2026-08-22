import assert from 'node:assert/strict';
import test from 'node:test';
import {activityLabel,usesCommercialDetails} from '../src/features/properties/propertyFields.ts';

test('floor and office use commercial fields',()=>{
  assert.equal(usesCommercialDetails('floor'),true);
  assert.equal(usesCommercialDetails('office'),true);
  assert.equal(usesCommercialDetails('apartment'),false);
});
test('activity values have Arabic labels',()=>assert.equal(activityLabel('company_headquarters'),'مقر شركة'));
