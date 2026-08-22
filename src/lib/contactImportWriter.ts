import type {PlannedImportRow} from '../features/contacts/importPlan.ts';

export interface ImportStatement{executeAsync(...params:any[]):Promise<unknown>;finalizeAsync():Promise<void>}
export interface ImportTransactionDatabase{prepareAsync(sql:string):Promise<ImportStatement>;withTransactionAsync(task:()=>Promise<void>):Promise<void>}

export async function writeContactPhoneBatch(db:ImportTransactionDatabase,values:readonly PlannedImportRow[]):Promise<void>{
  if(!values.length)return;const contactStatement=await db.prepareAsync('INSERT INTO contacts(id,name,phone,role,notes,source,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)');
  const phoneStatement=await db.prepareAsync('INSERT INTO contact_phones(id,contact_id,phone_normalized,phone_display,label,is_primary,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)');
  try{await db.withTransactionAsync(async()=>{for(const value of values){const primary=value.phones.find(phone=>phone.isPrimary);if(!primary)throw new Error('Primary phone missing');
    await contactStatement.executeAsync(value.contact.id,value.contact.name,primary.normalized,value.contact.role,value.contact.notes,value.contact.source,value.contact.createdAt,value.contact.updatedAt);
    for(const phone of value.phones)await phoneStatement.executeAsync(phone.id,phone.contactId,phone.normalized,phone.display,phone.label,phone.isPrimary?1:0,phone.createdAt,phone.updatedAt)}})
  }finally{await Promise.all([contactStatement.finalizeAsync(),phoneStatement.finalizeAsync()])}
}
