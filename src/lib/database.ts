import * as SQLite from 'expo-sqlite';
import type { Contact, Property, PropertyMedia, QuickCaptureDraft, Requirement } from '@/types/domain';

const DATABASE_NAME = 'viewstate-lite.db';
const SCHEMA_VERSION = 4;
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version > SCHEMA_VERSION) throw new Error('Database version is newer than this app.');
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
  if (version < 4) {
    await db.execAsync(`
      BEGIN;
      CREATE TABLE IF NOT EXISTS quick_captures (
        id TEXT PRIMARY KEY NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_quick_captures_updated ON quick_captures(updated_at DESC);
      PRAGMA user_version = 4;
      COMMIT;
    `);
  }
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

function propertyFromRow(row: any): Property {
  return { id: row.id, title: row.title, type: row.type, area: row.area,
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
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM contacts WHERE name LIKE ? OR phone LIKE ? OR notes LIKE ? ORDER BY updated_at DESC', pattern, pattern, pattern);
    return rows.map(contactFromRow);
  },
  async get(id: string): Promise<Contact | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM contacts WHERE id = ?', id);
    return row ? contactFromRow(row) : null;
  },
  async upsert(value: Contact): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`INSERT INTO contacts(id,name,phone,role,notes,source,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, phone=excluded.phone,
      role=excluded.role, notes=excluded.notes, updated_at=excluded.updated_at`,
      value.id, value.name, value.phone, value.role, value.notes, value.source, value.createdAt, value.updatedAt);
  },
  async findByPhone(phone: string): Promise<Contact | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM contacts WHERE phone = ?', phone);
    return row ? contactFromRow(row) : null;
  },
  async importMany(values: Contact[]): Promise<void> {
    if (!values.length) return;
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (const value of values) {
        await db.runAsync(`INSERT INTO contacts(id,name,phone,role,notes,source,created_at,updated_at)
          VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET
          name=CASE WHEN contacts.name='' THEN excluded.name ELSE contacts.name END,
          notes=CASE WHEN contacts.notes='' THEN excluded.notes ELSE contacts.notes END,
          updated_at=excluded.updated_at`, value.id,value.name,value.phone,value.role,value.notes,value.source,value.createdAt,value.updatedAt);
      }
    });
  },
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
    await db.runAsync(`INSERT INTO properties(id,title,type,area,monthly_rent,bedrooms,bathrooms,size_sqm,
      furnishing,description,private_notes,paci,map_url,latitude,longitude,paci_number_count,activity_type,owner_contact_id,offered_by_contact_id,status,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,
      type=excluded.type,area=excluded.area,monthly_rent=excluded.monthly_rent,bedrooms=excluded.bedrooms,
      bathrooms=excluded.bathrooms,size_sqm=excluded.size_sqm,furnishing=excluded.furnishing,
      description=excluded.description,private_notes=excluded.private_notes,paci=excluded.paci,
      map_url=excluded.map_url,latitude=excluded.latitude,longitude=excluded.longitude,
      paci_number_count=excluded.paci_number_count,activity_type=excluded.activity_type,
      owner_contact_id=excluded.owner_contact_id,offered_by_contact_id=excluded.offered_by_contact_id,status=excluded.status,updated_at=excluded.updated_at`,
      value.id,value.title,value.type,value.area,value.monthlyRent,value.bedrooms,value.bathrooms,value.sizeSqm,
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
    const [contactRows,propertyRows]=await Promise.all([
      db.getAllAsync<any>(`SELECT * FROM contacts
        WHERE name LIKE ? OR phone LIKE ? OR notes LIKE ? ORDER BY updated_at DESC LIMIT 50`,pattern,pattern,pattern),
      db.getAllAsync<any>(`SELECT * FROM properties
        WHERE title LIKE ? OR area LIKE ? OR paci LIKE ? OR description LIKE ?
        ORDER BY updated_at DESC LIMIT 50`,pattern,pattern,pattern,pattern),
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

export const quickCapturesRepository = {
  async list(): Promise<QuickCaptureDraft[]> {
    const db=await getDatabase();const rows=await db.getAllAsync<any>('SELECT * FROM quick_captures ORDER BY updated_at DESC');
    return rows.map(row=>({id:row.id,text:row.text,createdAt:row.created_at,updatedAt:row.updated_at}));
  },
  async get(id:string): Promise<QuickCaptureDraft|null> {
    const db=await getDatabase();const row=await db.getFirstAsync<any>('SELECT * FROM quick_captures WHERE id=?',id);
    return row?{id:row.id,text:row.text,createdAt:row.created_at,updatedAt:row.updated_at}:null;
  },
  async upsert(value:QuickCaptureDraft): Promise<void> {
    const db=await getDatabase();await db.runAsync(`INSERT INTO quick_captures(id,text,created_at,updated_at) VALUES(?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET text=excluded.text,updated_at=excluded.updated_at`,value.id,value.text,value.createdAt,value.updatedAt);
  },
  async remove(id:string): Promise<void> {const db=await getDatabase();await db.runAsync('DELETE FROM quick_captures WHERE id=?',id)},
};

export async function exportSnapshot(): Promise<string> {
  const db = await getDatabase();
  const [contacts,requirements,properties,media,captures] = await Promise.all([
    db.getAllAsync('SELECT * FROM contacts'), db.getAllAsync('SELECT * FROM requirements'),
    db.getAllAsync('SELECT * FROM properties'), db.getAllAsync('SELECT * FROM property_media'),
    db.getAllAsync('SELECT * FROM quick_captures')]);
  return JSON.stringify({format:'viewstate-lite',version:SCHEMA_VERSION,exportedAt:new Date().toISOString(),
    data:{contacts,requirements,properties,media,captures}}, null, 2);
}

export async function restoreSnapshot(json: string): Promise<void> {
  const snapshot = JSON.parse(json) as any;
  if (snapshot?.format !== 'viewstate-lite' || ![1,2,3,SCHEMA_VERSION].includes(snapshot?.version) || !snapshot?.data) {
    throw new Error('Unsupported backup format');
  }
  const { contacts = [], requirements = [], properties = [], media = [], captures = [] } = snapshot.data;
  if (![contacts, requirements, properties, media, captures].every(Array.isArray)) throw new Error('Invalid backup data');
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const row of contacts) await db.runAsync(`INSERT INTO contacts(id,name,phone,role,notes,source,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=excluded.phone,role=excluded.role,
      notes=excluded.notes,source=excluded.source,updated_at=excluded.updated_at`, row.id,row.name,row.phone,row.role,row.notes,row.source,row.created_at,row.updated_at);
    for (const row of properties) await db.runAsync(`INSERT INTO properties(id,title,type,area,monthly_rent,bedrooms,bathrooms,size_sqm,furnishing,description,private_notes,
      paci,map_url,latitude,longitude,paci_number_count,activity_type,owner_contact_id,offered_by_contact_id,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,type=excluded.type,area=excluded.area,monthly_rent=excluded.monthly_rent,bedrooms=excluded.bedrooms,bathrooms=excluded.bathrooms,
      size_sqm=excluded.size_sqm,furnishing=excluded.furnishing,description=excluded.description,private_notes=excluded.private_notes,paci=excluded.paci,map_url=excluded.map_url,
      latitude=excluded.latitude,longitude=excluded.longitude,paci_number_count=excluded.paci_number_count,activity_type=excluded.activity_type,
      owner_contact_id=excluded.owner_contact_id,offered_by_contact_id=excluded.offered_by_contact_id,status=excluded.status,updated_at=excluded.updated_at`,
      row.id,row.title,row.type,row.area,row.monthly_rent,row.bedrooms,row.bathrooms,row.size_sqm,row.furnishing,row.description,row.private_notes,row.paci,row.map_url,row.latitude,row.longitude,
      row.paci_number_count??null,row.activity_type??null,row.owner_contact_id,row.offered_by_contact_id??null,row.status,row.created_at,row.updated_at);
    for (const row of requirements) await db.runAsync(`INSERT INTO requirements(id,contact_id,areas_json,property_types_json,min_rent,max_rent,min_bedrooms,min_bathrooms,furnishing,notes,active,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET areas_json=excluded.areas_json,property_types_json=excluded.property_types_json,min_rent=excluded.min_rent,max_rent=excluded.max_rent,
      min_bedrooms=excluded.min_bedrooms,min_bathrooms=excluded.min_bathrooms,furnishing=excluded.furnishing,notes=excluded.notes,active=excluded.active,updated_at=excluded.updated_at`, row.id,row.contact_id,row.areas_json,row.property_types_json,
      row.min_rent,row.max_rent,row.min_bedrooms,row.min_bathrooms??null,row.furnishing,row.notes,row.active,row.created_at,row.updated_at);
    for (const row of media) await db.runAsync(`INSERT INTO property_media(id,property_id,uri,kind,sort_order,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`,
      row.id,row.property_id,row.uri,row.kind,row.sort_order,row.created_at);
    for (const row of captures) await db.runAsync(`INSERT INTO quick_captures(id,text,created_at,updated_at) VALUES(?,?,?,?) ON CONFLICT(id)
      DO UPDATE SET text=CASE WHEN excluded.updated_at>quick_captures.updated_at THEN excluded.text ELSE quick_captures.text END,
      updated_at=CASE WHEN excluded.updated_at>quick_captures.updated_at THEN excluded.updated_at ELSE quick_captures.updated_at END`,row.id,row.text,row.created_at,row.updated_at);
  });
}
