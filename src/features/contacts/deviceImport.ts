/**
 * Device contact identity is user-owned data. Keep the display name and notes
 * exactly as the phone provides them; never translate, trim, or normalize them.
 */
export function preserveDeviceContactName(name:string|undefined|null,phone:string):string{
  return name&&name.length>0?name:phone;
}

export function preserveDeviceContactNotes(notes:string|undefined|null):string{
  return notes??'';
}
