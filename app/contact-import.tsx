import {useEffect,useMemo,useState} from 'react';
import * as ExpoContacts from 'expo-contacts';
import {Alert,ActivityIndicator,FlatList,Modal,Pressable,SafeAreaView as NativeSafeAreaView,ScrollView,StyleSheet,Text,TextInput,View,type GestureResponderEvent} from 'react-native';
import {router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '@/components/PrimaryButton';
import {ChoicePicker} from '@/components/ChoicePicker';
import {contactsRepository,phoneRepository,PhoneConflictError} from '@/lib/database';
import {createId} from '@/lib/id';
import {AppHeader} from '@/components/AppHeader';
import {candidateIsExecutable,clearVisibleSelection,prepareDeviceContactRowsChunked,removeNonExecutableSelection,resolvedRole,selectExecutable,type ImportCandidate} from '@/features/contacts/deviceImport';
import {buildImportPlan,filterImportCandidates,resetSelectedRoleOverrides,selectedHasRoleOverrides,type ImportReport} from '@/features/contacts/importPlan';
import type {ContactRole} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
import {getRoleLabel,useI18n} from '@/i18n/I18nContext';

const ROLES:ContactRole[]=['tenant','owner','broker','real_estate_company','building_guard'];
export default function ContactImport(){
  const {t,language,isRTL}=useI18n();const [items,setItems]=useState<ImportCandidate[]>([]);const [selected,setSelected]=useState<Set<string>>(()=>new Set());
  const [defaultRole,setDefaultRole]=useState<ContactRole>('tenant');const [roleOverrides,setRoleOverrides]=useState<Map<string,ContactRole>>(()=>new Map());
  const [assignments,setAssignments]=useState<Map<string,string>>(()=>new Map());const [roleTarget,setRoleTarget]=useState<string|null>(null);
  const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);const [importing,setImporting]=useState(false);const [report,setReport]=useState<ImportReport|null>(null);const [details,setDetails]=useState(false);

  useEffect(()=>{void(async()=>{const permission=await ExpoContacts.requestPermissionsAsync();if(permission.status!=='granted'){setLoading(false);Alert.alert(t('permissionRequired'),t('permissionContacts'));return}
    try{const [result,storedOwners]=await Promise.all([ExpoContacts.getContactsAsync({fields:[ExpoContacts.Fields.PhoneNumbers,ExpoContacts.Fields.Note],sort:ExpoContacts.SortTypes.FirstName}),phoneRepository.listAllWithOwners()]);
      const inputs=result.data.map((contact,index)=>({key:contact.id||`device:${index}`,name:contact.name,notes:contact.note,phones:contact.phoneNumbers??[]}));
      setItems(await prepareDeviceContactRowsChunked(inputs,storedOwners));
    }finally{setLoading(false)}})()},[t]);

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
  const applyDefaultRole=()=>{const apply=()=>setRoleOverrides(old=>resetSelectedRoleOverrides(selected,old));
    if(selectedHasRoleOverrides(selected,roleOverrides))Alert.alert(t('replaceRoleOverridesTitle'),t('replaceRoleOverridesMessage'),[{text:t('cancel'),style:'cancel'},{text:t('applyNow'),onPress:apply}]);else apply()};

  const run=async()=>{const plan=buildImportPlan({candidates:items,selected,assignments,defaultRole,roleOverrides,now:new Date().toISOString(),createIdentifier:createId});if(!plan.values.length)return;
    setImporting(true);try{const result=await contactsRepository.importManyWithPhones(plan.values);const late=result.lateStoredConflicts.length;setReport({...plan.report,people:result.importedPeople,phones:result.savedPhones,storedConflicts:plan.report.storedConflicts+late,problems:plan.report.problems+late})}
    catch(error){Alert.alert(t('importDone'),error instanceof PhoneConflictError?t('phoneConflictGeneric'):t('importTechnicalFailure'))}finally{setImporting(false)}};

  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('importContacts')}/><View style={styles.body}>
    <ChoicePicker label={t('defaultImportRole')} value={defaultRole} placeholder={t('defaultImportRole')} options={roleOptions} onChange={setDefaultRole}/>
    <Text style={[styles.hint,{textAlign:isRTL?'right':'left'}]}>{t('importNoneSelected')}</Text>
    <View style={[styles.actions,{flexDirection:isRTL?'row-reverse':'row'}]}><SmallAction title={t('selectVisible')} onPress={selectVisible}/><SmallAction title={t('clearVisible')} onPress={clearVisible}/><SmallAction title={t('clearAll')} onPress={()=>setSelected(new Set())}/></View>
    <Pressable onPress={applyDefaultRole} disabled={!selected.size} style={[styles.applyRole,!selected.size&&styles.disabled]}><Text style={styles.applyRoleText}>{t('applyRoleToSelected')}</Text></Pressable>
    <Text style={[styles.count,{textAlign:isRTL?'right':'left'}]}>{t('selectedExecutable',{selected:selectedExecutableCount,available:availableCount})}</Text>
    <TextInput value={query} onChangeText={setQuery} placeholder={t('contactSearch')} placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue} style={[styles.search,{textAlign:isRTL?'right':'left'}]}/>
    <FlatList data={filtered} extraData={[selected,assignments,roleOverrides,defaultRole]} keyExtractor={item=>item.key} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{t('noImportableContacts')}</Text>}
      initialNumToRender={20} maxToRenderPerBatch={20} updateCellsBatchingPeriod={32} windowSize={7} removeClippedSubviews keyboardShouldPersistTaps="handled" ListHeaderComponent={loading?<View style={styles.loading}><ActivityIndicator color={colors.blue}/><Text>{t('preparingContacts')}</Text></View>:null}
      renderItem={({item})=>{const executable=candidateIsExecutable(item,assignments);const checked=selected.has(item.key);const role=resolvedRole(item.key,defaultRole,roleOverrides);return <Pressable onPress={()=>toggle(item)} style={({pressed})=>[styles.row,checked&&styles.selectedRow,!executable&&styles.unavailableRow,pressed&&executable&&styles.pressed]}>
        <View style={[styles.rowHeader,{flexDirection:isRTL?'row-reverse':'row'}]}><Text style={[styles.check,checked&&styles.checked]}>{checked?'✓':executable?'○':'—'}</Text><Text style={[styles.name,{textAlign:isRTL?'right':'left'}]}>{item.name}</Text></View>
        <Pressable onPress={event=>{stop(event);if(executable)setRoleTarget(item.key)}} style={[styles.roleButton,{alignSelf:isRTL?'flex-end':'flex-start'}]}><Text style={styles.roleText}>{t('rowRole')}: {getRoleLabel(language,role)}{roleOverrides.has(item.key)?' •':''}</Text></Pressable>
        {item.phones.map(phone=><View key={phone.normalized} style={styles.phoneBlock}><Text style={[styles.phone,{textAlign:isRTL?'right':'left'}]}>{phone.display}{phone.label?` · ${phone.label}`:''}</Text>
          {phone.storedConflicts.length?<Pressable onPress={event=>{stop(event);router.push({pathname:'/contact-detail',params:{id:phone.storedConflicts[0]!.contactId}})}}><Text style={[styles.conflictLink,{textAlign:isRTL?'right':'left'}]}>{t('storedNumberConflict',{name:phone.storedConflicts.map(owner=>owner.contactName).join('، ')})} — {t('openStoredPerson')}</Text></Pressable>:null}
          {!phone.storedConflicts.length&&phone.batchContactKeys.length>1?<View style={styles.batchBox}><Text style={[styles.issueText,{textAlign:isRTL?'right':'left'}]}>{t('batchNumberConflict')}</Text><Pressable onPress={event=>{stop(event);chooseBatchOwner(phone.normalized,item.key)}} style={[styles.radioRow,{flexDirection:isRTL?'row-reverse':'row'}]}><Text style={styles.radio}>{assignments.get(phone.normalized)===item.key?'◉':'○'}</Text><Text style={styles.radioText}>{assignments.get(phone.normalized)===item.key?t('numberAssignedHere'):t('assignNumberHere')}</Text></Pressable></View>:null}
        </View>)}
        {item.invalidDisplays.length?<Text style={[styles.issueText,{textAlign:isRTL?'right':'left'}]}>{t('invalidPhonesHere',{count:item.invalidDisplays.length})}</Text>:null}
        {item.duplicateDisplays.length?<Text style={[styles.issueText,{textAlign:isRTL?'right':'left'}]}>{t('duplicatePhonesHere',{count:item.duplicateDisplays.length})}</Text>:null}
        {!executable?<Text style={[styles.unavailableText,{textAlign:isRTL?'right':'left'}]}>{t('noUsablePhones')}</Text>:null}
      </Pressable>}}/>
    <View style={styles.footer}><PrimaryButton title={importing?t('importingContacts'):`${t('importSelected')} (${selectedExecutableCount})`} onPress={run} disabled={!selectedExecutableCount||importing}/></View>
  </View>

  <RoleModal visible={roleTarget!==null} value={roleTarget?resolvedRole(roleTarget,defaultRole,roleOverrides):defaultRole} options={roleOptions} onClose={()=>setRoleTarget(null)} onChange={value=>{if(roleTarget)setRoleOverrides(old=>new Map(old).set(roleTarget,value));setRoleTarget(null)}} title={t('rowRole')}/>
  <ReportModal report={report} details={details} setDetails={setDetails} onClose={()=>router.back()} t={t} isRTL={isRTL}/>
  </SafeAreaView>;
}

function SmallAction({title,onPress}:{title:string;onPress:()=>void}){return <Pressable onPress={onPress} style={({pressed})=>[styles.smallAction,pressed&&styles.pressed]}><Text style={styles.smallActionText}>{title}</Text></Pressable>}
function RoleModal({visible,value,options,onClose,onChange,title}:{visible:boolean;value:ContactRole;options:Array<{value:ContactRole;label:string}>;onClose:()=>void;onChange:(value:ContactRole)=>void;title:string}){
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.backdrop} onPress={onClose}><NativeSafeAreaView style={styles.sheet}><Text style={styles.modalTitle}>{title}</Text>{options.map(option=><Pressable key={option.value} onPress={()=>onChange(option.value)} style={styles.roleOption}><Text style={styles.radio}>{option.value===value?'◉':'○'}</Text><Text style={styles.roleOptionText}>{option.label}</Text></Pressable>)}</NativeSafeAreaView></Pressable></Modal>}
function ReportModal({report,details,setDetails,onClose,t,isRTL}:{report:ImportReport|null;details:boolean;setDetails:(value:boolean)=>void;onClose:()=>void;t:(key:any,values?:Record<string,string|number>)=>string;isRTL:boolean}){
  if(!report)return null;return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><NativeSafeAreaView style={styles.reportSheet}><ScrollView contentContainerStyle={styles.reportContent}><Text style={styles.modalTitle}>{t('importDone')}</Text>
    <Text style={[styles.summary,{textAlign:isRTL?'right':'left'}]}>{t('importSummaryPeople',{count:report.people})}</Text><Text style={[styles.summary,{textAlign:isRTL?'right':'left'}]}>{t('importSummaryPhones',{count:report.phones})}</Text><Text style={[styles.summary,{textAlign:isRTL?'right':'left'}]}>{t('importSummaryProblems',{count:report.problems})}</Text>
    <Pressable onPress={()=>setDetails(!details)} style={styles.detailsButton}><Text style={styles.detailsButtonText}>{details?t('hideDetails'):t('showDetails')}</Text></Pressable>
    {details?<View style={styles.details}><Text>{t('invalidDetail',{count:report.invalid})}</Text><Text>{t('duplicateDetail',{count:report.duplicates})}</Text><Text>{t('storedConflictDetail',{count:report.storedConflicts})}</Text><Text>{t('batchConflictDetail',{count:report.batchConflicts})}</Text><Text style={styles.secondary}>{t('unselectedInfo',{count:report.unselected})}</Text></View>:null}
    <PrimaryButton title={t('finish')} onPress={onClose}/></ScrollView></NativeSafeAreaView></View></Modal>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},body:{flex:1,padding:spacing.md},hint:{color:colors.muted,marginVertical:spacing.sm},
  actions:{gap:spacing.xs,flexWrap:'wrap'},smallAction:{borderWidth:1,borderColor:colors.blue,borderRadius:radius.sm,paddingHorizontal:10,paddingVertical:8,backgroundColor:'white'},smallActionText:{color:colors.blue,fontWeight:'700'},
  applyRole:{marginTop:spacing.sm,borderRadius:radius.sm,backgroundColor:colors.blue,padding:10,alignItems:'center'},applyRoleText:{color:'white',fontWeight:'700',textAlign:'center'},disabled:{opacity:.45},count:{color:colors.muted,marginTop:spacing.sm},
  search:{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:'white',color:colors.text,paddingHorizontal:spacing.md,fontSize:16,marginTop:spacing.sm},
  list:{gap:spacing.sm,paddingVertical:spacing.md},loading:{alignItems:'center',gap:spacing.sm,padding:spacing.md},row:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:'white',gap:spacing.sm},
  selectedRow:{borderColor:colors.blue,borderWidth:2,backgroundColor:'#F2F8FF'},unavailableRow:{backgroundColor:colors.surface,opacity:.82},pressed:{opacity:.72},rowHeader:{alignItems:'flex-start',gap:spacing.sm},check:{fontSize:25,color:colors.blue,minWidth:28},checked:{fontWeight:'900'},name:{flex:1,fontSize:17,fontWeight:'800',color:colors.text,flexWrap:'wrap'},
  roleButton:{borderWidth:1,borderColor:colors.blue,borderRadius:radius.sm,paddingHorizontal:10,paddingVertical:8,maxWidth:'100%'},roleText:{color:colors.blue,fontWeight:'700',flexWrap:'wrap'},phoneBlock:{gap:4},phone:{color:colors.text,fontSize:15,flexWrap:'wrap'},conflictLink:{color:colors.blue,fontWeight:'700',flexWrap:'wrap'},
  batchBox:{borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,padding:spacing.sm,gap:4},issueText:{color:colors.red,flexWrap:'wrap'},radioRow:{alignItems:'center',gap:spacing.sm,paddingVertical:5},radio:{fontSize:22,color:colors.blue},radioText:{color:colors.blue,fontWeight:'700',flex:1,flexWrap:'wrap'},unavailableText:{color:colors.red,fontWeight:'800'},
  footer:{paddingTop:spacing.sm},empty:{textAlign:'center',color:colors.muted,marginTop:40},backdrop:{flex:1,backgroundColor:'rgba(8,25,45,.45)',justifyContent:'flex-end'},sheet:{backgroundColor:'white',padding:spacing.md,borderTopLeftRadius:radius.lg,borderTopRightRadius:radius.lg},
  modalTitle:{fontSize:21,fontWeight:'900',color:colors.red,textAlign:'center',marginBottom:spacing.md},roleOption:{minHeight:54,borderBottomWidth:1,borderBottomColor:colors.border,flexDirection:'row',alignItems:'center',gap:spacing.md},roleOptionText:{fontSize:17,color:colors.text,flex:1,flexWrap:'wrap'},
  reportSheet:{backgroundColor:'white',borderTopLeftRadius:radius.lg,borderTopRightRadius:radius.lg,maxHeight:'85%'},reportContent:{padding:spacing.lg,gap:spacing.md},summary:{fontSize:18,fontWeight:'800',color:colors.text},detailsButton:{alignItems:'center',padding:10},detailsButtonText:{color:colors.blue,fontWeight:'800'},details:{gap:spacing.sm},secondary:{color:colors.muted}});
