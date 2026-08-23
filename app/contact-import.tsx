import {useEffect,useMemo,useState} from 'react';
import * as ExpoContacts from 'expo-contacts';
import {Alert,ActivityIndicator,FlatList,Keyboard,Modal,Pressable,SafeAreaView as NativeSafeAreaView,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '@/components/PrimaryButton';
import {ChoicePicker} from '@/components/ChoicePicker';
import {contactsRepository,phoneRepository,PhoneConflictError} from '@/lib/database';
import {createId} from '@/lib/id';
import {AppHeader} from '@/components/AppHeader';
import {candidateIsExecutable,clearVisibleSelection,executablePhones,prepareDeviceContactRowsChunked,selectExecutable,type ImportCandidate} from '@/features/contacts/deviceImport';
import {buildImportPlan,filterImportCandidates,type ImportReport} from '@/features/contacts/importPlan';
import type {ContactRole} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
import {getRoleLabel,useI18n} from '@/i18n/I18nContext';

const ROLES:ContactRole[]=['tenant','owner','broker','real_estate_company','building_guard'];
const NO_ROLE_OVERRIDES=new Map<string,ContactRole>();
const NO_ASSIGNMENTS=new Map<string,string>();
export default function ContactImport(){
  const {t,language,isRTL}=useI18n();const [items,setItems]=useState<ImportCandidate[]>([]);const [selected,setSelected]=useState<Set<string>>(()=>new Set());
  const [defaultRole,setDefaultRole]=useState<ContactRole>('tenant');const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);const [importing,setImporting]=useState(false);const [report,setReport]=useState<ImportReport|null>(null);

  useEffect(()=>{void(async()=>{const permission=await ExpoContacts.requestPermissionsAsync();if(permission.status!=='granted'){setLoading(false);Alert.alert(t('permissionRequired'),t('permissionContacts'));return}
    try{const [result,storedOwners]=await Promise.all([ExpoContacts.getContactsAsync({fields:[ExpoContacts.Fields.PhoneNumbers,ExpoContacts.Fields.Note],sort:ExpoContacts.SortTypes.FirstName}),phoneRepository.listAllWithOwners()]);
      const inputs=result.data.map((contact,index)=>({key:contact.id||`device:${index}`,name:contact.name,notes:contact.note,phones:contact.phoneNumbers??[]}));
      setItems(await prepareDeviceContactRowsChunked(inputs,storedOwners));
    }finally{setLoading(false)}})()},[t]);

  const importable=useMemo(()=>items.filter(item=>candidateIsExecutable(item,NO_ASSIGNMENTS)),[items]);
  const filtered=useMemo(()=>filterImportCandidates(importable,query),[importable,query]);
  const selectedExecutableCount=useMemo(()=>importable.filter(item=>selected.has(item.key)).length,[importable,selected]);
  const roleOptions=useMemo(()=>ROLES.map(value=>({value,label:getRoleLabel(language,value)})),[language]);

  const toggle=(item:ImportCandidate)=>setSelected(old=>{const next=new Set(old);if(next.has(item.key))next.delete(item.key);else next.add(item.key);return next});
  const selectVisible=()=>setSelected(old=>selectExecutable(old,filtered,NO_ASSIGNMENTS));
  const clearVisible=()=>setSelected(old=>clearVisibleSelection(old,filtered));

  const run=async()=>{Keyboard.dismiss();const plan=buildImportPlan({candidates:items,selected,assignments:NO_ASSIGNMENTS,defaultRole,roleOverrides:NO_ROLE_OVERRIDES,now:new Date().toISOString(),createIdentifier:createId});if(!plan.values.length)return;
    setImporting(true);try{const result=await contactsRepository.importManyWithPhones(plan.values);setReport({...plan.report,people:result.importedPeople,phones:result.savedPhones})}
    catch(error){Alert.alert(t('importDone'),error instanceof PhoneConflictError?t('phoneConflictGeneric'):t('importTechnicalFailure'))}finally{setImporting(false)}};

  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('importContacts')}/><View style={styles.body}>
    <ChoicePicker label={t('importRole')} value={defaultRole} placeholder={t('importRole')} options={roleOptions} onChange={setDefaultRole}/>
    <Text style={[styles.hint,{textAlign:isRTL?'right':'left'}]}>{t('importNoneSelected')}</Text>
    <View style={[styles.actions,{flexDirection:isRTL?'row-reverse':'row'}]}><SmallAction title={t('selectVisible')} onPress={selectVisible}/><SmallAction title={t('clearVisible')} onPress={clearVisible}/><SmallAction title={t('clearAll')} onPress={()=>setSelected(new Set())}/></View>
    <Text style={[styles.count,{textAlign:isRTL?'right':'left'}]}>{t('selectedExecutable',{selected:selectedExecutableCount,available:importable.length})}</Text>
    <Text style={[styles.localSearchLabel,{textAlign:isRTL?'right':'left'}]}>{t('phoneContactsSearch')}</Text>
    <View style={[styles.localSearchBox,{flexDirection:isRTL?'row-reverse':'row'}]}><Ionicons name="search" size={23} color={colors.red}/><TextInput value={query} onChangeText={setQuery}
      placeholder={t('contactSearch')} placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue}
      style={[styles.search,{textAlign:isRTL?'right':'left'}]}/></View>
    <FlatList data={filtered} extraData={selected} keyExtractor={item=>item.key} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{t('noImportableContacts')}</Text>}
      initialNumToRender={20} maxToRenderPerBatch={20} updateCellsBatchingPeriod={32} windowSize={7} removeClippedSubviews keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets ListHeaderComponent={loading?<View style={styles.loading}><ActivityIndicator color={colors.blue}/><Text>{t('preparingContacts')}</Text></View>:null}
      renderItem={({item})=>{const checked=selected.has(item.key);return <Pressable onPress={()=>toggle(item)} style={({pressed})=>[styles.row,checked&&styles.selectedRow,pressed&&styles.pressed]}>
        <View style={[styles.rowHeader,{flexDirection:isRTL?'row-reverse':'row'}]}><Text style={[styles.check,checked&&styles.checked]}>{checked?'✓':'○'}</Text><Text style={[styles.name,{textAlign:isRTL?'right':'left'}]}>{item.name}</Text></View>
        {executablePhones(item,NO_ASSIGNMENTS).map(phone=><Text key={phone.normalized} style={[styles.phone,{textAlign:isRTL?'right':'left'}]}>{phone.display}{phone.label?` · ${phone.label}`:''}</Text>)}
      </Pressable>}}/>
    <View style={styles.footer}><PrimaryButton title={importing?t('importingContacts'):`${t('importSelected')} (${selectedExecutableCount})`} onPress={run} disabled={!selectedExecutableCount||importing}/></View>
  </View>

  <ReportModal report={report} onClose={()=>router.back()} t={t} isRTL={isRTL}/>
  </SafeAreaView>;
}

function SmallAction({title,onPress}:{title:string;onPress:()=>void}){return <Pressable onPress={onPress} style={({pressed})=>[styles.smallAction,pressed&&styles.pressed]}><Text style={styles.smallActionText}>{title}</Text></Pressable>}
function ReportModal({report,onClose,t,isRTL}:{report:ImportReport|null;onClose:()=>void;t:(key:any,values?:Record<string,string|number>)=>string;isRTL:boolean}){
  if(!report)return null;return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><NativeSafeAreaView style={styles.reportSheet}><ScrollView contentContainerStyle={styles.reportContent}><Text style={styles.modalTitle}>{t('importDone')}</Text>
    <Text style={[styles.summary,{textAlign:isRTL?'right':'left'}]}>{t('importSummaryPeople',{count:report.people})}</Text><Text style={[styles.summary,{textAlign:isRTL?'right':'left'}]}>{t('importSummaryPhones',{count:report.phones})}</Text>
    <PrimaryButton title={t('finish')} onPress={onClose}/></ScrollView></NativeSafeAreaView></View></Modal>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},body:{flex:1,padding:spacing.md},hint:{color:colors.muted,marginVertical:spacing.sm},
  actions:{gap:spacing.xs,flexWrap:'wrap'},smallAction:{borderWidth:1,borderColor:colors.blue,borderRadius:radius.sm,paddingHorizontal:10,paddingVertical:8,backgroundColor:'white'},smallActionText:{color:colors.blue,fontWeight:'700'},
  disabled:{opacity:.45},count:{color:colors.muted,marginTop:spacing.sm},
  localSearchLabel:{color:colors.red,fontWeight:'900',fontSize:16,marginTop:spacing.md},
  localSearchBox:{minHeight:54,borderWidth:2,borderColor:colors.red,borderRadius:radius.md,backgroundColor:'#E8F4FF',alignItems:'center',gap:spacing.sm,paddingHorizontal:spacing.md,marginTop:spacing.xs},
  search:{flex:1,minHeight:50,color:colors.text,fontSize:16,paddingVertical:0},
  list:{gap:spacing.sm,paddingVertical:spacing.md},loading:{alignItems:'center',gap:spacing.sm,padding:spacing.md},row:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:'white',gap:spacing.sm},
  selectedRow:{borderColor:colors.blue,borderWidth:2,backgroundColor:'#F2F8FF'},pressed:{opacity:.72},rowHeader:{alignItems:'flex-start',gap:spacing.sm},check:{fontSize:25,color:colors.blue,minWidth:28},checked:{fontWeight:'900'},name:{flex:1,fontSize:17,fontWeight:'800',color:colors.text,flexWrap:'wrap'},
  phone:{color:colors.text,fontSize:15,flexWrap:'wrap'},
  footer:{paddingTop:spacing.sm},empty:{textAlign:'center',color:colors.muted,marginTop:40},backdrop:{flex:1,backgroundColor:'rgba(8,25,45,.45)',justifyContent:'flex-end'},
  modalTitle:{fontSize:21,fontWeight:'900',color:colors.red,textAlign:'center',marginBottom:spacing.md},
  reportSheet:{backgroundColor:'white',borderTopLeftRadius:radius.lg,borderTopRightRadius:radius.lg,maxHeight:'85%'},reportContent:{padding:spacing.lg,gap:spacing.md},summary:{fontSize:18,fontWeight:'800',color:colors.text}});
