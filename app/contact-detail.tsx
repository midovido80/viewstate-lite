import {useCallback,useState,type ReactNode} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {router,useFocusEffect,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/PrimaryButton';
import {contactsRepository,propertiesRepository,requirementsRepository} from '@/lib/database';
import type {Contact,ContactRole,Property,PropertyType,Requirement} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';

const roleLabels:Record<ContactRole,string>={tenant:'باحث للإيجار',owner:'مالك',broker:'دلال',real_estate_company:'شركة عقارية',building_guard:'حارس'};
const typeLabels:Record<PropertyType,string>={apartment:'شقة',villa:'فيلا',floor:'دور',building:'بناية',office:'مكتب',shop:'محل',warehouse:'مخزن',chalet:'شاليه'};

export default function ContactDetail(){const {id}=useLocalSearchParams<{id:string}>();const [contact,setContact]=useState<Contact|null>(null);const [requirements,setRequirements]=useState<Requirement[]>([]);const [offered,setOffered]=useState<Property[]>([]);
  const load=useCallback(()=>{if(!id)return;void Promise.all([contactsRepository.get(id),requirementsRepository.forContact(id),propertiesRepository.forOfferedBy(id)]).then(([person,needs,properties])=>{setContact(person);setRequirements(needs);setOffered(properties)})},[id]);
  useFocusEffect(useCallback(()=>{load()},[load]));if(!contact)return <SafeAreaView style={styles.page}><Text style={styles.loading}>جارٍ التحميل…</Text></SafeAreaView>;
  const requirementSection=<Section title="مطلوب" hint="طلبات هذا الشخص للبحث والمطابقة" action="+ إضافة مطلوب" onAction={()=>router.push({pathname:'/requirement-form',params:{contactId:contact.id}})}>
    {requirements.length?requirements.map(item=><RequirementCard key={item.id} item={item}/>):<Text style={styles.empty}>لا توجد طلبات مسجلة بعد.</Text>}
  </Section>;
  const offeredSection=<Section title="معروض" hint="عقارات وصلت إليك عن طريق هذا الشخص" action="+ إضافة عقار معروض" onAction={()=>router.push({pathname:'/property-form',params:{offeredByContactId:contact.id}})}>
    {offered.length?offered.map(item=><Pressable key={item.id} onPress={()=>router.push({pathname:'/property-detail',params:{id:item.id}})} style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.meta}>📍 {item.area}  •  {item.monthlyRent} د.ك</Text></Pressable>):<Text style={styles.empty}>لا توجد عقارات معروضة مسجلة بعد.</Text>}
  </Section>;
  const requestedFirst=contact.role==='tenant';
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title="تفاصيل الشخص"/><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.person}><Text style={styles.name}>{contact.name}</Text><Text style={styles.phone}>{contact.phone}</Text><Text style={styles.badge}>{roleLabels[contact.role]}</Text>
      {contact.notes?<Text style={styles.notes}>{contact.notes}</Text>:null}<PrimaryButton title="تعديل بيانات الشخص" onPress={()=>router.push({pathname:'/contact-form',params:{id:contact.id}})}/></View>
    {requestedFirst?requirementSection:offeredSection}{requestedFirst?offeredSection:requirementSection}
  </ScrollView></SafeAreaView>;
}

function RequirementCard({item}:{item:Requirement}){const rent=item.minRent!==null&&item.maxRent!==null?`${item.minRent}–${item.maxRent} د.ك`:'ميزانية مرنة';
  return <View style={styles.card}><Text style={styles.cardTitle}>{item.propertyTypes.map(type=>typeLabels[type]).join('، ')||'أي عقار'}</Text><Text style={styles.meta}>📍 {item.areas.join('، ')||'أي منطقة'}</Text><Text style={styles.meta}>💰 {rent}{item.minBedrooms!==null?`  •  🛏️ ${item.minBedrooms}`:''}{item.minBathrooms!==null?`  •  🚿 ${item.minBathrooms}`:''}</Text>
    {item.notes?<Text style={styles.requirementNotes}>{item.notes}</Text>:null}<View style={styles.inlineActions}><Pressable onPress={()=>router.push({pathname:'/requirement-form',params:{id:item.id}})} style={styles.smallButton}><Text style={styles.smallText}>تعديل</Text></Pressable><Pressable onPress={()=>router.push({pathname:'/match-results',params:{requirementId:item.id}})} style={[styles.smallButton,styles.matchButton]}><Text style={[styles.smallText,styles.matchText]}>مطابقة الآن</Text></Pressable></View></View>;
}

function Section({title,hint,action,onAction,children}:{title:string;hint:string;action:string;onAction:()=>void;children:ReactNode}){return <View style={styles.section}><View style={styles.sectionHeader}><Pressable onPress={onAction}><Text style={styles.add}>{action}</Text></Pressable><View><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.hint}>{hint}</Text></View></View>{children}</View>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},loading:{textAlign:'center',marginTop:80,color:colors.muted},content:{padding:spacing.md,gap:spacing.lg,paddingBottom:spacing.xl},person:{gap:spacing.sm,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:'white'},name:{fontSize:25,fontWeight:'800',textAlign:'right',color:colors.text},phone:{fontSize:18,textAlign:'right',color:colors.blue},badge:{alignSelf:'flex-end',color:colors.red,fontWeight:'800',backgroundColor:'#FFF1F1',paddingHorizontal:10,paddingVertical:5,borderRadius:radius.md},notes:{textAlign:'right',color:colors.text,lineHeight:22,backgroundColor:colors.surface,padding:spacing.sm,borderRadius:radius.sm},section:{gap:spacing.sm},sectionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',gap:spacing.md},sectionTitle:{fontSize:23,fontWeight:'900',color:colors.red,textAlign:'right'},hint:{fontSize:13,color:colors.muted,textAlign:'right',marginTop:3},add:{color:colors.blue,fontWeight:'800'},card:{gap:6,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:'white'},cardTitle:{fontSize:17,fontWeight:'800',color:colors.text,textAlign:'right'},meta:{color:colors.muted,textAlign:'right',lineHeight:22},requirementNotes:{textAlign:'right',color:colors.text,backgroundColor:colors.surface,padding:spacing.sm,borderRadius:radius.sm},inlineActions:{flexDirection:'row',gap:spacing.sm,marginTop:spacing.xs},smallButton:{flex:1,minHeight:42,borderRadius:radius.sm,borderWidth:1,borderColor:colors.blue,alignItems:'center',justifyContent:'center'},matchButton:{backgroundColor:colors.blue},smallText:{color:colors.blue,fontWeight:'800'},matchText:{color:'white'},empty:{textAlign:'right',color:colors.muted,borderWidth:1,borderColor:colors.border,borderStyle:'dashed',borderRadius:radius.md,padding:spacing.md}});
