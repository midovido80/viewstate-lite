import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {BACKUP_FORMAT_VERSION,DATABASE_SCHEMA_VERSION} from '../src/lib/databaseContracts.ts';

test('stability hotfix advances app identity without changing persisted contracts',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8'));const app=JSON.parse(readFileSync('app.json','utf8'));
  assert.equal(pkg.version,'0.5.4');assert.equal(app.expo.version,'0.5.4');assert.equal(app.expo.android.versionCode,12);assert.equal(DATABASE_SCHEMA_VERSION,5);assert.equal(BACKUP_FORMAT_VERSION,2);
});

test('phone parsing uses minimal default metadata required by isPossible policy',()=>{
  const source=readFileSync('src/lib/phone.ts','utf8');assert.match(source,/from 'libphonenumber-js';/);assert.doesNotMatch(source,/libphonenumber-js\/max/);
});
