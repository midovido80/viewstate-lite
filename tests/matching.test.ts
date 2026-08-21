import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateMatch, findMatches } from '../src/features/matching/engine.ts';
import type { Property, Requirement } from '../src/types/domain.ts';

const property: Property = {id:'p1',title:'شقة السالمية',type:'apartment',area:'السالمية',monthlyRent:450,
  bedrooms:3,bathrooms:2,sizeSqm:120,furnishing:'unfurnished',description:'',privateNotes:'',paci:'',mapUrl:'',
  latitude:null,longitude:null,ownerContactId:null,status:'available',createdAt:'',updatedAt:''};
const requirement: Requirement = {id:'r1',contactId:'c1',areas:['السالمية'],propertyTypes:['apartment'],
  minRent:350,maxRent:500,minBedrooms:2,furnishing:'unfurnished',notes:'',active:true,createdAt:'',updatedAt:''};

test('exact requirement match scores 100', () => assert.equal(calculateMatch(requirement,property).score,100));
test('unavailable properties are excluded', () => assert.equal(findMatches([requirement],[{...property,status:'rented'}]).length,0));
test('rent outside requested range lowers the match below threshold', () =>
  assert.equal(findMatches([requirement],[{...property,monthlyRent:900}]).length,0));
