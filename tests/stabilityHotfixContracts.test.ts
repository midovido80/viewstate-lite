import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {BACKUP_FORMAT_VERSION,DATABASE_SCHEMA_VERSION} from '../src/lib/databaseContracts.ts';

test('V0.5.3 keeps database and backup contracts frozen',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8'));const app=JSON.parse(readFileSync('app.json','utf8'));
  assert.equal(pkg.version,'0.5.3');assert.equal(app.expo.version,'0.5.3');assert.equal(app.expo.android.versionCode,11);
  assert.equal(DATABASE_SCHEMA_VERSION,5);assert.equal(BACKUP_FORMAT_VERSION,2);
  assert.match(readFileSync('app/(tabs)/more.tsx','utf8'),/Interaction Hotfix · V0\.5\.3/);
});

test('property save is guarded, keyboard-safe, draft-safe, and preserves edit creation time',()=>{
  const source=readFileSync('app/property-form.tsx','utf8');
  assert.match(source,/saveLock\.current/);assert.match(source,/Keyboard\.dismiss\(\)/);assert.match(source,/setSaving\(true\)/);
  assert.match(source,/createdAt:originalCreatedAt\?\?now/);assert.match(source,/catch\{Alert\.alert\(t\('propertySaveFailedTitle'/);
  assert.match(source,/await draftsRepository\.clear\(key\)/);assert.match(source,/disabled=\{saving\}/);
  assert.match(source,/useDraftAutosave/);assert.match(source,/await draftAutosave\.cancel\(\)/);
  assert.match(source,/requestAnimationFrame/);assert.match(source,/keyboardShouldPersistTaps="always"/);
});

test('WhatsApp and WhatsApp Business are explicit Android targets',()=>{
  const sender=readFileSync('src/features/sharing/whatsapp.ts','utf8');const chooser=readFileSync('src/components/WhatsAppChooser.tsx','utf8');
  assert.match(sender,/whatsapp:'com\.whatsapp'/);assert.match(sender,/whatsapp_business:'com\.whatsapp\.w4b'/);
  assert.match(sender,/IntentLauncher\.startActivityAsync/);assert.match(sender,/packageName:PACKAGES\[target\]/);assert.match(sender,/android\.intent\.action\.SEND/);assert.match(sender,/android\.intent\.action\.VIEW/);
  assert.match(chooser,/choose\('whatsapp'\)/);assert.match(chooser,/choose\('whatsapp_business'\)/);
  assert.doesNotMatch(readFileSync('app/share-property.tsx','utf8'),/Share\.share/);
});

test('local phone-contact search is visually distinct from Global Search',()=>{
  const source=readFileSync('app/contact-import.tsx','utf8');const i18n=readFileSync('src/i18n/I18nContext.tsx','utf8');
  assert.match(source,/Ionicons/);assert.match(source,/borderColor:colors\.red/);assert.match(source,/backgroundColor:'#E8F4FF'/);
  assert.match(i18n,/phoneContactsSearch:'ابحث داخل جهات اتصال الهاتف'/);assert.match(source,/keyboardShouldPersistTaps="always"/);
});

test('same-contact Android service aliases are collapsed without a duplicate warning',()=>{
  const source=readFileSync('src/features/contacts/deviceImport.ts','utf8');
  assert.match(source,/Android may expose one real number several times/);assert.match(source,/if\(existingIndex!==undefined\)/);
  assert.doesNotMatch(source,/duplicateDisplays\.push/);
});

test('area and generic choice rows allow complete wrapped labels',()=>{
  for(const path of ['src/components/AreaPicker.tsx','src/components/ChoicePicker.tsx','src/components/MultiAreaPicker.tsx']){
    const source=readFileSync(path,'utf8');assert.match(source,/flexShrink:1/);assert.doesNotMatch(source,/numberOfLines=\{1\}/);
  }
});

test('device names and notes remain verbatim',()=>{
  const device=readFileSync('src/features/contacts/deviceImport.ts','utf8');const plan=readFileSync('src/features/contacts/importPlan.ts','utf8');
  assert.match(device,/return name&&name\.length>0\?name:phone/);assert.match(device,/return notes\?\?''/);
  assert.match(plan,/name:candidate\.name/);assert.match(plan,/notes:candidate\.notes/);
});
