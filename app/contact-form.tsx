import {useEffect,useState} from 'react';
import {Alert,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {FormField} from '@/components/FormField';import {PrimaryButton} from '@/components/PrimaryButton';
import {contactsRepository,draftsRepository} from '@/lib/database';import {createId} from '@/lib/id';import {normalizeKuwaitPhone} from '@/lib/phone';
import type {ContactRole} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
const roles:Array<[ContactRole,string]>=[['tenant','باحث للإيجار'],['owner','مالك'],['broker','دلال'],['real_estate_company','شركة عقارية'],['building_guard','حارس']];
type Draft={name:string;phone:string;role:ContactRole;notes:string};const empty:Draft={name:'',phone:'',role:'tenant',notes:''};
export default function ContactForm(){const {id}=useLocalSearchParams<{id?:string}>();const key=id?`contact:${id}`:'contact:new';const [form,setForm]=useState<Draft>(empty);
  const [ready,setReady]=useState(false);useEffect(()=>{(async()=>{if(id){const item=await contactsRepository.get(id);if(item)setForm({name:item.name,phone:item.phone,role:item.role,notes:item.notes})}
    else {const draft=await draftsRepository.load<Draft>(key);if(draft)setForm(draft)}setReady(true)})()},[id,key]);
  useEffect(()=>{if(ready)draftsRepository.save(key,form)},[form,key,ready]);
  const save=async()=>{const phone=normalizeKuwaitPhone(form.phone);if(!form.name.trim()||!phone){Alert.alert('بيانات غير مكتملة','اكتب الاسم ورقم كويتي صحيح.');return}
    const duplicate=await contactsRepository.findByPhone(phone);if(duplicate&&duplicate.id!==id){Alert.alert('رقم مسجل','هذا الرقم موجود بالفعل.');return}
    const now=new Date().toISOString();await contactsRepository.upsert({id:id??createId('contact'),name:form.name.trim(),phone,role:form.role,notes:form.notes.trim(),
      source:'manual',createdAt:duplicate?.createdAt??now,updatedAt:now});await draftsRepository.clear(key);router.back()};
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.heading}>{id?'تعديل الشخص':'إضافة شخص'}</Text>
    <FormField label="الاسم" value={form.name} onChangeText={name=>setForm({...form,name})}/><FormField label="رقم الهاتف" value={form.phone}
      keyboardType="phone-pad" onChangeText={phone=>setForm({...form,phone})}/><Text style={styles.label}>التصنيف</Text><View style={styles.roles}>{roles.map(([value,label])=><Pressable
        key={value} onPress={()=>setForm({...form,role:value})} style={[styles.chip,form.role===value&&styles.active]}><Text style={form.role===value&&styles.activeText}>{label}</Text></Pressable>)}</View>
    <FormField label="ملاحظات" value={form.notes} multiline onChangeText={notes=>setForm({...form,notes})}/><PrimaryButton title="حفظ" onPress={save}/>
    {form.role==='tenant'&&id&&<PrimaryButton title="إضافة متطلبات البحث" onPress={()=>router.push({pathname:'/requirement-form',params:{contactId:id}})}/>}</ScrollView></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md},heading:{fontSize:24,color:colors.red,fontWeight:'700',textAlign:'right'},
  label:{fontSize:15,fontWeight:'600',textAlign:'right'},roles:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.sm},chip:{borderWidth:1,borderColor:colors.border,
  paddingHorizontal:spacing.md,paddingVertical:10,borderRadius:radius.lg},active:{backgroundColor:colors.blue,borderColor:colors.blue},activeText:{color:'white',fontWeight:'700'}});

