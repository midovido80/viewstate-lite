import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('a new property starts blank and only restores an old draft explicitly',()=>{
  const source=readFileSync('app/property-form.tsx','utf8');
  assert.match(source,/if\(draft\)setRecoverableDraft\(normalizeDraft\(draft\)\)/);
  assert.doesNotMatch(source,/if\(draft\)setForm\(\{\.\.\.empty,\.\.\.draft/);
  assert.match(source,/enabled:ready&&dirty/);
  assert.match(source,/restorePropertyDraft/);
  assert.match(source,/const restoreDraft=/);
});

test('successful save permanently cancels autosave before clearing the draft',()=>{
  const source=readFileSync('app/property-form.tsx','utf8');
  assert.match(source,/await draftAutosave\.cancel\(\);await draftsRepository\.clear\(key\);setReady\(false\);setDirty\(false\)/);
  assert.match(source,/setForm\(\{\.\.\.empty\}\)/);

  const autosave=readFileSync('src/hooks/useDraftAutosave.ts','utf8');
  assert.match(autosave,/cancelled\.current=true;generation\.current\+\+/);
  assert.match(autosave,/!enabled\|\|cancelled\.current\|\|expectedGeneration!==generation\.current/);
});
