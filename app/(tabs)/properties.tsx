import {useCallback,useState} from 'react';import {router,useFocusEffect} from 'expo-router';
import {FlatList,Pressable,StyleSheet,Text,View} from 'react-native';import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';import {PrimaryButton} from '@/components/PrimaryButton';import {propertiesRepository} from '@/lib/database';
import {useI18n} from '@/i18n/I18nContext';import type {Property} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
export default function PropertiesScreen(){const {t,isRTL}=useI18n();const [items,setItems]=useState<Property[]>([]);const [query,setQuery]=useState('');
  const load=useCallback(()=>{propertiesRepository.list(query).then(setItems)},[query]);useFocusEffect(useCallback(()=>{load()},[load]));
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('properties')} query={query} onQueryChange={setQuery}/><View style={styles.action}>
    <PrimaryButton title={t('addProperty')} onPress={()=>router.push('/property-form')}/></View><FlatList data={items} keyExtractor={x=>x.id} contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>{t('noProperties')}</Text>} renderItem={({item})=><Pressable onPress={()=>router.push({pathname:'/property-detail',params:{id:item.id}})} style={styles.card}>
        <View style={{flex:1}}><Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{item.title}</Text><Text style={[styles.area,{textAlign:isRTL?'right':'left'}]}>📍 {item.area}</Text></View>
        <View><Text style={styles.price}>{item.monthlyRent} د.ك</Text><Text style={styles.status}>{t(item.status)}</Text></View></Pressable>}/></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},action:{padding:spacing.md},list:{padding:spacing.md,gap:spacing.sm,flexGrow:1},card:{borderWidth:1,
  borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,flexDirection:'row-reverse',alignItems:'center',gap:spacing.md},title:{fontSize:18,fontWeight:'700',color:colors.red},
  area:{color:colors.muted,marginTop:6},price:{fontSize:17,fontWeight:'700',color:colors.blue},status:{textAlign:'center',color:colors.green,fontWeight:'700',marginTop:5},
  empty:{textAlign:'center',color:colors.muted,marginTop:60,fontSize:17}});

