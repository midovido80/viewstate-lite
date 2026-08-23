import {useEffect,useMemo,useState} from 'react';
import * as ExpoContacts from 'expo-contacts';
import {Alert,ActivityIndicator,FlatList,Keyboard,Modal,Pressable,SafeAreaView as NativeSafeAreaView,ScrollView,StyleSheet,Text,TextInput,View,type GestureResponderEvent} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '@/components/PrimaryButton';
import {ChoicePicker} from '@/components/ChoicePicker';
import {contactsRepository,phoneRepository,PhoneConflictError} from '@/lib/database';
import {createId} from '@/lib/id';
import {AppHeader} from '@/components/AppHeader';
import {candidateIsExecutable,clearVisibleSelection,DevicePreparationCancelledError,prepareDeviceContactRowsChunked,removeNonExecutableSelection,selectExecutable,type ImportCandidate} from '@/features/contacts/deviceImport';
import {buildImportPlan,filterImportCandidates,type ImportReport} from '@/features/contacts/importPlan';
import type {ContactRole} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
import {getRoleLabel,useI18n} from '@/i18n/I18nContext';

const ROLES:ContactRole[]=['tenant','owner','broker','real_estate_company','building_guard'];
const NO_ROLE_OVERRIDES=new Map<string,ContactRole>();
export default function ContactImport(){
  const {t,language,isRTL}=useI18n();const [items,setItems]=useState<ImportCandidate[]>([]);const [selected,setSelected]=useState<Set<string>>(()=>new Set());
  const [defaultRole,setDefaultRole]=useState<ContactRole>('tenant');const [assignments,setAssignments]=useState<Map<string,string>>(()=>new Map());
  const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);const [importing,setImporting]=useState(false);const [report,setReport]=useState<ImportReport|null>(null);const [details,setDetails]=useState(false);

  useEffect(()=>{let cancelled=false;void(async()=>{const permission=await ExpoContacts.requestPermissionsAsync();if(cancelled)return;if(permission.status!=='granted'){setLoading(false);Alert.alert(t('permissionRequired'),t('permissionContacts'));return}
    try{const [result,storedOwners]=await Promise.all([ExpoContacts.getContactsAsync({fields:[ExpoContacts.Fields.PhoneNumbers,ExpoContacts.Fields.Note],sort:ExpoContacts.SortTypes.FirstName}),phoneRepository.listAllWithOwners()]);
      const inputs=result.data.map((contact,index)=>({key:contact.id||`device:${index}`,name:contact.name,notes:contact.note,phones:contact.phoneNumbers??[]}));
      const prepared=await prepareDeviceContactRowsChunked(inputs,storedOwners,100,()=>new Promise(resolve=>setTimeout(resolve,0)),()=>cancelled);if(!cancelled)setItems(prepared);
    }catch(error){if(!cancelled&&!(error instanceof DevicePreparationCancelledError))Alert.alert(t('importDone'),t('importTechnicalFailure'))}
    finally{if(!cancelled)setLoading(false)}})();return()=>{cancelled=true}},[t]);

  const filtered=useMemo(()=>filterImportCandidates(items,query),[items,query]);
  const availableCount=useMemo(()=>items.filter(item=>candidateIsExecutable(item,assignments)).length,[items,assignments]);
  const selectedExecutableCount=useMemo(()=>items.filter(item=>selected.has(item.key)&&candidateIsExecutable(item,assignments)).length,[items,selected,assignments]);
  const roleOptions=useMemo(()=>ROLES.map(value=>({value,label:getRoleLabel(language,value)})),[language]);

  const toggle=(item:ImportCandidate)=>{if(!candidateIsExecutable(item,assignments))return;setSelected(old=>{const next=new Set(old);if(next.has(item.key))next.delete(item.key);else next.add(item.key);return next})};
  const selectVisible=()=>setSelected(old=>selectExecutable(old,filtered,assignments));
  const clearVisible=()=>setSelected(old=>clearVisibleSelection(old,filtered));
  const chooseBatchOwner=(normalized:string,key:string)=>{const nextAssignments=new Map(assignments);nextAssignments.set(normalized,key);setAssignments(nextAssignments);
    setSelected(old=>removeNonExecutableSelection(old,items,nextAssignments))};
  const stop=(event:GestureResponderEvent)=>event.stopPropagation();

  const run=async()=>{Keyboard.dismiss();const plan=buildImportPlan({candidates:items,selected,assignments,defaultRole,roleOverrides:NO_ROLE_OVERRIDES,now:new Date().toISOString(),createIdentifier:createId});if(!plan.values.length)return;
    setImporting(true);try{const result=await contactsRepository.importManyWithPhones(plan.values);const late=result.lateStoredConflicts.length;setReport({...plan.report,people:result.importedPeople,phones:result.savedPhones,storedConflicts:plan.report.storedConflicts+late,problems:plan.report.problems+late})}
    catch(error){Alert.alert(t('importDone'),error instanceof PhoneConflictError?t('phoneConflictGeneric'):t('importTechnicalFailure'))}finally{setImporting(false)}};

  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('importContacts')}/><View style={styles.body}>
    <ChoicePicker label={t('importRole')} value={defaultRole} placeholder={t('importRole')} options={roleOptions} onChange={setDefaultRole}/>
    <Text style={[styles.hint,{textAlign:isRTL?'right':'left'}]}>{t('importNoneSelected')}</Text>
    <View style={[styles.actions,{flexDirection:isRTL?'row-reverse':'row'}]}><SmallAction title={t('selectVisible')} onPress={selectVisible}/><SmallAction title={t('clearVisible')} onPress={clearVisible}/><SmallAction title={t('clearAll')} onPress={()=>setSelected(new Set())}/></View>
    <Text style={[styles.count,{textAlign:isRTL?'right':'left'}]}>{t('selectedExecutable',{selected:selectedExecutableCount,available:availableCount})}</Text>
    <Text style={[styles.localSearchLabel,{textAlign:isRTL?'right':'left'}]}>{t('phoneContactsSearch')}</Text>
    <View style={[styles.localSearchBox,{flexDirection:isRTL?'row-reverse':'row'}]}><Ionicons name="search" size={23} color={colors.red}/><TextInput value={query} onChangeText={setQuery}
      placeholder={t('contactSearch')} placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue}
      style={[styles.search,{textAlign:isRTL?'right':'left'}]}/></View>
    <FlatList data={filtered} extraData={[selected,assignments]} keyExtractor={item=>item.key} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{t('noImportableContacts')}</Text>}
      initialNumToRender={20} maxToRenderPerBatch={20} updateCellsBatchingPeriod={32} windowSize={7} removeClippedSubviews keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets ListHeaderComponent={loading?<View style={styles.loading}><ActivityIndicator color={colors.blue}/><Text>{t('preparingContacts')}</Text></View>:null}
      renderItem={({item})=>{const executable=candidateIsExecutable(item,assignments);const checked=selected.has(item.key);return <Pressable onPress={()=>toggle(item)} style={({pressed})=>[styles.row,checked&&styles.selectedRow,!executable&&styles.unavailableRow,pressed&&executable&&styles.pressed]}>
        <View style={[styles.rowHeader,{flexDirection:isRTL?'row-reverse':'row'}]}><Text style={[styles.check,checked&&styles.checked]}>{checked?'✓':executable?'○':'—'}</Text><Text style={[styles.name,{textAlign:isRTL?'right':'left'}]}>{item.name}</Text></View>
        {item.phones.map(phone=><View key={phone.normalized} style={styles.phoneBlock}><Text style={[styles.phone,{textAlign:isRTL?'right':'left'}]}>{phone.display}{phone.label?` · ${phone.label}`:''}</Text>
          {phone.storedConflicts.length?<Pressable onPress={event=>{stop(event);router.push({pathname:'/contact-detail',params:{id:phone.storedConflicts[0]!.contactId}})}}><Text style={[styles.conflictLink,{textAlign:isRTL?'right':'left'}]}>{t('storedNumberConflict',{name:phone.storedConflicts.map(owner=>owner.contactName).join('، ')})} — {t('openStoredPerson')}</Text></Pressable>:null}
          {!phone.storedConflicts.length&&phone.batchContactKeys.length>1?<View style={styles.batchBox}><Text style={[styles.issueText,{textAlign:isRTL?'right':'left'}]}>{t('batchNumberConflict')}</Text><Pressable onPress={event=>{stop(event);chooseBatchOwner(phone.normalized,item.key)}} style={[styles.radioRow,{flexDirection:isRTL?'row-reverse':'row'}]}><Text style={styles.radio}>{assignments.get(phone.normalized)===item.key?'◉':'○'}</Text><Text style={styles.radioText}>{assignments.get(phone.normalized)===item.key?t('numberAssignedHere'):t('assignNumberHere')}</Text></Pressable></View>:null}
        </View>)}
        {item.invalidDisplays.length?<Text style={[styles.issueText,{textAlign:isRTL?'right':'left'}]}>{t('invalidPhonesHere',{count:item.invalidDisplays.length})}</Text>:null}
        {item.duplicateDisplays.length?<Text style={[styles.issueText,{textAlign:isRTL?'right':'left'}]}>{t('duplicatePhonesHere',{count:item.duplicateDisplays.length})}</Text>:null}
        {item.notes.length?<View style={styles.notesPreview}><Text style={[styles.notesLabel,{textAlign:isRTL?'right':'left'}]}>{t('deviceContactNotes')}</Text><Text style={[styles.notesText,{textAlign:isRTL?'right':'left'}]}>{item.notes}</Text></View>:null}
        {!executable?<Text style={[styles.unavailableText,{textAlign:isRTL?'right':'left'}]}>{t('noUsablePhones')}</Text>:null}
      </Pressable>}}/>
    <View style={styles.footer}><PrimaryButton title={importing?t('importingContacts'):`${t('importSelected')} (${selectedExecutableCount})`} onPress={run} disabled={!selectedExecutableCount||importing}/></View>
  </View>

  <ReportModal report={report} details={details} setDetails={setDetails} onClose={()=>router.back()} t={t} isRTL={isRTL}/>
  </SafeAreaView>;
}

function SmallAction({title,onPress}:{title:string;onPress:()=>void}){return <Pressable onPress={onPress} style={({pressed})=>[styles.smallAction,pressed&&styles.pressed]}><Text style={styles.smallActionText}>{title}</Text></Pressable>}
function ReportModal({report,details,setDetails,onClose,t,isRTL}:{report:ImportReport|null;details:boolean;setDetails:(value:boolean)=>void;onClose:()=>void;t:(key:any,values?:Record<string,string|number>)=>string;isRTL:boolean}){
  if(!report)return null;return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><NativeSafeAreaView style={styles.reportSheet}><ScrollView contentContainerStyle={styles.reportContent}><Text style={styles.modalTitle}>{t('importDone')}</Text>
    <Text style={[styles.summary,{textAlign:isRTL?'right':'left'}]}>{t('importSummaryPeople',{count:report.people})}</Text><Text style={[styles.summary,{textAlign:isRTL?'right':'left'}]}>{t('importSummaryPhones',{count:report.phones})}</Text><Text style={[styles.summary,{textAlign:isRTL?'right':'left'}]}>{t('importSummaryProblems',{count:report.problems})}</Text>
    <Pressable onPress={()=>setDetails(!details)} style={styles.detailsButton}><Text style={styles.detailsButtonText}>{details?t('hideDetails'):t('showDetails')}</Text></Pressable>
    {details?<View style={styles.details}><Text>{t('invalidDetail',{count:report.invalid})}</Text><Text>{t('duplicateDetail',{count:report.duplicates})}</Text><Text>{t('storedConflictDetail',{count:report.storedConflicts})}</Text><Text>{t('batchConflictDetail',{count:report.batchConflicts})}</Text><Text style={styles.secondary}>{t('unselectedInfo',{count:report.unselected})}</Text></View>:null}
    <PrimaryButton title={t('finish')} onPress={onClose}/></ScrollView></NativeSafeAreaView></View></Modal>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},body:{flex:1,padding:spacing.md},hint:{color:colors.muted,marginVertical:spacing.sm},
  actions:{gap:spacing.xs,flexWrap:'wrap'},smallAction:{borderWidth:1,borderColor:colors.blue,borderRadius:radius.sm,paddingHorizontal:10,paddingVertical:8,backgroundColor:'white'},smallActionText:{color:colors.blue,fontWeight:'700'},
  disabled:{opacity:.45},count:{color:colors.muted,marginTop:spacing.sm},
  localSearchLabel:{color:colors.red,fontWeight:'900',fontSize:16,marginTop:spacing.md},
  localSearchBox:{minHeight:54,borderWidth:2,borderColor:colors.red,borderRadius:radius.md,backgroundColor:'#E8F4FF',alignItems:'center',gap:spacing.sm,paddingHorizontal:spacing.md,marginTop:spacing.xs},
  search:{flex:1,minHeight:50,color:colors.text,fontSize:16,paddingVertical:0},
  list:{gap:spacing.sm,paddingVertical:spacing.md},loading:{alignItems:'center',gap:spacing.sm,padding:spacing.md},row:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:'white',gap:spacing.sm},
  selectedRow:{borderColor:colors.blue,borderWidth:2,backgroundColor:'#F2F8FF'},unavailableRow:{backgroundColor:colors.surface,opacity:.82},pressed:{opacity:.72},rowHeader:{alignItems:'flex-start',gap:spacing.sm},check:{fontSize:25,color:colors.blue,minWidth:28},checked:{fontWeight:'900'},name:{flex:1,fontSize:17,fontWeight:'800',color:colors.text,flexWrap:'wrap'},
  phoneBlock:{gap:4},phone:{color:colors.text,fontSize:15,flexWrap:'wrap'},conflictLink:{color:colors.blue,fontWeight:'700',flexWrap:'wrap'},
  batchBox:{borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,padding:spacing.sm,gap:4},issueText:{color:colors.red,flexWrap:'wrap'},radioRow:{alignItems:'center',gap:spacing.sm,paddingVertical:5},radio:{fontSize:22,color:colors.blue},radioText:{color:colors.blue,fontWeight:'700',flex:1,flexWrap:'wrap'},unavailableText:{color:colors.red,fontWeight:'800'},
  notesPreview:{backgroundColor:'#FFF8E8',borderRadius:radius.sm,padding:spacing.sm,gap:3},notesLabel:{color:colors.red,fontWeight:'800'},notesText:{color:colors.text,lineHeight:21},
  footer:{paddingTop:spacing.sm},empty:{textAlign:'center',color:colors.muted,marginTop:40},backdrop:{flex:1,backgroundColor:'rgba(8,25,45,.45)',justifyContent:'flex-end'},
  modalTitle:{fontSize:21,fontWeight:'900',color:colors.red,textAlign:'center',marginBottom:spacing.md},
  reportSheet:{backgroundColor:'white',borderTopLeftRadius:radius.lg,borderTopRightRadius:radius.lg,maxHeight:'85%'},reportContent:{padding:spacing.lg,gap:spacing.md},summary:{fontSize:18,fontWeight:'800',color:colors.text},detailsButton:{alignItems:'center',padding:10},detailsButtonText:{color:colors.blue,fontWeight:'800'},details:{gap:spacing.sm},secondary:{color:colors.muted}});
