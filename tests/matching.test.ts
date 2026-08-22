import assert from 'node:assert/strict';
import test from 'node:test';
import {calculateMatch,findMatches,MAX_RENT_TOLERANCE_KWD,MINIMUM_MATCH_SCORE} from '../src/features/matching/engine.ts';
import type {Property,Requirement} from '../src/types/domain.ts';

const property:Property={id:'p1',title:'شقة السالمية',type:'apartment',area:'السالمية',monthlyRent:450,bedrooms:3,bathrooms:2,sizeSqm:120,furnishing:'unfurnished',description:'',privateNotes:'',paci:'',mapUrl:'',latitude:null,longitude:null,paciNumberCount:null,activityType:null,ownerContactId:null,offeredByContactId:null,status:'available',createdAt:'',updatedAt:''};
const requirement:Requirement={id:'r1',contactId:'c1',areas:['السالمية'],propertyTypes:['apartment'],minRent:350,maxRent:500,minBedrooms:3,minBathrooms:2,furnishing:'any',notes:'',active:true,createdAt:'',updatedAt:''};

test('exact requirement match scores 100 with explained criteria',()=>{const result=calculateMatch(requirement,property);assert.equal(result.score,100);assert.equal(result.eligible,true);assert.equal(result.criteria.every(item=>item.state==='matched'),true)});
test('unavailable properties are excluded',()=>assert.equal(findMatches([requirement],[{...property,status:'rented'}]).length,0));
test('area and property type are eligibility gates',()=>{assert.equal(findMatches([requirement],[{...property,area:'حولي'}]).length,0);assert.equal(findMatches([requirement],[{...property,type:'villa'}]).length,0)});
test('rent up to 20 KWD outside range stays a partial eligible match',()=>{const result=calculateMatch(requirement,{...property,monthlyRent:520});assert.equal(result.eligible,true);assert.equal(result.score>=MINIMUM_MATCH_SCORE,true);assert.equal(result.criteria.find(item=>item.field==='rent')?.state,'partial')});
test('rent over tolerance is excluded',()=>assert.equal(calculateMatch(requirement,{...property,monthlyRent:500+MAX_RENT_TOLERANCE_KWD+1}).eligible,false));
test('one room or bathroom difference receives partial credit',()=>{const result=calculateMatch(requirement,{...property,bedrooms:2,bathrooms:3});assert.equal(result.criteria.find(item=>item.field==='bedrooms')?.state,'partial');assert.equal(result.criteria.find(item=>item.field==='bathrooms')?.state,'partial')});
test('unspecified optional criteria are omitted and weights renormalize',()=>{const result=calculateMatch({...requirement,minBedrooms:null,minBathrooms:null},property);assert.equal(result.score,100);assert.equal(result.evaluatedCriteria,3)});
