import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source=readFileSync('app/contact-import.tsx','utf8');

test('contact row owns selection and cards contain no technical conflict controls',()=>{
  assert.match(source,/Pressable onPress=\{\(\)=>toggle\(item\)\}/);assert.match(source,/checked&&styles\.selectedRow/);
  assert.match(source,/label=\{t\('importRole'\)\}/);assert.match(source,/roleOverrides:NO_ROLE_OVERRIDES/);
  assert.doesNotMatch(source,/rowRole|roleTarget|applyRoleToSelected|setRoleOverrides|storedNumberConflict|batchNumberConflict|invalidPhonesHere|duplicatePhonesHere/);
});

test('import starts with an empty selection and filtering does not replace selected state',()=>{
  assert.match(source,/useState<Set<string>>\(\(\)=>new Set\(\)\)/);assert.match(source,/filterImportCandidates\(importable,query\)/);assert.match(source,/selectExecutable\(old,filtered,NO_ASSIGNMENTS\)/);assert.match(source,/clearVisibleSelection\(old,filtered\)/);
});

test('result is concise and import is reachable only through Add person',()=>{
  assert.match(source,/importSummaryPeople/);assert.match(source,/importSummaryPhones/);assert.doesNotMatch(source,/importSummaryProblems|showDetails|invalidDetail|duplicateDetail/);
  assert.match(readFileSync('app/contact-add.tsx','utf8'),/router\.push\('\/contact-import'\)/);
  assert.doesNotMatch(readFileSync('app/(tabs)/index.tsx','utf8'),/contact-import|importContacts/);
  assert.doesNotMatch(readFileSync('app/(tabs)/contacts.tsx','utf8'),/contact-import|importContacts/);
});
