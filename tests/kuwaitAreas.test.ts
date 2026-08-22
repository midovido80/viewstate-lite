import assert from 'node:assert/strict';
import test from 'node:test';
import {filterKuwaitAreaGroups,KUWAIT_AREA_GROUPS} from '../src/data/kuwaitAreas.ts';

test('contains all six Kuwait governorates',()=>assert.equal(KUWAIT_AREA_GROUPS.length,6));
test('Arabic partial search finds Salmiya',()=>{
  const results=filterKuwaitAreaGroups('سل');
  assert.equal(results.some(group=>group.areas.includes('السالمية')),true);
});
test('area picker starts with no hidden empty governorates after filtering',()=>{
  assert.equal(filterKuwaitAreaGroups('مطلاع').every(group=>group.areas.length>0),true);
});
