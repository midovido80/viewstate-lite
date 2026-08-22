import {useEffect,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {FormField} from '@/components/FormField';
import {KeyboardAwareScrollViewCompat} from '@/components/KeyboardAwareScrollViewCompat';
import {MultiAreaPicker} from '@/components/MultiAreaPicker';
import {NumberPicker} from '@/components/NumberPicker';
import {PrimaryButton} from '@/components/PrimaryButton';
import {draftsRepository,requirementsRepository} from '@/lib/database';
import {createId} from '@/lib/id';
import {useI18n} from '@/i18n/I18nContext';
import type {Furnishing,PropertyType,Requirement} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';

const typeValues:PropertyType[]=['apartment','villa','floor','building','office','shop','warehouse','chalet'];

export default function RequirementForm(){
  const {language,isRTL}=useI18n();const L=(ar:string,en:string)=>language==='ar'?ar:en;
  const typeNames:Record<PropertyType,string>={apartment:L('شقة','Apartment'),villa:L('فيلا','Villa'),floor:L('دور','Floor'),building:L('بناية','Building'),office:L('مكتب','Office'),shop:L('محل','Shop'),warehouse:L('مخزن','Warehouse'),chalet:L('شاليه','Chalet')};
  const {id,contactId}=useLocalSearchParams<{id?:string;contactId?:string}>();const [requirementId]=useState(()=>id??createId('requirement'));
  const draftKey=id?`requirement:${id}`:`requirement:new:${contactId??'unknown'}`;
  const [areas,setAreas]=useState<string[]>([]);const [selected,setSelected]=useState<PropertyType[]>([]);const [minRent,setMinRent]=useState('');const [maxRent,setMaxRent]=useState('');
  const [bedrooms,setBedrooms]=useState<number|null>(null);const [bathrooms,setBathrooms]=useState<number|null>(null);const [furnishing,setFurnishing]=useState<Furnishing>('any');const [notes,setNotes]=useState('');
  const [createdAt,setCreatedAt]=useState<string|null>(null);const [savedContactId,setSavedContactId]=useState(contactId??'');const [ready,setReady]=useState(false);
  useEffect(()=>{void (async()=>{if(id){const item=await requirementsRepository.get(id);if(item){setSavedContactId(item.contactId);setAreas(item.areas);setSelected(item.propertyTypes);setMinRent(item.minRent?.toString()??'');setMaxRent(item.maxRent?.toString()??'');setBedrooms(item.minBedrooms);setBathrooms(item.minBathrooms);setFurnishing(item.furnishing);setNotes(item.notes);setCreatedAt(item.createdAt)}}else{const draft=await draftsRepository.load<{areas:string[];selected:PropertyType[];minRent:string;maxRent:string;bedrooms:number|null;bathrooms:number|null;furnishing:Furnishing;notes:string}>(draftKey);if(draft){setAreas(draft.areas);setSelected(draft.selected);setMinRent(draft.minRent);setMaxRent(draft.maxRent);setBedrooms(draft.bedrooms);setBathrooms(draft.bathrooms);setFurnishing(draft.furnishing);setNotes(draft.notes)}}setReady(true)})()},[draftKey,id]);
  useEffect(()=>{if(ready)void draftsRepository.save(draftKey,{areas,selected,minRent,maxRent,bedrooms,bathrooms,furnishing,notes})},[areas,bathrooms,bedrooms,draftKey,furnishing,maxRent,minRent,notes,ready,selected]);

  const persist=async(matchAfterSave:boolean)=>{const minimum=minRent?Number(minRent):null;const maximum=maxRent?Number(maxRent):null;
    if(!savedContactId){Alert.alert(L('تعذر تحديد الشخص','Could not identify the person'));return}if(!areas.length||!selected.length||minimum===null||maximum===null){Alert.alert(L('بيانات غير مكتملة','Missing details'),L('اختر نوع العقار والمنطقة واكتب نطاق الإيجار.','Choose a property type and area, then enter the rent range.'));return}
    if(!Number.isFinite(minimum)||!Number.isFinite(maximum)||minimum<=0||maximum<minimum){Alert.alert(L('راجع الإيجار','Check the rent'),L('يجب أن يكون أعلى إيجار مساويًا أو أكبر من أقل إيجار.','Maximum rent must be equal to or greater than minimum rent.'));return}
    const now=new Date().toISOString();const value:Requirement={id:requirementId,contactId:savedContactId,areas,propertyTypes:selected,minRent:minimum,maxRent:maximum,minBedrooms:bedrooms,minBathrooms:bathrooms,furnishing,notes:notes.trim(),active:true,createdAt:createdAt??now,updatedAt:now};
    await requirementsRepository.upsert(value);await draftsRepository.clear(draftKey);if(matchAfterSave)router.replace({pathname:'/match-results',params:{requirementId}});else router.replace({pathname:'/contact-detail',params:{id:savedContactId}})};

  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={id?L('تعديل المطلوب','Edit request'):L('إضافة مطلوب','Add request')}/><KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={[styles.intro,{textAlign:isRTL?'right':'left'}]}>{L('سجل طلب الباحث بسرعة، ثم اعرض العقارات المطابقة بنسبة 70% أو أكثر.','Save the request quickly, then show properties matching 70% or more.')}</Text>
    <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{L('نوع العقار *','Property type *')}</Text><View style={[styles.chips,{flexDirection:isRTL?'row-reverse':'row'}]}>{typeValues.map(value=><Pressable key={value} onPress={()=>setSelected(old=>old.includes(value)?old.filter(x=>x!==value):[...old,value])}
      style={[styles.chip,selected.includes(value)&&styles.active]}><Text style={selected.includes(value)&&styles.activeText}>{typeNames[value]}</Text></Pressable>)}</View>
    <MultiAreaPicker value={areas} onChange={setAreas}/>
    <View style={[styles.rentRow,{flexDirection:isRTL?'row':'row-reverse'}]}><View style={styles.half}><FormField label={L('أعلى إيجار *','Maximum rent *')} value={maxRent} keyboardType="numeric" onChangeText={setMaxRent}/></View><View style={styles.half}><FormField label={L('أقل إيجار *','Minimum rent *')} value={minRent} keyboardType="numeric" onChangeText={setMinRent}/></View></View>
    <NumberPicker label={L('عدد الغرف المطلوب','Required bedrooms')} value={bedrooms} onChange={setBedrooms}/><NumberPicker label={L('عدد الحمامات المطلوب','Required bathrooms')} value={bathrooms} onChange={setBathrooms}/>
    <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{L('التأثيث','Furnishing')}</Text><View style={[styles.chips,{flexDirection:isRTL?'row-reverse':'row'}]}>{([['any',L('أي','Any')],['furnished',L('مفروش','Furnished')],['semi_furnished',L('نصف مفروش','Semi-furnished')],['unfurnished',L('غير مفروش','Unfurnished')]] as const).map(([value,label])=><Pressable key={value} onPress={()=>setFurnishing(value)} style={[styles.chip,furnishing===value&&styles.active]}><Text style={furnishing===value&&styles.activeText}>{label}</Text></Pressable>)}</View>
    <FormField label={L('شروط أو ملاحظات إضافية','Additional conditions or notes')} value={notes} multiline onChangeText={setNotes}/><PrimaryButton title={L('حفظ ومطابقة الآن','Save & match now')} onPress={()=>persist(true)}/><PrimaryButton title={L('حفظ فقط','Save only')} onPress={()=>persist(false)} color={colors.green}/>
  </KeyboardAwareScrollViewCompat></SafeAreaView>;
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md,paddingBottom:spacing.xl*2},intro:{backgroundColor:colors.surface,padding:spacing.md,borderRadius:radius.md,textAlign:'right',lineHeight:23,color:colors.text},label:{fontWeight:'700',textAlign:'right',color:colors.text},chips:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.sm},chip:{minWidth:92,minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.md,paddingVertical:10,alignItems:'center',justifyContent:'center',backgroundColor:'white'},active:{backgroundColor:colors.blue,borderColor:colors.blue},activeText:{color:'white',fontWeight:'700'},rentRow:{flexDirection:'row',gap:spacing.sm},half:{flex:1}});
