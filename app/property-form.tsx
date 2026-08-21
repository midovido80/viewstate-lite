import {useEffect,useState} from 'react';
import {Alert,Linking,Modal,Pressable,StyleSheet,Text,View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {router,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {AreaPicker} from '@/components/AreaPicker';
import {ChoicePicker} from '@/components/ChoicePicker';
import {FormField} from '@/components/FormField';
import {NumberPicker} from '@/components/NumberPicker';
import {PrimaryButton} from '@/components/PrimaryButton';
import {KeyboardAwareScrollViewCompat} from '@/components/KeyboardAwareScrollViewCompat';
import {draftsRepository,propertiesRepository} from '@/lib/database';
import {createId} from '@/lib/id';
import {persistMedia} from '@/features/properties/mediaStorage';
import {googleMapsUrl,parseCoordinatesFromMapUrl} from '@/features/properties/location';
import {ACTIVITY_OPTIONS,usesCommercialDetails} from '@/features/properties/propertyFields';
import type {ActivityType,Furnishing,PropertyStatus,PropertyType} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';

type Draft={
  title:string;type:PropertyType;area:string;monthlyRent:string;bedrooms:number|null;bathrooms:number|null;sizeSqm:string;
  furnishing:Exclude<Furnishing,'any'>;description:string;privateNotes:string;paci:string;mapUrl:string;
  latitude:number|null;longitude:number|null;paciNumberCount:number|null;activityType:ActivityType|null;status:PropertyStatus;
};
const empty:Draft={title:'',type:'apartment',area:'',monthlyRent:'',bedrooms:null,bathrooms:null,sizeSqm:'',furnishing:'unfurnished',
  description:'',privateNotes:'',paci:'',mapUrl:'',latitude:null,longitude:null,paciNumberCount:null,activityType:null,status:'available'};
const types:Array<[PropertyType,string]>=[['apartment','شقة'],['villa','فيلا'],['floor','دور'],['building','بناية'],['office','مكتب'],['shop','محل'],['warehouse','مخزن'],['chalet','شاليه']];

export default function PropertyForm(){const {id,offeredByContactId}=useLocalSearchParams<{id?:string;offeredByContactId?:string}>();const [propertyId]=useState(()=>id??createId('property'));
  const key=id?`property:${id}`:'property:new';const [form,setForm]=useState<Draft>(empty);
  const [sourceContactId,setSourceContactId]=useState<string|null>(offeredByContactId??null);
  const [ownerContactId,setOwnerContactId]=useState<string|null>(null);
  const [pendingMedia,setPendingMedia]=useState<Array<{uri:string;kind:'image'|'video'}>>([]);const [ready,setReady]=useState(false);
  const [locationOpen,setLocationOpen]=useState(false);const [locationDraft,setLocationDraft]=useState('');
  const commercial=usesCommercialDetails(form.type);

  useEffect(()=>{void (async()=>{if(id){const p=await propertiesRepository.get(id);if(p){setForm({title:p.title,type:p.type,area:p.area,
    monthlyRent:String(p.monthlyRent),bedrooms:p.bedrooms,bathrooms:p.bathrooms,sizeSqm:p.sizeSqm?.toString()??'',furnishing:p.furnishing,
    description:p.description,privateNotes:p.privateNotes,paci:p.paci,mapUrl:p.mapUrl,latitude:p.latitude,longitude:p.longitude,
    paciNumberCount:p.paciNumberCount,activityType:p.activityType,status:p.status});setSourceContactId(p.offeredByContactId);setOwnerContactId(p.ownerContactId)}}else{const draft=await draftsRepository.load<Partial<Draft>>(key);
      if(draft)setForm({...empty,...draft,bedrooms:toOptionalNumber(draft.bedrooms),bathrooms:toOptionalNumber(draft.bathrooms),
        paciNumberCount:toOptionalNumber(draft.paciNumberCount)})}setReady(true)})()},[id,key]);
  useEffect(()=>{if(ready)void draftsRepository.save(key,form)},[form,key,ready]);

  const pick=async()=>{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images','videos'],allowsMultipleSelection:true,quality:.85});
    if(!result.canceled)setPendingMedia(old=>[...old,...result.assets.map(asset=>({uri:asset.uri,kind:asset.type==='video'?'video' as const:'image' as const}))])};
  const openLocation=()=>{setLocationDraft(form.mapUrl);setLocationOpen(true)};
  const launchGoogleMaps=async()=>{const query=encodeURIComponent(`${form.area||'الكويت'}, الكويت`);
    try{await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)}catch{Alert.alert('تعذر فتح Google Maps','يمكنك لصق رابط الموقع يدويًا.')}};
  const useCurrentLocation=async()=>{const permission=await Location.requestForegroundPermissionsAsync();
    if(permission.status!=='granted'){Alert.alert('الصلاحية مطلوبة','اسمح بالموقع أو الصق رابط Google Maps.');return}
    const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
    setLocationDraft(googleMapsUrl(position.coords.latitude,position.coords.longitude));
  };
  const saveLocation=()=>{const url=locationDraft.trim();if(!url){Alert.alert('اختر الموقع','افتح Google Maps والصق رابط النقطة أو استخدم موقعك الحالي.');return}
    const coordinates=parseCoordinatesFromMapUrl(url);setForm({...form,mapUrl:url,latitude:coordinates?.latitude??null,longitude:coordinates?.longitude??null});setLocationOpen(false)};
  const save=async()=>{const rent=Number(form.monthlyRent);if(!form.area.trim()||!Number.isFinite(rent)||rent<=0){Alert.alert('بيانات غير مكتملة','اختر المنطقة واكتب الإيجار الشهري.');return}
    const now=new Date().toISOString();await propertiesRepository.upsert({id:propertyId,
      title:form.title.trim()||`${types.find(item=>item[0]===form.type)?.[1]} في ${form.area.trim()}`,type:form.type,area:form.area.trim(),monthlyRent:rent,
      bedrooms:commercial?null:form.bedrooms,bathrooms:form.bathrooms,sizeSqm:form.sizeSqm?Number(form.sizeSqm):null,furnishing:form.furnishing,
      description:form.description.trim(),privateNotes:form.privateNotes.trim(),paci:form.paci.trim(),mapUrl:form.mapUrl.trim(),latitude:form.latitude,
      longitude:form.longitude,paciNumberCount:commercial?form.paciNumberCount:null,activityType:commercial?form.activityType:null,
      ownerContactId,offeredByContactId:sourceContactId,status:form.status,createdAt:now,updatedAt:now});
    let order=0;for(const media of pendingMedia){const ext=media.uri.split('.').pop()??(media.kind==='video'?'mp4':'jpg');const uri=await persistMedia(media.uri,ext);
      await propertiesRepository.addMedia({id:createId('media'),propertyId,uri,kind:media.kind,sortOrder:order++,createdAt:now})}
    await draftsRepository.clear(key);router.replace({pathname:'/property-detail',params:{id:propertyId}})};

  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={id?'تعديل العقار':'إضافة عقار للإيجار'}/>
    <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>نوع العقار</Text><View style={styles.chips}>{types.map(([value,label])=><Pressable key={value}
        onPress={()=>setForm({...form,type:value})} style={[styles.chip,form.type===value&&styles.active]}><Text style={form.type===value&&styles.activeText}>{label}</Text></Pressable>)}</View>
      <FormField label="اسم مختصر للعقار (اختياري)" placeholder="مثال: شقة السالمية 12" value={form.title} onChangeText={title=>setForm({...form,title})}/>
      <Text style={styles.helper}>هذا اسم داخلي يساعدك على تمييز الوحدة بسرعة، وليس عنوان المنطقة.</Text>
      <AreaPicker value={form.area} onChange={area=>setForm({...form,area})}/>
      <FormField label="الإيجار الشهري *" placeholder="بالدينار الكويتي" value={form.monthlyRent} keyboardType="numeric" onChangeText={monthlyRent=>setForm({...form,monthlyRent})}/>
      {!commercial&&<NumberPicker label="عدد الغرف" value={form.bedrooms} onChange={bedrooms=>setForm({...form,bedrooms})}/>}
      <NumberPicker label="عدد الحمامات" value={form.bathrooms} onChange={bathrooms=>setForm({...form,bathrooms})}/>
      {commercial&&<>
        <NumberPicker label="عدد الأرقام الآلية" value={form.paciNumberCount} onChange={paciNumberCount=>setForm({...form,paciNumberCount})}/>
        <ChoicePicker label="نوع النشاط" value={form.activityType} placeholder="اختر نوع النشاط" options={ACTIVITY_OPTIONS}
          onChange={activityType=>setForm({...form,activityType})}/>
      </>}
      <FormField label="المساحة م²" value={form.sizeSqm} keyboardType="numeric" onChangeText={sizeSqm=>setForm({...form,sizeSqm})}/>
      <FormField label="الوصف المرسل" value={form.description} multiline onChangeText={description=>setForm({...form,description})}/>
      <Text style={styles.label}>التأثيث</Text><View style={styles.chips}>{([['furnished','مفروش'],['semi_furnished','نصف مفروش'],['unfurnished','غير مفروش']] as const).map(([value,label])=><Pressable key={value}
        onPress={()=>setForm({...form,furnishing:value})} style={[styles.chip,form.furnishing===value&&styles.active]}><Text style={form.furnishing===value&&styles.activeText}>{label}</Text></Pressable>)}</View>
      <Text style={styles.label}>حالة العقار</Text><View style={styles.chips}>{([['available','متاح'],['rented','مؤجر'],['paused','متوقف']] as const).map(([value,label])=><Pressable key={value}
        onPress={()=>setForm({...form,status:value})} style={[styles.chip,form.status===value&&styles.active]}><Text style={form.status===value&&styles.activeText}>{label}</Text></Pressable>)}</View>
      <FormField label="ملاحظات خاصة لا تُرسل" value={form.privateNotes} multiline onChangeText={privateNotes=>setForm({...form,privateNotes})}/>
      <FormField label="الرقم الآلي PACI (اختياري)" value={form.paci} keyboardType="numeric" onChangeText={paci=>setForm({...form,paci})}/>
      <PrimaryButton title={form.mapUrl?'✓ تم اختيار الموقع — اضغط للتعديل':'📍 اختر الموقع على Google Maps'} onPress={openLocation}/>
      <PrimaryButton title={`إضافة صور أو فيديو (${pendingMedia.length})`} onPress={pick}/><PrimaryButton title="حفظ العقار" onPress={save}/>
    </KeyboardAwareScrollViewCompat>
    <Modal visible={locationOpen} animationType="slide" onRequestClose={()=>setLocationOpen(false)}>
      <SafeAreaView style={styles.locationPage}>
        <View style={styles.locationHeader}><Pressable onPress={()=>setLocationOpen(false)}><Text style={styles.cancel}>إلغاء</Text></Pressable><Text style={styles.locationTitle}>اختيار موقع العقار</Text></View>
        <View style={styles.locationContent}><Text style={styles.locationHelp}>افتح Google Maps وحدد العقار، ثم اختر مشاركة ← نسخ الرابط، وارجع للصقه هنا.</Text>
          <PrimaryButton title="فتح Google Maps" onPress={launchGoogleMaps}/>
          <FormField label="رابط الموقع" placeholder="الصق رابط Google Maps هنا" value={locationDraft} onChangeText={setLocationDraft} autoCapitalize="none"/>
          <Text style={styles.or}>أو</Text><PrimaryButton title="استخدام موقعي الحالي" onPress={useCurrentLocation}/>
          <PrimaryButton title="حفظ الموقع" onPress={saveLocation} color={colors.green}/></View>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

function toOptionalNumber(value:unknown):number|null{if(value===null||value===undefined||value==='')return null;const number=Number(value);return Number.isFinite(number)?number:null}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md,paddingBottom:spacing.xl},
  label:{fontWeight:'600',textAlign:'right',color:colors.text},helper:{fontSize:13,color:colors.muted,textAlign:'right',marginTop:-spacing.sm},
  chips:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.sm},chip:{borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.md,paddingVertical:10,backgroundColor:'white'},
  active:{backgroundColor:colors.blue,borderColor:colors.blue},activeText:{color:'white',fontWeight:'700'},locationPage:{flex:1,backgroundColor:colors.background},
  locationHeader:{backgroundColor:colors.blue,padding:spacing.md,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  locationTitle:{fontSize:21,fontWeight:'800',color:'white'},cancel:{color:'white',fontSize:16,fontWeight:'700'},locationContent:{padding:spacing.md,gap:spacing.md},
  locationHelp:{fontSize:16,lineHeight:26,textAlign:'right',color:colors.text,backgroundColor:colors.surface,padding:spacing.md,borderRadius:radius.md},
  or:{textAlign:'center',color:colors.muted,fontWeight:'700'}});
