import {useEffect,useState} from 'react';import * as ExpoContacts from 'expo-contacts';
import {Alert,FlatList,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';import {router} from 'expo-router';import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '@/components/PrimaryButton';import {contactsRepository} from '@/lib/database';import {normalizeKuwaitPhone} from '@/lib/phone';import {createId} from '@/lib/id';
import {AppHeader} from '@/components/AppHeader';
import type {ContactRole} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
type Candidate={key:string;name:string;phone:string;notes:string;selected:boolean};
export default function ContactImport(){const [items,setItems]=useState<Candidate[]>([]);const [role,setRole]=useState<ContactRole>('tenant');
  const [query,setQuery]=useState('');
  useEffect(()=>{(async()=>{const permission=await ExpoContacts.requestPermissionsAsync();if(permission.status!=='granted'){Alert.alert('الصلاحية مطلوبة','يمكنك إضافة العملاء يدويًا.');return}
    const result=await ExpoContacts.getContactsAsync({fields:[ExpoContacts.Fields.PhoneNumbers,ExpoContacts.Fields.Note],sort:ExpoContacts.SortTypes.FirstName});
    const candidates:Candidate[]=[];for(const c of result.data){for(const number of c.phoneNumbers??[]){const phone=normalizeKuwaitPhone(number.number??'');if(phone&&!await contactsRepository.findByPhone(phone)){
      candidates.push({key:`${c.id}:${phone}`,name:c.name||phone,phone,notes:c.note??'',selected:false});break}}}setItems(candidates)})()},[]);
  const filtered=items.filter(item=>!query.trim()||item.name.toLocaleLowerCase('ar-KW').includes(query.trim().toLocaleLowerCase('ar-KW'))||item.phone.includes(query.trim()));
  const run=async()=>{const now=new Date().toISOString();for(const item of items.filter(x=>x.selected)){await contactsRepository.upsert({id:createId('contact'),name:item.name,phone:item.phone,
    role,notes:item.notes,source:'device',createdAt:now,updatedAt:now})}Alert.alert('تم الاستيراد',`تم استيراد ${items.filter(x=>x.selected).length} شخص.`);router.back()};
  const roleLabels:Record<ContactRole,string>={tenant:'باحث للإيجار',owner:'مالك',broker:'دلال',real_estate_company:'شركة عقارية',building_guard:'حارس'};
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title="استيراد من الهاتف"/><View style={styles.body}><Text style={styles.hint}>لا يوجد أي شخص محدد افتراضيًا. حدّد من تريد فقط.</Text>
    <View style={styles.roles}>{(['tenant','owner','broker','real_estate_company','building_guard'] as ContactRole[])
    .map(value=><Pressable key={value} onPress={()=>setRole(value)} style={[styles.chip,role===value&&styles.active]}><Text style={role===value&&styles.activeText}>{roleLabels[value]}</Text></Pressable>)}</View>
    <TextInput value={query} onChangeText={setQuery} placeholder="ابحث بالاسم أو الرقم" placeholderTextColor={colors.muted} style={styles.search}/>
    <FlatList data={filtered} keyExtractor={x=>x.key} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>لا توجد جهات اتصال مطابقة قابلة للاستيراد</Text>}
      renderItem={({item})=><Pressable onPress={()=>setItems(old=>old.map(x=>x.key===item.key?{...x,selected:!x.selected}:x))}
      style={styles.row}><Text style={styles.check}>{item.selected?'✓':'○'}</Text><View><Text style={styles.name}>{item.name}</Text><Text>{item.phone}</Text>{item.notes?<Text numberOfLines={1}>{item.notes}</Text>:null}</View></Pressable>}/>
    <View style={styles.footer}><PrimaryButton title={`استيراد المحدد (${items.filter(x=>x.selected).length})`} onPress={run} disabled={!items.some(x=>x.selected)}/></View></View></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},body:{flex:1,padding:spacing.md},
  hint:{color:colors.muted,textAlign:'right',marginBottom:spacing.md},search:{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,
    backgroundColor:'white',paddingHorizontal:spacing.md,textAlign:'right',fontSize:16,marginTop:spacing.md},
  roles:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.xs},chip:{padding:8,borderWidth:1,borderColor:colors.border,borderRadius:radius.md},active:{backgroundColor:colors.blue},
  activeText:{color:'white'},list:{gap:spacing.sm,paddingVertical:spacing.md},row:{flexDirection:'row-reverse',gap:spacing.md,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md},
  check:{fontSize:24,color:colors.blue},name:{fontSize:17,fontWeight:'700',textAlign:'right'},footer:{paddingTop:spacing.sm},empty:{textAlign:'center',color:colors.muted,marginTop:40}});
