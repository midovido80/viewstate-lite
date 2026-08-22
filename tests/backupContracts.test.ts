import assert from 'node:assert/strict';
import test from 'node:test';
import {BACKUP_FORMAT_VERSION,DATABASE_SCHEMA_VERSION,isSupportedBackup} from '../src/lib/databaseContracts.ts';

test('database and backup versions are separate contracts',()=>{assert.equal(DATABASE_SCHEMA_VERSION,4);assert.equal(BACKUP_FORMAT_VERSION,1)});
test('accepts legacy backups 1 through 3',()=>{for(const version of [1,2,3])assert.equal(isSupportedBackup({format:'viewstate-lite',version,data:{}}),true)});
test('accepts current backup format and rejects unsupported versions',()=>{assert.equal(isSupportedBackup({format:'viewstate-lite',backupFormatVersion:1,data:{}}),true);assert.equal(isSupportedBackup({format:'viewstate-lite',backupFormatVersion:2,data:{}}),false);assert.equal(isSupportedBackup({format:'viewstate-lite',version:4,data:{}}),false)});
