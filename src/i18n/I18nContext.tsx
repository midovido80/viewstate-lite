import React, {createContext, useContext, useMemo, useState} from 'react';

type Language = 'ar' | 'en';
const strings = {
  ar: {home:'الرئيسية',contacts:'العملاء',properties:'العقارات',matches:'المطابقات',more:'المزيد',
    search:'ابحث في العملاء والعقارات',addContact:'إضافة شخص',addProperty:'إضافة عقار',importContacts:'استيراد من الهاتف',
    noContacts:'لا يوجد أشخاص مسجلون',noProperties:'لا توجد عقارات مسجلة',noMatches:'لا توجد مطابقات مؤهلة حاليًا',
    save:'حفظ',cancel:'إلغاء',name:'الاسم',phone:'رقم الهاتف',role:'التصنيف',notes:'ملاحظات',
    area:'المنطقة',rent:'الإيجار الشهري',type:'نوع العقار',bedrooms:'الغرف',bathrooms:'الحمامات',
    description:'الوصف المرسل',privateNotes:'ملاحظات خاصة',paci:'الرقم الآلي PACI',map:'رابط الموقع',
    media:'الصور والفيديو',share:'مشاركة',available:'متاح',rented:'مؤجر',paused:'متوقف',
    backup:'نسخة احتياطية',language:'اللغة',settings:'الإعدادات',requirements:'المتطلبات',score:'نسبة المطابقة'},
  en: {home:'Home',contacts:'People',properties:'Properties',matches:'Matches',more:'More',
    search:'Search people and properties',addContact:'Add person',addProperty:'Add property',importContacts:'Import from phone',
    noContacts:'No people saved',noProperties:'No properties saved',noMatches:'No qualifying matches yet',
    save:'Save',cancel:'Cancel',name:'Name',phone:'Phone',role:'Role',notes:'Notes',area:'Area',rent:'Monthly rent',
    type:'Property type',bedrooms:'Bedrooms',bathrooms:'Bathrooms',description:'Shared description',
    privateNotes:'Private notes',paci:'PACI number',map:'Map link',media:'Photos and video',share:'Share',
    available:'Available',rented:'Rented',paused:'Paused',backup:'Backup',language:'Language',settings:'Settings',
    requirements:'Requirements',score:'Match score'}
} as const;
type Key = keyof typeof strings.ar;
type Value = {language:Language; isRTL:boolean; t:(key:Key)=>string; setLanguage:(value:Language)=>void};
const Context = createContext<Value | null>(null);

export function I18nProvider({children}:{children:React.ReactNode}) {
  const [language,setLanguage]=useState<Language>('ar');
  const value=useMemo<Value>(()=>({language,isRTL:language==='ar',t:key=>strings[language][key],setLanguage}),[language]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n():Value { const value=useContext(Context); if(!value) throw new Error('I18nProvider missing'); return value; }

