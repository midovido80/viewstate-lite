import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {draftsRepository} from '@/lib/database';

type Language = 'ar' | 'en';
const strings = {
  ar: {home:'الرئيسية',contacts:'العملاء',properties:'العقارات',matches:'المطابقات',more:'المزيد',
    search:'ابحث في العملاء والعقارات',addContact:'إضافة شخص',addProperty:'إضافة عقار',importContacts:'استيراد من الهاتف',
    noContacts:'لا يوجد أشخاص مسجلون',noProperties:'لا توجد عقارات مسجلة',noMatches:'لا توجد مطابقات مؤهلة حاليًا',
    save:'حفظ',cancel:'إلغاء',name:'الاسم',phone:'رقم الهاتف',role:'التصنيف',notes:'ملاحظات',
    area:'المنطقة',rent:'الإيجار الشهري',type:'نوع العقار',bedrooms:'الغرف',bathrooms:'الحمامات',
    description:'الوصف المرسل',privateNotes:'ملاحظات خاصة',paci:'الرقم الآلي PACI',map:'رابط الموقع',
    media:'الصور والفيديو',share:'مشاركة',available:'متاح',rented:'مؤجر',paused:'متوقف',
    backup:'نسخة احتياطية',language:'اللغة',settings:'الإعدادات',requirements:'المتطلبات',score:'نسبة المطابقة',
    homeGreeting:'رتّب شغلك بسرعة، وكمّل التفاصيل لاحقًا.',importWhatsApp:'استيراد من WhatsApp',
    importWhatsAppHint:'حوّل الرسالة إلى طلب أو عقار',quickCapture:'التقاط سريع',quickCaptureHint:'احفظ أي معلومة كمسودة فورًا',
    activeRequests:'طلبات نشطة',availableProperties:'عقارات متاحة',drafts:'المسودات',
    dataProtection:'حماية البيانات',dataProtectionHint:'بياناتك خاصة ومحفوظة على جهازك افتراضيًا.',
    createBackup:'إنشاء ومشاركة نسخة احتياطية',restoreBackup:'استعادة نسخة احتياطية',
    manualAdd:'إضافة يدويًا',manualAddHint:'اكتب الاسم والرقم والتصنيف',phoneImport:'استيراد من الهاتف',
    phoneImportHint:'اختر شخصًا أو عدة أشخاص من جهات الاتصال',addMethodQuestion:'كيف تريد إضافة الشخص؟',addMethodHelper:'اختر الطريقة الأسرع لك الآن',
    contactImportTitle:'جهات اتصال الهاتف',noneSelected:'لا يوجد أي شخص محدد افتراضيًا. حدّد من تريد فقط.',
    contactSearch:'ابحث داخل جهات اتصال الهاتف',noImportContacts:'لا توجد جهات اتصال مطابقة قابلة للاستيراد',
    permissionRequired:'صلاحية جهات الاتصال مطلوبة',permissionHint:'اسمح بالوصول لجهات الاتصال ثم اضغط إعادة المحاولة، أو أضف الشخص يدويًا.',
    retry:'إعادة المحاولة',selected:'محدد',importSelected:'استيراد المحدد',loadingContacts:'جارٍ تحميل جهات الاتصال…',
    tenant:'باحث للإيجار',owner:'مالك',broker:'دلال',company:'شركة عقارية',guard:'حارس مبنى',personCategory:'تصنيف الشخص',
    contactNotes:'ملاحظات جهة الاتصال',namePreserved:'سيُحفظ الاسم والملاحظات كما هما في الهاتف.',
    versionLabel:'ViewState Lite LITE-03 · V0.3',localOnlyInfo:'بياناتك محفوظة محليًا على هاتفك ولا تتم مشاركتها إلا باختيارك.',
    whatsappTitle:'استيراد نص WhatsApp',pasteWhatsApp:'الصق رسالة WhatsApp Business أو WhatsApp هنا',analyze:'تحليل الرسالة',
    originalPreserved:'النص الأصلي محفوظ ولن يُحذف.',reviewDetails:'مراجعة البيانات',wanted:'مطلوب',offered:'معروض',
    saveAndMatch:'حفظ وإظهار المطابقات',saveDraft:'حفظ كمسودة',chooseContact:'اختيار شخص مسجل',noContactSelected:'لم يتم اختيار شخص',
    quickPrompt:'اكتب أو الصق أي معلومة…',captureFirstHint:'لا تحتاج لترتيبها الآن. احفظها أولًا ثم أكملها عندما تفضى.',
    savedDrafts:'المسودات المحفوظة',completeNow:'استكمال الآن',noDrafts:'لا توجد مسودات بعد'},
  en: {home:'Home',contacts:'People',properties:'Properties',matches:'Matches',more:'More',
    search:'Search people and properties',addContact:'Add person',addProperty:'Add property',importContacts:'Import from phone',
    noContacts:'No people saved',noProperties:'No properties saved',noMatches:'No qualifying matches yet',
    save:'Save',cancel:'Cancel',name:'Name',phone:'Phone',role:'Role',notes:'Notes',area:'Area',rent:'Monthly rent',
    type:'Property type',bedrooms:'Bedrooms',bathrooms:'Bathrooms',description:'Shared description',
    privateNotes:'Private notes',paci:'PACI number',map:'Map link',media:'Photos and video',share:'Share',
    available:'Available',rented:'Rented',paused:'Paused',backup:'Backup',language:'Language',settings:'Settings',
    requirements:'Requirements',score:'Match score',homeGreeting:'Capture fast. Enrich the details later.',
    importWhatsApp:'Import from WhatsApp',importWhatsAppHint:'Turn a message into a request or property',quickCapture:'Quick capture',quickCaptureHint:'Save any detail instantly as a draft',
    activeRequests:'Active requests',availableProperties:'Available properties',drafts:'Drafts',dataProtection:'Data protection',
    dataProtectionHint:'Your data is private and stored on your device by default.',createBackup:'Create & share backup',restoreBackup:'Restore backup',
    manualAdd:'Add manually',manualAddHint:'Enter name, number and category',phoneImport:'Import from phone',phoneImportHint:'Choose one or more phone contacts',
    addMethodQuestion:'How would you like to add this person?',addMethodHelper:'Choose the fastest method for now',contactImportTitle:'Phone contacts',
    noneSelected:'No one is selected by default. Select only who you need.',contactSearch:'Search phone contacts',noImportContacts:'No matching contacts to import',
    permissionRequired:'Contacts permission is required',permissionHint:'Allow contacts access, then retry, or add the person manually.',retry:'Retry',
    selected:'selected',importSelected:'Import selected',loadingContacts:'Loading phone contacts…',tenant:'Rental seeker',owner:'Owner',broker:'Broker',
    company:'Real estate company',guard:'Building guard',personCategory:'Person category',contactNotes:'Contact notes',
    namePreserved:'Names and notes are kept exactly as saved on the phone.',versionLabel:'ViewState Lite LITE-03 · V0.3',
    localOnlyInfo:'Your data is stored locally and shared only when you choose.',whatsappTitle:'Import WhatsApp text',
    pasteWhatsApp:'Paste a WhatsApp Business or WhatsApp message here',analyze:'Analyze message',originalPreserved:'The original text is preserved and never deleted.',
    reviewDetails:'Review details',wanted:'Wanted',offered:'Offered',saveAndMatch:'Save & show matches',saveDraft:'Save as draft',
    chooseContact:'Choose a saved person',noContactSelected:'No person selected',quickPrompt:'Type or paste anything…',
    captureFirstHint:'No need to organize it now. Capture first and enrich it later.',savedDrafts:'Saved drafts',completeNow:'Complete now',noDrafts:'No drafts yet'}
} as const;
type Key = keyof typeof strings.ar;
type Value = {language:Language; isRTL:boolean; t:(key:Key)=>string; setLanguage:(value:Language)=>void};
const Context = createContext<Value | null>(null);

export function I18nProvider({children}:{children:React.ReactNode}) {
  const [language,setLanguage]=useState<Language>('ar');const [ready,setReady]=useState(false);
  useEffect(()=>{void draftsRepository.load<Language>('settings:language').then(saved=>{if(saved==='ar'||saved==='en')setLanguage(saved);setReady(true)})},[]);
  useEffect(()=>{if(ready)void draftsRepository.save('settings:language',language)},[language,ready]);
  const value=useMemo<Value>(()=>({language,isRTL:language==='ar',t:key=>strings[language][key],setLanguage}),[language]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n():Value { const value=useContext(Context); if(!value) throw new Error('I18nProvider missing'); return value; }
