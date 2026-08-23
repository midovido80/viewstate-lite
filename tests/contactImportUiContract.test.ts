import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source=readFileSync('app/contact-import.tsx','utf8');

test('contact row owns selection while conflict controls stop tap propagation',()=>{
  assert.match(source,/Pressable onPress=\{\(\)=>toggle\(item\)\}/);assert.match(source,/const stop=\(event:GestureResponderEvent\)=>event\.stopPropagation\(\)/);
  assert.ok((source.match(/stop\(event\)/g)??[]).length>=2);assert.match(source,/checked&&styles\.selectedRow/);
  assert.match(source,/label=\{t\('importRole'\)\}/);assert.match(source,/roleOverrides:NO_ROLE_OVERRIDES/);
  assert.doesNotMatch(source,/rowRole|roleTarget|applyRoleToSelected|setRoleOverrides/);
});

test('import starts with an empty selection and filtering does not replace selected state',()=>{
  assert.match(source,/useState<Set<string>>\(\(\)=>new Set\(\)\)/);assert.match(source,/filterImportCandidates\(items,query\)/);assert.match(source,/selectExecutable\(old,filtered,assignments\)/);assert.match(source,/clearVisibleSelection\(old,filtered\)/);
});

test('result stays concise and expands issue details without clipping import labels',()=>{
  assert.match(source,/importSummaryPeople/);assert.match(source,/importSummaryPhones/);assert.match(source,/importSummaryProblems/);assert.match(source,/details\?<View/);assert.match(source,/setDetails\(!details\)/);
  assert.doesNotMatch(source,/numberOfLines=/);
});
