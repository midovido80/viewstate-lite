import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {LITE_03A2_MIGRATION_SQL} from '../src/lib/databaseContracts.ts';

function v4():DatabaseSync{const db=new DatabaseSync(':memory:');db.exec(`PRAGMA foreign_keys=ON;CREATE TABLE contacts(
  id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,phone TEXT NOT NULL UNIQUE,role TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',source TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  PRAGMA user_version=4;`);return db}

test('fresh empty V4 state reaches Schema V5 with the contact phone table',()=>{const db=v4();db.exec(LITE_03A2_MIGRATION_SQL);assert.equal((db.prepare('PRAGMA user_version').get() as {user_version:number}).user_version,5);assert.equal((db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='contact_phones'").get() as {count:number}).count,1)});

test('V4 to V5 backfills each existing phone as primary without changing contact data',()=>{const db=v4();db.prepare('INSERT INTO contacts VALUES(?,?,?,?,?,?,?,?)').run('c1','اسم كما هو','+96555551234','tenant','ملاحظة','manual','now','now');db.exec(LITE_03A2_MIGRATION_SQL);
  assert.equal((db.prepare('PRAGMA user_version').get() as {user_version:number}).user_version,5);const row=db.prepare('SELECT * FROM contact_phones').get() as any;
  assert.equal(row.contact_id,'c1');assert.equal(row.phone_normalized,'+96555551234');assert.equal(row.phone_display,'+96555551234');assert.equal(row.is_primary,1);
  const contact=db.prepare('SELECT name,notes FROM contacts WHERE id=?').get('c1') as {name:string;notes:string};assert.equal(contact.name,'اسم كما هو');assert.equal(contact.notes,'ملاحظة')});

test('V5 database enforces E.164 structure and per-contact uniqueness',()=>{const db=v4();db.prepare('INSERT INTO contacts VALUES(?,?,?,?,?,?,?,?)').run('c1','A','+96555551234','tenant','','manual','now','now');db.exec(LITE_03A2_MIGRATION_SQL);
  const insert=db.prepare('INSERT INTO contact_phones VALUES(?,?,?,?,?,?,?,?)');insert.run('p2','c1','+966501234567','+966 50 123 4567','Mobile',0,'now','now');
  assert.throws(()=>insert.run('bad1','c1','966501234567','bad','',0,'now','now'));assert.throws(()=>insert.run('bad2','c1','+966ABC','bad','',0,'now','now'));
  assert.throws(()=>insert.run('bad3','c1','+1234567890123456','bad','',0,'now','now'));assert.throws(()=>insert.run('dup','c1','+966501234567','same','',0,'now','now'))});

test('database allows the same normalized number on different contacts for service-level conflict handling',()=>{const db=v4();const add=db.prepare('INSERT INTO contacts VALUES(?,?,?,?,?,?,?,?)');add.run('c1','A','+96555551234','tenant','','manual','now','now');add.run('c2','B','+96555554321','owner','','manual','now','now');db.exec(LITE_03A2_MIGRATION_SQL);
  db.prepare('INSERT INTO contact_phones VALUES(?,?,?,?,?,?,?,?)').run('shared','c2','+96555551234','5555 1234','',0,'now','now');assert.equal((db.prepare('SELECT COUNT(*) AS count FROM contact_phones WHERE phone_normalized=?').get('+96555551234') as {count:number}).count,2);
  const conflicts=db.prepare('SELECT DISTINCT contact_id FROM contact_phones WHERE contact_id<>? AND phone_normalized=?').all('c2','+96555551234') as Array<{contact_id:string}>;assert.deepEqual(conflicts.map(row=>row.contact_id),['c1'])});

test('database permits only one Primary number per contact',()=>{const db=v4();db.prepare('INSERT INTO contacts VALUES(?,?,?,?,?,?,?,?)').run('c1','A','+96555551234','tenant','','manual','now','now');db.exec(LITE_03A2_MIGRATION_SQL);assert.throws(()=>db.prepare('INSERT INTO contact_phones VALUES(?,?,?,?,?,?,?,?)').run('another-primary','c1','+966501234567','+966501234567','',1,'now','now'))});

test('search query finds a contact through any normalized phone',()=>{const db=v4();db.prepare('INSERT INTO contacts VALUES(?,?,?,?,?,?,?,?)').run('c1','A','+96555551234','tenant','','manual','now','now');db.exec(LITE_03A2_MIGRATION_SQL);db.prepare('INSERT INTO contact_phones VALUES(?,?,?,?,?,?,?,?)').run('secondary','c1','+966501234567','+966 50 123 4567','Work',0,'now','now');
  const row=db.prepare(`SELECT c.id FROM contacts c WHERE EXISTS(SELECT 1 FROM contact_phones p WHERE p.contact_id=c.id AND p.phone_normalized LIKE ?)`).get('%966501234567%') as {id:string};assert.equal(row.id,'c1')});
