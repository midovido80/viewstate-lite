import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {LITE_03A1_MIGRATION_SQL} from '../src/lib/databaseContracts.ts';

function schemaV3Database():DatabaseSync{
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE properties(id TEXT PRIMARY KEY NOT NULL,title TEXT NOT NULL);PRAGMA user_version = 3;`);
  return db;
}

test('LITE-03A1 migrates schema 3 to 4 without rewriting existing properties',()=>{
  const db=schemaV3Database();db.prepare('INSERT INTO properties(id,title) VALUES(?,?)').run('p1','existing');
  db.exec(LITE_03A1_MIGRATION_SQL);
  assert.equal((db.prepare('PRAGMA user_version').get() as {user_version:number}).user_version,4);
  assert.equal((db.prepare('SELECT title,block_number FROM properties WHERE id=?').get('p1') as {title:string;block_number:null}).title,'existing');
  assert.equal((db.prepare('SELECT block_number FROM properties WHERE id=?').get('p1') as {block_number:null}).block_number,null);
});

test('database accepts null and block numbers 1 through 12',()=>{
  const db=schemaV3Database();db.exec(LITE_03A1_MIGRATION_SQL);
  const insert=db.prepare('INSERT INTO properties(id,title,block_number) VALUES(?,?,?)');
  insert.run('null','unset',null);insert.run('one','one',1);insert.run('twelve','twelve',12);
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM properties').get() as {count:number}).count,3);
});

test('database rejects block numbers outside 1 through 12',()=>{
  const db=schemaV3Database();db.exec(LITE_03A1_MIGRATION_SQL);
  const insert=db.prepare('INSERT INTO properties(id,title,block_number) VALUES(?,?,?)');
  assert.throws(()=>insert.run('zero','zero',0));
  assert.throws(()=>insert.run('thirteen','thirteen',13));
  assert.throws(()=>insert.run('decimal','decimal',1.5));
});
