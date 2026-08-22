import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {writeContactPhoneBatch,type ImportStatement,type ImportTransactionDatabase} from '../src/lib/contactImportWriter.ts';
import type {PlannedImportRow} from '../src/features/contacts/importPlan.ts';

function row(id:string,name:string,phone:string):PlannedImportRow{return {contact:{id,name,phone,role:'tenant',notes:'',source:'device',createdAt:'now',updatedAt:'now'},phones:[{id:`phone:${id}`,contactId:id,normalized:phone,display:phone,label:'',isPrimary:true,createdAt:'now',updatedAt:'now'}]}}

function databaseAdapter(raw:DatabaseSync):ImportTransactionDatabase{return {prepareAsync:async sql=>{const statement=raw.prepare(sql);return {executeAsync:async(...params:any[])=>{statement.run(...params)},finalizeAsync:async()=>{}} satisfies ImportStatement},
  withTransactionAsync:async task=>{raw.exec('BEGIN');try{await task();raw.exec('COMMIT')}catch(error){raw.exec('ROLLBACK');throw error}}}}

test('unexpected SQLite failure rolls back every executable contact and phone',async()=>{
  const raw=new DatabaseSync(':memory:');raw.exec(`PRAGMA foreign_keys=ON;CREATE TABLE contacts(id TEXT PRIMARY KEY,name TEXT CHECK(name<>'FAIL'),phone TEXT,role TEXT,notes TEXT,source TEXT,created_at TEXT,updated_at TEXT);
    CREATE TABLE contact_phones(id TEXT PRIMARY KEY,contact_id TEXT REFERENCES contacts(id),phone_normalized TEXT,phone_display TEXT,label TEXT,is_primary INTEGER,created_at TEXT,updated_at TEXT);`);
  await assert.rejects(writeContactPhoneBatch(databaseAdapter(raw),[row('a','Saved first inside transaction','+96555551234'),row('b','FAIL','+966501234567')]));
  assert.equal(raw.prepare('SELECT COUNT(*) AS count FROM contacts').get()!.count,0);assert.equal(raw.prepare('SELECT COUNT(*) AS count FROM contact_phones').get()!.count,0);raw.close();
});

test('writer commits the complete executable batch when every row succeeds',async()=>{
  const raw=new DatabaseSync(':memory:');raw.exec(`PRAGMA foreign_keys=ON;CREATE TABLE contacts(id TEXT PRIMARY KEY,name TEXT,phone TEXT,role TEXT,notes TEXT,source TEXT,created_at TEXT,updated_at TEXT);
    CREATE TABLE contact_phones(id TEXT PRIMARY KEY,contact_id TEXT REFERENCES contacts(id),phone_normalized TEXT,phone_display TEXT,label TEXT,is_primary INTEGER,created_at TEXT,updated_at TEXT);`);
  await writeContactPhoneBatch(databaseAdapter(raw),[row('a','A','+96555551234'),row('b','B','+966501234567')]);assert.equal(raw.prepare('SELECT COUNT(*) AS count FROM contacts').get()!.count,2);assert.equal(raw.prepare('SELECT COUNT(*) AS count FROM contact_phones').get()!.count,2);raw.close();
});
