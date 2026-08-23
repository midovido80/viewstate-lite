import {useEffect,useRef,useState} from 'react';
import {Alert,Keyboard,Linking,Modal,Pressable,StyleSheet,Text,TextInput,View,type LayoutChangeEvent} from 'react-native';
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
import {usesCommercialDetails} from '@/features/properties/propertyFields';
import {getActivityLabel,getFurnishingLabel,getPropertyTypeLabel,useI18n} from '@/i18n/I18nContext';
import type {ActivityType,Furnishing,PropertyStatus,PropertyType} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
import {useDraftAutosave} from '@/hooks/useDraftAutosave';

type Draft={
  title:string;type:PropertyType;area:string;blockNumber:number|null;monthlyRent:string;bedrooms:number|null;bathrooms:number|null;sizeSqm:string;
  furnishing:Exclude<Furnishing,'any'>;description:string;privateNotes:string;paci:string;mapUrl:string;
  latitude:number|null;longitude:number|null;paciNumberCount:number|null;activityType:ActivityType|null;status:PropertyStatus;
};
const empty:Draft={title:'',type:'apartment',area:'',blockNumber:null,monthlyRent:'',bedrooms:null,bathrooms:null,sizeSqm:'',furnishing:'unfurnished',
  description:'',privateNotes:'',paci:'',mapUrl:'',latitude:null,longitude:null,paciNumberCount:null,activityType:null,status:'available'};
const types:PropertyType[]=['apartment','villa','floor','building','office','shop','warehouse','chalet'];
const activityValues:ActivityType[]=['company_headquarters','educational_institute','health_institute','law_office','other'];
const blockValues=Array.from({length:12},(_,index)=>String(index+1));

export default function PropertyForm(){const {id,offeredByContactId}=useLocalSearchParams<{id?:string;offeredByContactId?:string}>();const [propertyId]=useState(()=>id??createId('property'));
  const {t,language,isRTL}=useI18n();
  const key=id?`property:${id}`:'property:new';const [form,setForm]=useState<Draft>(empty);
  const [sourceContactId,setSourceContactId]=useState<string|null>(offeredByContactId??null);
  const [ownerContactId,setOwnerContactId]=useState<string|null>(null);
  const [pendingMedia,setPendingMedia]=useState<Array<{uri:string;kind:'image'|'video'}>>([]);const [ready,setReady]=useState(false);const [saving,setSaving]=useState(false);
  const [originalCreatedAt,setOriginalCreatedAt]=useState<string|null>(null);
  const [recoverableDraft,setRecoverableDraft]=useState<Draft|null>(null);const [dirty,setDirty]=useState(false);
  const saveLock=useRef(false);
  const formScroll=useRef<any>(null);const stepY=useRef<Record<string,number>>({});
  const rentRef=useRef<TextInput>(null);const sizeRef=useRef<TextInput>(null);const descriptionRef=useRef<TextInput>(null);
  const [locationOpen,setLocationOpen]=useState(false);const [locationDraft,setLocationDraft]=useState('');
  const commercial=usesCommercialDetails(form.type);

  useEffect(()=>{void (async()=>{if(id){const p=await propertiesRepository.get(id);if(p){setForm({title:p.title,type:p.type,area:p.area,
    blockNumber:p.blockNumber,monthlyRent:String(p.monthlyRent),bedrooms:p.bedrooms,bathrooms:p.bathrooms,sizeSqm:p.sizeSqm?.toString()??'',furnishing:p.furnishing,
    description:p.description,privateNotes:p.privateNotes,paci:p.paci,mapUrl:p.mapUrl,latitude:p.latitude,longitude:p.longitude,
    paciNumberCount:p.paciNumberCount,activityType:p.activityType,status:p.status});setSourceContactId(p.offeredByContactId);setOwnerContactId(p.ownerContactId);setOriginalCreatedAt(p.createdAt)}}else{const draft=await draftsRepository.load<Partial<Draft>>(key);
      if(draft)setRecoverableDraft(normalizeDraft(draft))}setReady(true)})()},[id,key]);
  const draftAutosave=useDraftAutosave({enabled:ready&&dirty,key,value:form,save:draftsRepository.save});
  const changeForm=(next:Draft)=>{setDirty(true);setForm(next)};
  const restoreDraft=()=>{if(!recoverableDraft)return;setForm(recoverableDraft);setRecoverableDraft(null);setDirty(true)};

  const capture=(step:string)=>(event:LayoutChangeEvent)=>{stepY.current[step]=event.nativeEvent.layout.y};
  const reveal=(step:string)=>{Keyboard.dismiss();const scroll=()=>formScroll.current?.scrollTo?.({y:Math.max(0,(stepY.current[step]??0)-12),animated:true});scroll();setTimeout(scroll,180)};

  const pick=async()=>{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images','videos'],allowsMultipleSelection:true,quality:.85});
    if(!result.canceled)setPendingMedia(old=>[...old,...result.assets.map(asset=>({uri:asset.uri,kind:asset.type==='video'?'video' as const:'image' as const}))])};
  const openLocation=()=>{setLocationDraft(form.mapUrl);setLocationOpen(true)};
  const launchGoogleMaps=async()=>{const query=encodeURIComponent(`${form.area||'Kuwait'}, Kuwait`);
    try{await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)}catch{Alert.alert(t('mapOpenFailed'),t('mapOpenFailedMessage'))}};
  const useCurrentLocation=async()=>{const permission=await Location.requestForegroundPermissionsAsync();
    if(permission.status!=='granted'){Alert.alert(t('permissionRequired'),t('locationPermission'));return}
    const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
    setLocationDraft(googleMapsUrl(position.coords.latitude,position.coords.longitude));
  };
  const saveLocation=()=>{const url=locationDraft.trim();if(!url){Alert.alert(t('chooseLocation'),t('chooseLocationMessage'));return}
    const coordinates=parseCoordinatesFromMapUrl(url);changeForm({...form,mapUrl:url,latitude:coordinates?.latitude??null,longitude:coordinates?.longitude??null});setLocationOpen(false)};
  const save=async()=>{if(saveLock.current)return;Keyboard.dismiss();const rent=Number(form.monthlyRent);const size=form.sizeSqm.trim()?Number(form.sizeSqm):null;if(!form.area.trim()||!Number.isFinite(rent)||rent<=0){Alert.alert(t('incompleteData'),t('propertyRequired'));return}
    if(size!==null&&(!Number.isFinite(size)||size<=0)){Alert.alert(t('incompleteData'),t('propertySizeInvalid'));return}
    saveLock.current=true;setSaving(true);await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));const now=new Date().toISOString();try{await propertiesRepository.upsert({id:propertyId,
      title:form.title.trim()||`${getPropertyTypeLabel(language,form.type)} — ${form.area.trim()}`,type:form.type,area:form.area.trim(),blockNumber:form.blockNumber,monthlyRent:rent,
      bedrooms:commercial?null:form.bedrooms,bathrooms:form.bathrooms,sizeSqm:size,furnishing:form.furnishing,
      description:form.description.trim(),privateNotes:form.privateNotes.trim(),paci:form.paci.trim(),mapUrl:form.mapUrl.trim(),latitude:form.latitude,
      longitude:form.longitude,paciNumberCount:commercial?form.paciNumberCount:null,activityType:commercial?form.activityType:null,
      ownerContactId,offeredByContactId:sourceContactId,status:form.status,createdAt:originalCreatedAt??now,updatedAt:now});
    let order=0;let failedMedia=0;for(const media of pendingMedia){try{const ext=media.uri.split('.').pop()??(media.kind==='video'?'mp4':'jpg');const uri=await persistMedia(media.uri,ext);
      await propertiesRepository.addMedia({id:createId('media'),propertyId,uri,kind:media.kind,sortOrder:order++,createdAt:now})}catch{failedMedia++}}
    await draftAutosave.cancel();await draftsRepository.clear(key);setReady(false);setDirty(false);setRecoverableDraft(null);setForm({...empty});setPendingMedia([]);setLocationDraft('');
    const finish=()=>router.replace({pathname:'/property-detail',params:{id:propertyId}});
    Alert.alert(t('propertySavedTitle'),failedMedia?t('propertySavedMediaWarning',{count:failedMedia}):t('propertySavedMessage'),[{text:t('finish'),onPress:finish}],{cancelable:false});
    }catch{Alert.alert(t('propertySaveFailedTitle'),t('propertySaveFailedMessage'))}finally{saveLock.current=false;setSaving(false)}};

  const activityOptions=activityValues.map(value=>({value,label:getActivityLabel(language,value)}));
  const blockOptions=[{value:'none',label:t('notSpecified')},...blockValues.map(value=>({value,label:value}))];
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={id?t('editProperty'):t('addRentalProperty')}/>
    <KeyboardAwareScrollViewCompat ref={formScroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
      {!id&&recoverableDraft?<View style={styles.recovery}><Text style={[styles.recoveryText,{textAlign:isRTL?'right':'left'}]}>{t('restorePropertyDraftHint')}</Text><Pressable onPress={restoreDraft} style={styles.recoveryButton}><Text style={styles.recoveryButtonText}>{t('restorePropertyDraft')}</Text></Pressable></View>:null}
      <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{t('type')}</Text><View style={[styles.chips,{flexDirection:isRTL?'row-reverse':'row'}]}>{types.map(value=><Pressable key={value}
        onPress={()=>changeForm({...form,type:value})} style={[styles.typeChip,form.type===value&&styles.active]}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78} style={[styles.chipText,form.type===value&&styles.activeText]}>{getPropertyTypeLabel(language,value)}</Text></Pressable>)}</View>
      <View onLayout={capture('title')}><FormField label={t('shortPropertyName')} placeholder={t('shortPropertyExample')} value={form.title} onChangeText={title=>changeForm({...form,title})} returnKeyType="next" onSubmitEditing={()=>reveal('area')}/></View>
      <Text style={[styles.helper,{textAlign:isRTL?'right':'left'}]}>{t('shortPropertyHelp')}</Text>
      <View onLayout={capture('area')}><AreaPicker value={form.area} onChange={area=>{changeForm({...form,area});reveal('block')}}/></View>
      <View onLayout={capture('block')}><ChoicePicker label={t('blockNumber')} value={form.blockNumber===null?'none':String(form.blockNumber)} placeholder={t('notSpecified')} options={blockOptions}
        onChange={value=>{changeForm({...form,blockNumber:value==='none'?null:Number(value)});setTimeout(()=>rentRef.current?.focus(),180)}}/></View>
      <View onLayout={capture('rent')}><FormField ref={rentRef} label={`${t('rent')} *`} placeholder={t('currencyPlaceholder')} value={form.monthlyRent} keyboardType="numeric" returnKeyType="done" onSubmitEditing={()=>reveal(commercial?'bathrooms':'bedrooms')} onChangeText={monthlyRent=>changeForm({...form,monthlyRent})}/></View>
      {!commercial&&<View onLayout={capture('bedrooms')}><NumberPicker label={t('bedrooms')} value={form.bedrooms} onChange={bedrooms=>{changeForm({...form,bedrooms});reveal('bathrooms')}}/></View>}
      <View onLayout={capture('bathrooms')}><NumberPicker label={t('bathrooms')} value={form.bathrooms} onChange={bathrooms=>{changeForm({...form,bathrooms});reveal(commercial?'commercial':'size')}}/></View>
      {commercial&&<>
        <View onLayout={capture('commercial')}><NumberPicker label={t('paciNumberCount')} value={form.paciNumberCount} onChange={paciNumberCount=>changeForm({...form,paciNumberCount})}/>
        <ChoicePicker label={t('activityType')} value={form.activityType} placeholder={t('chooseActivity')} options={activityOptions}
          onChange={activityType=>{changeForm({...form,activityType});setTimeout(()=>sizeRef.current?.focus(),180)}}/></View>
      </>}
      <View onLayout={capture('size')}><FormField ref={sizeRef} label={t('sizeSqm')} value={form.sizeSqm} keyboardType="numeric" returnKeyType="next" onSubmitEditing={()=>descriptionRef.current?.focus()} onChangeText={sizeSqm=>changeForm({...form,sizeSqm})}/></View>
      <View onLayout={capture('description')}><FormField ref={descriptionRef} label={t('description')} value={form.description} multiline onFocus={()=>setTimeout(()=>formScroll.current?.scrollTo?.({y:Math.max(0,(stepY.current.description??0)-12),animated:true}),120)} onChangeText={description=>changeForm({...form,description})}/></View>
      <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{t('furnishing')}</Text><View style={[styles.chips,{flexDirection:isRTL?'row-reverse':'row'}]}>{(['furnished','semi_furnished','unfurnished'] as const).map(value=><Pressable key={value}
        onPress={()=>{changeForm({...form,furnishing:value});reveal('status')}} style={[styles.chip,form.furnishing===value&&styles.active]}><Text style={[styles.chipText,form.furnishing===value&&styles.activeText]}>{getFurnishingLabel(language,value)}</Text></Pressable>)}</View>
      <View onLayout={capture('status')}><Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{t('propertyStatus')}</Text><View style={[styles.chips,{flexDirection:isRTL?'row-reverse':'row'}]}>{(['available','rented','paused'] as const).map(value=><Pressable key={value}
        onPress={()=>changeForm({...form,status:value})} style={[styles.chip,form.status===value&&styles.active]}><Text style={[styles.chipText,form.status===value&&styles.activeText]}>{t(value)}</Text></Pressable>)}</View>
      </View>
      <FormField label={t('privateNotes')} value={form.privateNotes} multiline onChangeText={privateNotes=>changeForm({...form,privateNotes})}/>
      <FormField label={t('paci')} value={form.paci} keyboardType="numeric" onChangeText={paci=>changeForm({...form,paci})}/>
      <PrimaryButton title={form.mapUrl?t('locationSelected'):t('chooseGoogleLocation')} onPress={openLocation}/>
      <PrimaryButton title={t('addMedia',{count:pendingMedia.length})} onPress={pick}/><PrimaryButton title={saving?t('savingProperty'):t('saveProperty')} onPress={save} disabled={saving}/>
    </KeyboardAwareScrollViewCompat>
    <Modal visible={locationOpen} animationType="slide" onRequestClose={()=>setLocationOpen(false)}>
      <SafeAreaView style={styles.locationPage}>
        <View style={[styles.locationHeader,{flexDirection:isRTL?'row':'row-reverse'}]}><Pressable onPress={()=>setLocationOpen(false)}><Text style={styles.cancel}>{t('cancel')}</Text></Pressable><Text style={styles.locationTitle}>{t('choosePropertyLocation')}</Text></View>
        <KeyboardAwareScrollViewCompat contentContainerStyle={styles.locationContent} keyboardShouldPersistTaps="always"><Text style={[styles.locationHelp,{textAlign:isRTL?'right':'left'}]}>{t('locationHelp')}</Text>
          <PrimaryButton title={t('openGoogleMaps')} onPress={launchGoogleMaps}/>
          <FormField label={t('map')} placeholder={t('pasteMapLink')} value={locationDraft} onChangeText={setLocationDraft} autoCapitalize="none"/>
          <Text style={styles.or}>{t('or')}</Text><PrimaryButton title={t('useCurrentLocation')} onPress={useCurrentLocation}/>
          <PrimaryButton title={t('saveLocation')} onPress={saveLocation} color={colors.green}/></KeyboardAwareScrollViewCompat>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

function toOptionalNumber(value:unknown):number|null{if(value===null||value===undefined||value==='')return null;const number=Number(value);return Number.isFinite(number)?number:null}
function toBlockNumber(value:unknown):number|null{const number=toOptionalNumber(value);return number!==null&&Number.isInteger(number)&&number>=1&&number<=12?number:null}
function normalizeDraft(draft:Partial<Draft>):Draft{return {...empty,...draft,blockNumber:toBlockNumber(draft.blockNumber),bedrooms:toOptionalNumber(draft.bedrooms),bathrooms:toOptionalNumber(draft.bathrooms),paciNumberCount:toOptionalNumber(draft.paciNumberCount)}}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md,paddingBottom:spacing.xl*5},
  recovery:{borderWidth:1,borderColor:colors.blue,borderRadius:radius.md,backgroundColor:'#EEF6FF',padding:spacing.md,gap:spacing.sm},recoveryText:{color:colors.text,lineHeight:22},recoveryButton:{minHeight:44,borderRadius:radius.sm,backgroundColor:colors.blue,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.md},recoveryButtonText:{color:'white',fontWeight:'800',textAlign:'center'},
  label:{fontWeight:'600',textAlign:'right',color:colors.text},helper:{fontSize:13,color:colors.muted,textAlign:'right',marginTop:-spacing.sm},
  chips:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.sm},chip:{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.md,paddingVertical:10,alignItems:'center',justifyContent:'center',backgroundColor:'white'},typeChip:{width:'30.5%',minHeight:58,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:8,paddingVertical:10,alignItems:'center',justifyContent:'center',backgroundColor:'white'},chipText:{color:colors.text,fontWeight:'700',textAlign:'center'},
  active:{backgroundColor:colors.blue,borderColor:colors.blue},activeText:{color:'white',fontWeight:'700'},locationPage:{flex:1,backgroundColor:colors.background},
  locationHeader:{backgroundColor:colors.blue,padding:spacing.md,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  locationTitle:{fontSize:21,fontWeight:'800',color:'white'},cancel:{color:'white',fontSize:16,fontWeight:'700'},locationContent:{padding:spacing.md,gap:spacing.md},
  locationHelp:{fontSize:16,lineHeight:26,textAlign:'right',color:colors.text,backgroundColor:colors.surface,padding:spacing.md,borderRadius:radius.md},
  or:{textAlign:'center',color:colors.muted,fontWeight:'700'}});
