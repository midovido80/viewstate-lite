import {useState} from 'react';import {Alert,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';import {router,useLocalSearchParams} from 'expo-router';import {SafeAreaView} from 'react-native-safe-area-context';
import {FormField} from '@/components/FormField';import {PrimaryButton} from '@/components/PrimaryButton';import {requirementsRepository} from '@/lib/database';import {createId} from '@/lib/id';
import {AppHeader} from '@/components/AppHeader';
import type {Furnishing,PropertyType} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
const types:Array<[PropertyType,string]>=[['apartment','شقة'],['villa','فيلا'],['floor','دور'],['building','بناية'],['office','مكتب'],['shop','محل'],['warehouse','مخزن'],['chalet','شاليه']];
export default function RequirementForm(){const {contactId}=useLocalSearchParams<{contactId:string}>();const [areas,setAreas]=useState('');const [selected,setSelected]=useState<PropertyType[]>([]);
  const [minRent,setMinRent]=useState('');const [maxRent,setMaxRent]=useState('');const [bedrooms,setBedrooms]=useState('');const [furnishing,setFurnishing]=useState<Furnishing>('any');const [notes,setNotes]=useState('');
  const save=async()=>{if(!contactId)return;if(!areas.trim()&&!selected.length&&!maxRent){Alert.alert('أضف معيارًا واحدًا على الأقل');return}const now=new Date().toISOString();
    await requirementsRepository.upsert({id:createId('requirement'),contactId,areas:areas.split(',').map(x=>x.trim()).filter(Boolean),propertyTypes:selected,minRent:minRent?Number(minRent):null,maxRent:maxRent?Number(maxRent):null,
      minBedrooms:bedrooms?Number(bedrooms):null,furnishing,notes:notes.trim(),active:true,createdAt:now,updatedAt:now});router.back()};
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title="متطلبات الباحث"/><ScrollView contentContainerStyle={styles.content}><FormField label="المناطق — افصل بفاصلة" value={areas} onChangeText={setAreas}/>
    <Text style={styles.label}>أنواع العقارات</Text><View style={styles.chips}>{types.map(([value,label])=><Pressable key={value} onPress={()=>setSelected(old=>old.includes(value)?old.filter(x=>x!==value):[...old,value])}
      style={[styles.chip,selected.includes(value)&&styles.active]}><Text style={selected.includes(value)&&styles.activeText}>{label}</Text></Pressable>)}</View>
    <FormField label="أقل إيجار" value={minRent} keyboardType="numeric" onChangeText={setMinRent}/><FormField label="أعلى إيجار" value={maxRent} keyboardType="numeric" onChangeText={setMaxRent}/>
    <FormField label="أقل عدد غرف" value={bedrooms} keyboardType="numeric" onChangeText={setBedrooms}/><FormField label="شروط إضافية" value={notes} multiline onChangeText={setNotes}/>
    <PrimaryButton title="حفظ المتطلبات" onPress={save}/></ScrollView></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md},label:{fontWeight:'600',textAlign:'right'},
  chips:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.sm},chip:{borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,paddingHorizontal:spacing.md,paddingVertical:10},active:{backgroundColor:colors.blue},activeText:{color:'white'}});
