import {useCallback,useState} from 'react';
import {router,useFocusEffect} from 'expo-router';
import {FlatList,Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/PrimaryButton';
import {contactsRepository} from '@/lib/database';
import {useI18n} from '@/i18n/I18nContext';
import type {Contact,ContactRole} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
const labels:Record<ContactRole,string>={tenant:'باحث للإيجار',owner:'مالك',broker:'دلال',real_estate_company:'شركة عقارية',building_guard:'حارس'};
export default function ContactsScreen(){const {t,isRTL}=useI18n();const [items,setItems]=useState<Contact[]>([]);
  const load=useCallback(()=>{contactsRepository.list().then(setItems)},[]);useFocusEffect(useCallback(()=>{load()},[load]));
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('contacts')}/>
    <View style={styles.actions}><PrimaryButton title={t('addContact')} onPress={()=>router.push('/contact-add')}/>
      <PrimaryButton title={t('importContacts')} onPress={()=>router.push('/contact-import')}/></View>
    <FlatList data={items} keyExtractor={x=>x.id} contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>{t('noContacts')}</Text>}
      renderItem={({item})=><Pressable onPress={()=>router.push({pathname:'/contact-detail',params:{id:item.id}})} style={styles.card}>
        <View style={{flex:1}}><Text style={[styles.name,{textAlign:isRTL?'right':'left'}]}>{item.name}</Text>
          <Text style={[styles.phone,{textAlign:isRTL?'right':'left'}]}>{item.phone}</Text></View>
        <Text style={styles.badge}>{labels[item.role]}</Text></Pressable>}/>
  </SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},actions:{padding:spacing.md,gap:spacing.sm},list:{padding:spacing.md,gap:spacing.sm,
  flexGrow:1},card:{minHeight:76,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,flexDirection:'row',alignItems:'center',gap:spacing.md},
  name:{fontSize:18,fontWeight:'700',color:colors.text},phone:{fontSize:15,color:colors.muted,marginTop:4},badge:{color:colors.red,fontWeight:'700'},
  empty:{textAlign:'center',color:colors.muted,marginTop:60,fontSize:17}});
