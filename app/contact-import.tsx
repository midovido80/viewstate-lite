import {useEffect,useState} from 'react';import * as ExpoContacts from 'expo-contacts';
import {Alert,FlatList,Pressable,StyleSheet,Text,View} from 'react-native';import {router} from 'expo-router';import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '@/components/PrimaryButton';import {contactsRepository} from '@/lib/database';import {normalizeKuwaitPhone} from '@/lib/phone';import {createId} from '@/lib/id';
import type {ContactRole} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
type Candidate={key:string;name:string;phone:string;notes:string;selected:boolean};
export default function ContactImport(){const [items,setItems]=useState<Candidate[]>([]);const [role,setRole]=useState<ContactRole>('tenant');
  useEffect(()=>{(async()=>{const permission=await ExpoContacts.requestPermissionsAsync();if(permission.status!=='granted'){Alert.alert('الصلاحية مطلوبة','يمكنك إضافة العملاء يدويًا.');return}
    const result=await ExpoContacts.getContactsAsync({fields:[ExpoContacts.Fields.PhoneNumbers,ExpoContacts.Fields.Note],sort:ExpoContacts.SortTypes.FirstName});
    const candidates:Candidate[]=[];for(const c of result.data){for(const number of c.phoneNumbers??[]){const phone=normalizeKuwaitPhone(number.number??'');if(phone&&!await contactsRepository.findByPhone(phone)){
      candidates.push({key:`${c.id}:${phone}`,name:c.name||phone,phone,notes:c.note??'',selected:true});break}}}setItems(candidates)})()},[]);
  const run=async()=>{const now=new Date().toISOString();for(const item of items.filter(x=>x.selected)){await contactsRepository.upsert({id:createId('contact'),name:item.name,phone:item.phone,
    role,notes:item.notes,source:'device',createdAt:now,updatedAt:now})}Alert.alert('تم الاستيراد',`تم استيراد ${items.filter(x=>x.selected).length} شخص.`);router.back()};
  return <SafeAreaView style={styles.page}><Text style={styles.heading}>استيراد العملاء</Text><View style={styles.roles}>{(['tenant','owner','broker','real_estate_company','building_guard'] as ContactRole[])
    .map(value=><Pressable key={value} onPress={()=>setRole(value)} style={[styles.chip,role===value&&styles.active]}><Text style={role===value&&styles.activeText}>{value}</Text></Pressable>)}</View>
    <FlatList data={items} keyExtractor={x=>x.key} contentContainerStyle={styles.list} renderItem={({item,index})=><Pressable onPress={()=>setItems(old=>old.map((x,i)=>i===index?{...x,selected:!x.selected}:x))}
      style={styles.row}><Text style={styles.check}>{item.selected?'✓':'○'}</Text><View><Text style={styles.name}>{item.name}</Text><Text>{item.phone}</Text>{item.notes?<Text numberOfLines={1}>{item.notes}</Text>:null}</View></Pressable>}/>
    <View style={styles.footer}><PrimaryButton title={`استيراد المحدد (${items.filter(x=>x.selected).length})`} onPress={run} disabled={!items.some(x=>x.selected)}/></View></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background,padding:spacing.md},heading:{fontSize:24,color:colors.red,fontWeight:'700',textAlign:'right',marginBottom:spacing.md},
  roles:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.xs},chip:{padding:8,borderWidth:1,borderColor:colors.border,borderRadius:radius.md},active:{backgroundColor:colors.blue},
  activeText:{color:'white'},list:{gap:spacing.sm,paddingVertical:spacing.md},row:{flexDirection:'row-reverse',gap:spacing.md,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md},
  check:{fontSize:24,color:colors.blue},name:{fontSize:17,fontWeight:'700',textAlign:'right'},footer:{paddingTop:spacing.sm}});

