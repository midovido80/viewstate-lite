import * as SQLite from 'expo-sqlite';
import type { Contact, ContactPhone, Property, PropertyMedia, Requirement } from '@/types/domain';
import {BACKUP_FORMAT_VERSION,DATABASE_SCHEMA_VERSION,isSupportedBackup,LITE_03A1_MIGRATION_SQL,LITE_03A2_MIGRATION_SQL} from '@/lib/databaseContracts';
import {phoneSearchDigits,validatePhoneSet} from '@/lib/phone';

const DATABASE_NAME = 'viewstate-lite.db';
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version > DATABASE_SCHEMA_VERSION) throw new Error('Database version is newer than this app.');
  if (version < 1) {
    await db.execAsync(`
      BEGIN;
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK(role IN ('tenant','owner','broker','real_estate_company','building_guard')),
        notes TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL CHECK(source IN ('manual','device')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS requirements (
        id TEXT PRIMARY KEY NOT NULL,
        contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        areas_json TEXT NOT NULL DEFAULT '[]',
        property_types_json TEXT NOT NULL DEFAULT '[]',
        min_rent INTEGER,
        max_rent INTEGER,
        min_bedrooms INTEGER,
        furnishing TEXT NOT NULL DEFAULT 'any',
        notes TEXT NOT NULL DEFAULT '',
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        area TEXT NOT NULL,
        monthly_rent INTEGER NOT NULL CHECK(monthly_rent > 0),
        bedrooms INTEGER,
        bathrooms INTEGER,
        size_sqm REAL,
        furnishing TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        private_notes TEXT NOT NULL DEFAULT '',
        paci TEXT NOT NULL DEFAULT '',
        map_url TEXT NOT NULL DEFAULT '',
        latitude REAL,
        longitude REAL,
        owner_contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'available',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS property_media (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        uri TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('image','video')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS drafts (
        key TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_contacts_role ON contacts(role);
      CREATE INDEX IF NOT EXISTS idx_requirements_contact ON requirements(contact_id);
      CREATE INDEX IF NOT EXISTS idx_properties_status_area ON properties(status, area);
      CREATE INDEX IF NOT EXISTS idx_media_property ON property_media(property_id);
      PRAGMA user_version = 1;
      COMMIT;
    `);
  }
  if (version < 2) {
    await db.execAsync(`
      BEGIN;
      ALTER TABLE properties ADD COLUMN paci_number_count INTEGER;
      ALTER TABLE properties ADD COLUMN activity_type TEXT
        CHECK(activity_type IS NULL OR activity_type IN ('company_headquarters','educational_institute','health_institute','law_office','other'));
      PRAGMA user_version = 2;
      COMMIT;
    `);
  }
  if (version < 3) {
    await db.execAsync(`
      BEGIN;
      ALTER TABLE requirements ADD COLUMN min_bathrooms INTEGER;
      ALTER TABLE properties ADD COLUMN offered_by_contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_properties_offered_by ON properties(offered_by_contact_id);
      CREATE INDEX IF NOT EXISTS idx_requirements_match ON requirements(active,min_rent,max_rent,min_bedrooms,min_bathrooms);
      PRAGMA user_version = 3;
      COMMIT;
    `);
  }
  if (version < 4) await db.execAsync(LITE_03A1_MIGRATION_SQL);
  if (version < 5) await db.execAsync(LITE_03A2_MIGRATION_SQL);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async db => {
      await migrate(db);
      return db;
    });
  }
  return databasePromise;
}

function contactFromRow(row: any): Contact {
  return { id: row.id, name: row.name, phone: row.phone, role: row.role, notes: row.notes,
    source: row.source, createdAt: row.created_at, updatedAt: row.updated_at };
}

function phoneFromRow(row:any):ContactPhone{return {id:row.id,contactId:row.contact_id,normalized:row.phone_normalized,
  display:row.phone_display,label:row.label,isPrimary:Boolean(row.is_primary),createdAt:row.created_at,updatedAt:row.updated_at}}

export class PhoneConflictError extends Error{
  constructor(public readonly contactIds:string[]){super('Phone number belongs to another person');this.name='PhoneConflictError'}
}

function propertyFromRow(row: any): Property {
  return { id: row.id, title: row.title, type: row.type, area: row.area, blockNumber: row.block_number ?? null,
    monthlyRent: row.monthly_rent, bedrooms: row.bedrooms, bathrooms: row.bathrooms,
    sizeSqm: row.size_sqm, furnishing: row.furnishing, description: row.description,
    privateNotes: row.private_notes, paci: row.paci, mapUrl: row.map_url,
    latitude: row.latitude, longitude: row.longitude, ownerContactId: row.owner_contact_id,
    offeredByContactId: row.offered_by_contact_id ?? null,
    paciNumberCount: row.paci_number_count ?? null, activityType: row.activity_type ?? null,
    status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

function requirementFromRow(row: any): Requirement {
  return { id: row.id, contactId: row.contact_id, areas: JSON.parse(row.areas_json),
    propertyTypes: JSON.parse(row.property_types_json), minRent: row.min_rent,
    maxRent: row.max_rent, minBedrooms: row.min_bedrooms, minBathrooms: row.min_bathrooms ?? null, furnishing: row.furnishing,
    notes: row.notes, active: Boolean(row.active), createdAt: row.created_at,
    updatedAt: row.updated_at };
}

export const contactsRepository = {
  async list(query = ''): Promise<Contact[]> {
    const db = await getDatabase();
    const pattern = `%${query.trim()}%`;
    const digits=phoneSearchDigits(query);const digitPattern=digits?`%${digits}%`:'__NO_PHONE_MATCH__';
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM contacts c WHERE c.name LIKE ? OR c.phone LIKE ? OR EXISTS(
        SELECT 1 FROM contact_phones p WHERE p.contact_id=c.id AND (p.phone_display LIKE ? OR p.phone_normalized LIKE ?)
      ) ORDER BY c.updated_at DESC`,pattern,pattern,pattern,digitPattern);
    return rows.map(contactFromRow);
  },
  async get(id: string): Promise<Contact | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM contacts WHERE id = ?', id);
    return row ? contactFromRow(row) : null;
  },
  async upsertWithPhones(value:Contact,phones:ContactPhone[]):Promise<void>{
    assertPhoneSet(value.id,phones);
    const db = await getDatabase();
    const normalized=phones.map(phone=>phone.normalized);const placeholders=normalized.map(()=>'?').join(',');
    const conflicts=await db.getAllAsync<{contact_id:string}>(`SELECT DISTINCT contact_id FROM contact_phones
      WHERE contact_id<>? AND phone_normalized IN (${placeholders})`,value.id,...normalized);
    if(conflicts.length)throw new PhoneConflictError(conflicts.map(row=>row.contact_id));
    const primary=phones.find(phone=>phone.isPrimary)!;
    await db.withTransactionAsync(async()=>{
      await db.runAsync(`INSERT INTO contacts(id,name,phone,role,notes,source,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=excluded.phone,
        role=excluded.role,notes=excluded.notes,updated_at=excluded.updated_at`,value.id,value.name,primary.normalized,value.role,value.notes,value.source,value.createdAt,value.updatedAt);
      await db.runAsync('DELETE FROM contact_phones WHERE contact_id=?',value.id);
      for(const phone of phones)await insertPhone(db,phone);
    });
  },
  async findByPhone(phone: string): Promise<Contact | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(`SELECT c.* FROM contacts c JOIN contact_phones p ON p.contact_id=c.id
      WHERE p.phone_normalized=? LIMIT 1`,phone);
    return row ? contactFromRow(row) : null;
  },
  async importManyWithPhones(values:Array<{contact:Contact;phones:ContactPhone[]}>):Promise<void>{
    if (!values.length) return;
    for(const value of values)await contactsRepository.upsertWithPhones(value.contact,value.phones);
  },
};

function assertPhoneSet(contactId:string,phones:ContactPhone[]):void{
  validatePhoneSet(phones);
  if(phones.some(phone=>phone.contactId!==contactId))throw new Error('Phone contact mismatch');
}

async function insertPhone(db:SQLite.SQLiteDatabase,phone:ContactPhone):Promise<void>{await db.runAsync(
  `INSERT INTO contact_phones(id,contact_id,phone_normalized,phone_display,label,is_primary,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)`,
  phone.id,phone.contactId,phone.normalized,phone.display,phone.label,phone.isPrimary?1:0,phone.createdAt,phone.updatedAt)}

export const phoneRepository={
  async listAll():Promise<ContactPhone[]>{const db=await getDatabase();const rows=await db.getAllAsync<any>('SELECT * FROM contact_phones');return rows.map(phoneFromRow)},
  async listForContact(contactId:string):Promise<ContactPhone[]>{const db=await getDatabase();const rows=await db.getAllAsync<any>(
    'SELECT * FROM contact_phones WHERE contact_id=? ORDER BY is_primary DESC,created_at',contactId);return rows.map(phoneFromRow)},
  async conflicts(normalized:string,excludeContactId?:string):Promise<Contact[]>{const db=await getDatabase();const rows=await db.getAllAsync<any>(
    `SELECT DISTINCT c.* FROM contacts c JOIN contact_phones p ON p.contact_id=c.id WHERE p.phone_normalized=? AND (? IS NULL OR c.id<>?)`,
    normalized,excludeContactId??null,excludeContactId??null);return rows.map(contactFromRow)},
};

export const propertiesRepository = {
  async list(query = ''): Promise<Property[]> {
    const db = await getDatabase();
    const pattern = `%${query.trim()}%`;
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM properties WHERE title LIKE ? OR area LIKE ? ORDER BY updated_at DESC', pattern, pattern);
    return rows.map(propertyFromRow);
  },
  async get(id: string): Promise<Property | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM properties WHERE id = ?', id);
    return row ? propertyFromRow(row) : null;
  },
  async forOfferedBy(contactId: string): Promise<Property[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM properties WHERE offered_by_contact_id=? ORDER BY updated_at DESC', contactId);
    return rows.map(propertyFromRow);
  },
  async upsert(value: Property): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`INSERT INTO properties(id,title,type,area,block_number,monthly_rent,bedrooms,bathrooms,size_sqm,
      furnishing,description,private_notes,paci,map_url,latitude,longitude,paci_number_count,activity_type,owner_contact_id,offered_by_contact_id,status,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,
      type=excluded.type,area=excluded.area,block_number=excluded.block_number,monthly_rent=excluded.monthly_rent,bedrooms=excluded.bedrooms,
      bathrooms=excluded.bathrooms,size_sqm=excluded.size_sqm,furnishing=excluded.furnishing,
      description=excluded.description,private_notes=excluded.private_notes,paci=excluded.paci,
      map_url=excluded.map_url,latitude=excluded.latitude,longitude=excluded.longitude,
      paci_number_count=excluded.paci_number_count,activity_type=excluded.activity_type,
      owner_contact_id=excluded.owner_contact_id,offered_by_contact_id=excluded.offered_by_contact_id,status=excluded.status,updated_at=excluded.updated_at`,
      value.id,value.title,value.type,value.area,value.blockNumber,value.monthlyRent,value.bedrooms,value.bathrooms,value.sizeSqm,
      value.furnishing,value.description,value.privateNotes,value.paci,value.mapUrl,value.latitude,value.longitude,
      value.paciNumberCount,value.activityType,value.ownerContactId,value.offeredByContactId,value.status,value.createdAt,value.updatedAt);
  },
  async media(propertyId: string): Promise<PropertyMedia[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM property_media WHERE property_id=? ORDER BY sort_order', propertyId);
    return rows.map(row => ({id:row.id, propertyId:row.property_id, uri:row.uri, kind:row.kind,
      sortOrder:row.sort_order, createdAt:row.created_at}));
  },
  async addMedia(media: PropertyMedia): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('INSERT INTO property_media(id,property_id,uri,kind,sort_order,created_at) VALUES(?,?,?,?,?,?)',
      media.id,media.propertyId,media.uri,media.kind,media.sortOrder,media.createdAt);
  },
};

export interface GlobalSearchResults {
  contacts: Contact[];
  properties: Property[];
}

export const globalSearchRepository = {
  async search(query: string): Promise<GlobalSearchResults> {
    const trimmed=query.trim();
    if (!trimmed) return {contacts:[],properties:[]};
    const db=await getDatabase();
    const pattern=`%${trimmed}%`;
    const digits=phoneSearchDigits(trimmed);const digitPattern=digits?`%${digits}%`:'__NO_PHONE_MATCH__';
    const [contactRows,propertyRows]=await Promise.all([
      db.getAllAsync<any>(`SELECT * FROM contacts c
        WHERE c.name LIKE ? OR c.phone LIKE ? OR c.notes LIKE ? OR EXISTS(
          SELECT 1 FROM contact_phones p WHERE p.contact_id=c.id AND (p.phone_display LIKE ? OR p.phone_normalized LIKE ?)
        ) ORDER BY c.updated_at DESC LIMIT 50`,pattern,pattern,pattern,pattern,digitPattern),
      db.getAllAsync<any>(`SELECT * FROM properties
        WHERE title LIKE ? OR area LIKE ? OR paci LIKE ? OR description LIKE ? OR CAST(block_number AS TEXT) LIKE ?
        ORDER BY updated_at DESC LIMIT 50`,pattern,pattern,pattern,pattern,pattern),
    ]);
    return {contacts:contactRows.map(contactFromRow),properties:propertyRows.map(propertyFromRow)};
  },
};

export const requirementsRepository = {
  async listActive(): Promise<Requirement[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM requirements WHERE active=1 ORDER BY updated_at DESC');
    return rows.map(requirementFromRow);
  },
  async forContact(contactId: string): Promise<Requirement[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM requirements WHERE contact_id=? ORDER BY updated_at DESC', contactId);
    return rows.map(requirementFromRow);
  },
  async get(id: string): Promise<Requirement | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM requirements WHERE id=?', id);
    return row ? requirementFromRow(row) : null;
  },
  async upsert(value: Requirement): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`INSERT INTO requirements(id,contact_id,areas_json,property_types_json,min_rent,max_rent,
      min_bedrooms,min_bathrooms,furnishing,notes,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET areas_json=excluded.areas_json,property_types_json=excluded.property_types_json,
      min_rent=excluded.min_rent,max_rent=excluded.max_rent,min_bedrooms=excluded.min_bedrooms,
      min_bathrooms=excluded.min_bathrooms,furnishing=excluded.furnishing,notes=excluded.notes,active=excluded.active,updated_at=excluded.updated_at`,
      value.id,value.contactId,JSON.stringify(value.areas),JSON.stringify(value.propertyTypes),value.minRent,
      value.maxRent,value.minBedrooms,value.minBathrooms,value.furnishing,value.notes,value.active?1:0,value.createdAt,value.updatedAt);
  },
};

export const draftsRepository = {
  async save(key: string, value: unknown): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`INSERT INTO drafts(key,payload,updated_at) VALUES(?,?,?) ON CONFLICT(key)
      DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at`, key, JSON.stringify(value), new Date().toISOString());
  },
  async load<T>(key: string): Promise<T | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{payload:string}>('SELECT payload FROM drafts WHERE key=?', key);
    return row ? JSON.parse(row.payload) as T : null;
  },
  async clear(key: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM drafts WHERE key=?', key);
  },
};

export async function exportSnapshot(): Promise<string> {
  const db = await getDatabase();
  const [contacts,contactPhones,requirements,properties,media] = await Promise.all([
    db.getAllAsync('SELECT * FROM contacts'),db.getAllAsync('SELECT * FROM contact_phones'),db.getAllAsync('SELECT * FROM requirements'),
    db.getAllAsync('SELECT * FROM properties'),db.getAllAsync('SELECT * FROM property_media')]);
  return JSON.stringify({format:'viewstate-lite',backupFormatVersion:BACKUP_FORMAT_VERSION,databaseSchemaVersion:DATABASE_SCHEMA_VERSION,exportedAt:new Date().toISOString(),
    data:{contacts,contactPhones,requirements,properties,media}}, null, 2);
}

export async function restoreSnapshot(json: string): Promise<void> {
  const snapshot = JSON.parse(json) as any;
  if (!isSupportedBackup(snapshot)) {
    throw new Error('Unsupported backup format');
  }
  const { contacts = [], contactPhones = [], requirements = [], properties = [], media = [] } = snapshot.data;
  if (![contacts, contactPhones, requirements, properties, media].every(Array.isArray)) throw new Error('Invalid backup data');
  const isV2=snapshot.backupFormatVersion===2;
  if(isV2&&!contactPhones.length&&contacts.length)throw new Error('Backup V2 is missing contact phones');
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const row of contacts) await db.runAsync(`INSERT INTO contacts(id,name,phone,role,notes,source,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=excluded.phone,role=excluded.role,
      notes=excluded.notes,source=excluded.source,updated_at=excluded.updated_at`, row.id,row.name,row.phone,row.role,row.notes,row.source,row.created_at,row.updated_at);
    for(const row of contacts)await db.runAsync('DELETE FROM contact_phones WHERE contact_id=?',row.id);
    if(isV2){for(const row of contactPhones)await db.runAsync(`INSERT INTO contact_phones(id,contact_id,phone_normalized,phone_display,label,is_primary,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?)`,row.id,row.contact_id,row.phone_normalized,row.phone_display,row.label??'',row.is_primary?1:0,row.created_at,row.updated_at)}
    else {for(const row of contacts)await db.runAsync(`INSERT INTO contact_phones(id,contact_id,phone_normalized,phone_display,label,is_primary,created_at,updated_at)
      VALUES(?,?,?,?,?,1,?,?)`,createLegacyPhoneId(row.id),row.id,row.phone,row.phone,'',row.created_at,row.updated_at)}
    for (const row of properties) await db.runAsync(`INSERT INTO properties(id,title,type,area,block_number,monthly_rent,bedrooms,bathrooms,size_sqm,furnishing,description,private_notes,
      paci,map_url,latitude,longitude,paci_number_count,activity_type,owner_contact_id,offered_by_contact_id,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,type=excluded.type,area=excluded.area,block_number=excluded.block_number,monthly_rent=excluded.monthly_rent,bedrooms=excluded.bedrooms,bathrooms=excluded.bathrooms,
      size_sqm=excluded.size_sqm,furnishing=excluded.furnishing,description=excluded.description,private_notes=excluded.private_notes,paci=excluded.paci,map_url=excluded.map_url,
      latitude=excluded.latitude,longitude=excluded.longitude,paci_number_count=excluded.paci_number_count,activity_type=excluded.activity_type,
      owner_contact_id=excluded.owner_contact_id,offered_by_contact_id=excluded.offered_by_contact_id,status=excluded.status,updated_at=excluded.updated_at`,
      row.id,row.title,row.type,row.area,row.block_number??null,row.monthly_rent,row.bedrooms,row.bathrooms,row.size_sqm,row.furnishing,row.description,row.private_notes,row.paci,row.map_url,row.latitude,row.longitude,
      row.paci_number_count??null,row.activity_type??null,row.owner_contact_id,row.offered_by_contact_id??null,row.status,row.created_at,row.updated_at);
    for (const row of requirements) await db.runAsync(`INSERT INTO requirements(id,contact_id,areas_json,property_types_json,min_rent,max_rent,min_bedrooms,min_bathrooms,furnishing,notes,active,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET areas_json=excluded.areas_json,property_types_json=excluded.property_types_json,min_rent=excluded.min_rent,max_rent=excluded.max_rent,
      min_bedrooms=excluded.min_bedrooms,min_bathrooms=excluded.min_bathrooms,furnishing=excluded.furnishing,notes=excluded.notes,active=excluded.active,updated_at=excluded.updated_at`, row.id,row.contact_id,row.areas_json,row.property_types_json,
      row.min_rent,row.max_rent,row.min_bedrooms,row.min_bathrooms??null,row.furnishing,row.notes,row.active,row.created_at,row.updated_at);
    for (const row of media) await db.runAsync(`INSERT INTO property_media(id,property_id,uri,kind,sort_order,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`,
      row.id,row.property_id,row.uri,row.kind,row.sort_order,row.created_at);
  });
}

function createLegacyPhoneId(contactId:string):string{return `legacy-phone:${contactId}`}
