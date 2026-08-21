import {useEffect,useState} from 'react';import {Alert,Image,ScrollView,Share,StyleSheet,Text,View} from 'react-native';import {router,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';import {PrimaryButton} from '@/components/PrimaryButton';import {propertiesRepository} from '@/lib/database';import {createPropertyMessage} from '@/features/sharing/propertyMessage';
import type {Property,PropertyMedia} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
export default function PropertyDetail(){const {id}=useLocalSearchParams<{id:string}>();const [property,setProperty]=useState<Property|null>(null);const [media,setMedia]=useState<PropertyMedia[]>([]);
  useEffect(()=>{if(id){propertiesRepository.get(id).then(setProperty);propertiesRepository.media(id).then(setMedia)}},[id]);if(!property)return <SafeAreaView><Text>جارٍ التحميل...</Text></SafeAreaView>;
  const share=async()=>{try{await Share.share({title:property.title,message:createPropertyMessage(property)})}catch{Alert.alert('تعذرت المشاركة','انسخ البيانات وحاول مرة أخرى.')}};
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>{property.title}</Text><Text style={styles.price}>{property.monthlyRent} د.ك شهريًا</Text>
    <Text style={styles.line}>📍 {property.area}</Text>{property.bedrooms!==null&&<Text style={styles.line}>🛏️ {property.bedrooms} غرف</Text>}{property.bathrooms!==null&&<Text style={styles.line}>🚿 {property.bathrooms} حمام</Text>}
    {property.description?<Text style={styles.description}>{property.description}</Text>:null}<ScrollView horizontal contentContainerStyle={styles.media}>{media.filter(x=>x.kind==='image').map(x=><Image key={x.id} source={{uri:x.uri}} style={styles.image}/>)}</ScrollView>
    <PrimaryButton title="مشاركة إلى WhatsApp Business أو WhatsApp" onPress={share} color={colors.green}/><PrimaryButton title="تعديل العقار" onPress={()=>router.push({pathname:'/property-form',params:{id:property.id}})}/>
    {property.privateNotes?<View style={styles.private}><Text style={styles.privateTitle}>ملاحظات خاصة — لا تُشارك</Text><Text>{property.privateNotes}</Text></View>:null}</ScrollView></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md},title:{fontSize:26,fontWeight:'700',color:colors.red,textAlign:'right'},price:{fontSize:22,fontWeight:'700',color:colors.blue,textAlign:'right'},
  line:{fontSize:17,textAlign:'right'},description:{fontSize:16,lineHeight:25,textAlign:'right'},media:{gap:spacing.sm},image:{width:230,height:160,borderRadius:radius.md},private:{backgroundColor:colors.surface,padding:spacing.md,borderRadius:radius.md},
  privateTitle:{color:colors.red,fontWeight:'700',textAlign:'right',marginBottom:spacing.sm}});

