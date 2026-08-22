import assert from 'node:assert/strict';
import test from 'node:test';
import {BACKUP_FORMAT_VERSION,DATABASE_SCHEMA_VERSION,isSupportedBackup} from '../src/lib/databaseContracts.ts';

test('database and backup versions are separate contracts',()=>{assert.equal(DATABASE_SCHEMA_VERSION,5);assert.equal(BACKUP_FORMAT_VERSION,2)});
test('accepts legacy backups 1 through 3',()=>{for(const version of [1,2,3])assert.equal(isSupportedBackup({format:'viewstate-lite',version,data:{}}),true)});
test('accepts backup formats 1 and 2 and rejects unsupported versions',()=>{assert.equal(isSupportedBackup({format:'viewstate-lite',backupFormatVersion:1,data:{}}),true);assert.equal(isSupportedBackup({format:'viewstate-lite',backupFormatVersion:2,data:{contactPhones:[]}}),true);assert.equal(isSupportedBackup({format:'viewstate-lite',backupFormatVersion:3,data:{}}),false);assert.equal(isSupportedBackup({format:'viewstate-lite',version:4,data:{}}),false)});
test('backup V2 round trip preserves contact phone fields',()=>{const snapshot={format:'viewstate-lite',backupFormatVersion:2,databaseSchemaVersion:5,data:{contactPhones:[{id:'p1',contact_id:'c1',phone_normalized:'+966501234567',phone_display:'+966 50 123 4567',label:'Mobile',is_primary:1}]}};const restored=JSON.parse(JSON.stringify(snapshot));assert.deepEqual(restored.data.contactPhones,snapshot.data.contactPhones)});
