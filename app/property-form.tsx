import {useEffect,useState} from 'react';import {Alert,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';import * as Location from 'expo-location';import {router,useLocalSearchParams} from 'expo-router';import {SafeAreaView} from 'react-native-safe-area-context';
import {FormField} from '@/components/FormField';import {PrimaryButton} from '@/components/PrimaryButton';import {draftsRepository,propertiesRepository} from '@/lib/database';
import {createId} from '@/lib/id';import {persistMedia} from '@/features/properties/mediaStorage';import type {Furnishing,PropertyStatus,PropertyType} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
type Draft={title:string;type:PropertyType;area:string;monthlyRent:string;bedrooms:string;bathrooms:string;sizeSqm:string;furnishing:Exclude<Furnishing,'any'>;
  description:string;privateNotes:string;paci:string;mapUrl:string;latitude:number|null;longitude:number|null;status:PropertyStatus};
const empty:Draft={title:'',type:'apartment',area:'',monthlyRent:'',bedrooms:'',bathrooms:'',sizeSqm:'',furnishing:'unfurnished',description:'',privateNotes:'',paci:'',mapUrl:'',latitude:null,longitude:null,status:'available'};
const types:Array<[PropertyType,string]>=[['apartment','شقة'],['villa','فيلا'],['floor','دور'],['building','بناية'],['office','مكتب'],['shop','محل'],['warehouse','مخزن'],['chalet','شاليه']];
export default function PropertyForm(){const {id}=useLocalSearchParams<{id?:string}>();const propertyId=id??createId('property');const key=id?`property:${id}`:'property:new';const [form,setForm]=useState<Draft>(empty);
  const [pendingMedia,setPendingMedia]=useState<Array<{uri:string;kind:'image'|'video'}>>([]);const [ready,setReady]=useState(false);
  useEffect(()=>{(async()=>{if(id){const p=await propertiesRepository.get(id);if(p)setForm({title:p.title,type:p.type,area:p.area,monthlyRent:String(p.monthlyRent),bedrooms:p.bedrooms?.toString()??'',
    bathrooms:p.bathrooms?.toString()??'',sizeSqm:p.sizeSqm?.toString()??'',furnishing:p.furnishing,description:p.description,privateNotes:p.privateNotes,paci:p.paci,mapUrl:p.mapUrl,
    latitude:p.latitude,longitude:p.longitude,status:p.status})}else{const d=await draftsRepository.load<Draft>(key);if(d)setForm(d)}setReady(true)})()},[id,key]);
  useEffect(()=>{if(ready)draftsRepository.save(key,form)},[form,key,ready]);
  const pick=async()=>{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images','videos'],allowsMultipleSelection:true,quality:.85});if(!result.canceled)
    setPendingMedia(old=>[...old,...result.assets.map(a=>({uri:a.uri,kind:a.type==='video'?'video' as const:'image' as const}))])};
  const locate=async()=>{const permission=await Location.requestForegroundPermissionsAsync();if(permission.status!=='granted')return Alert.alert('تعذر تحديد الموقع','يمكنك لصق رابط Google Maps يدويًا.');
    const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});const latitude=pos.coords.latitude,longitude=pos.coords.longitude;
    setForm({...form,latitude,longitude,mapUrl:`https://maps.google.com/?q=${latitude},${longitude}`})};
  const save=async()=>{const rent=Number(form.monthlyRent);if(!form.area.trim()||!Number.isFinite(rent)||rent<=0){Alert.alert('بيانات غير مكتملة','المنطقة والإيجار مطلوبان.');return}
    const now=new Date().toISOString();await propertiesRepository.upsert({id:propertyId,title:form.title.trim()||`${types.find(x=>x[0]===form.type)?.[1]} في ${form.area.trim()}`,type:form.type,
      area:form.area.trim(),monthlyRent:rent,bedrooms:form.bedrooms?Number(form.bedrooms):null,bathrooms:form.bathrooms?Number(form.bathrooms):null,sizeSqm:form.sizeSqm?Number(form.sizeSqm):null,
      furnishing:form.furnishing,description:form.description.trim(),privateNotes:form.privateNotes.trim(),paci:form.paci.trim(),mapUrl:form.mapUrl.trim(),latitude:form.latitude,
      longitude:form.longitude,ownerContactId:null,status:form.status,createdAt:now,updatedAt:now});let order=0;for(const media of pendingMedia){const ext=media.uri.split('.').pop()??(media.kind==='video'?'mp4':'jpg');
      const uri=await persistMedia(media.uri,ext);await propertiesRepository.addMedia({id:createId('media'),propertyId,uri,kind:media.kind,sortOrder:order++,createdAt:now})}
    await draftsRepository.clear(key);router.replace({pathname:'/property-detail',params:{id:propertyId}})};
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.heading}>{id?'تعديل العقار':'إضافة عقار للإيجار'}</Text>
    <Text style={styles.label}>نوع العقار</Text><View style={styles.chips}>{types.map(([value,label])=><Pressable key={value} onPress={()=>setForm({...form,type:value})} style={[styles.chip,form.type===value&&styles.active]}>
      <Text style={form.type===value&&styles.activeText}>{label}</Text></Pressable>)}</View><FormField label="عنوان اختياري" value={form.title} onChangeText={title=>setForm({...form,title})}/>
    <FormField label="المنطقة *" value={form.area} onChangeText={area=>setForm({...form,area})}/><FormField label="الإيجار الشهري *" value={form.monthlyRent} keyboardType="numeric" onChangeText={monthlyRent=>setForm({...form,monthlyRent})}/>
    <View style={styles.two}><FormField label="الغرف" value={form.bedrooms} keyboardType="numeric" onChangeText={bedrooms=>setForm({...form,bedrooms})}/><FormField label="الحمامات" value={form.bathrooms} keyboardType="numeric" onChangeText={bathrooms=>setForm({...form,bathrooms})}/></View>
    <FormField label="المساحة م²" value={form.sizeSqm} keyboardType="numeric" onChangeText={sizeSqm=>setForm({...form,sizeSqm})}/><FormField label="الوصف المرسل" value={form.description} multiline onChangeText={description=>setForm({...form,description})}/>
    <Text style={styles.label}>التأثيث</Text><View style={styles.chips}>{([['furnished','مفروش'],['semi_furnished','نصف مفروش'],['unfurnished','غير مفروش']] as const).map(([value,label])=><Pressable key={value}
      onPress={()=>setForm({...form,furnishing:value})} style={[styles.chip,form.furnishing===value&&styles.active]}><Text style={form.furnishing===value&&styles.activeText}>{label}</Text></Pressable>)}</View>
    <Text style={styles.label}>حالة العقار</Text><View style={styles.chips}>{([['available','متاح'],['rented','مؤجر'],['paused','متوقف']] as const).map(([value,label])=><Pressable key={value}
      onPress={()=>setForm({...form,status:value})} style={[styles.chip,form.status===value&&styles.active]}><Text style={form.status===value&&styles.activeText}>{label}</Text></Pressable>)}</View>
    <FormField label="ملاحظات خاصة لا تُرسل" value={form.privateNotes} multiline onChangeText={privateNotes=>setForm({...form,privateNotes})}/><FormField label="PACI" value={form.paci} onChangeText={paci=>setForm({...form,paci})}/>
    <FormField label="رابط Google Maps" value={form.mapUrl} onChangeText={mapUrl=>setForm({...form,mapUrl})}/><PrimaryButton title="استخدام موقعي الحالي" onPress={locate}/>
    <PrimaryButton title={`إضافة صور أو فيديو (${pendingMedia.length})`} onPress={pick}/><PrimaryButton title="حفظ العقار" onPress={save}/></ScrollView></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md},heading:{fontSize:24,fontWeight:'700',color:colors.red,textAlign:'right'},label:{fontWeight:'600',textAlign:'right'},
  chips:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.sm},chip:{borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.md,paddingVertical:10},active:{backgroundColor:colors.blue},
  activeText:{color:'white',fontWeight:'700'},two:{gap:spacing.md}});
