import {useEffect,useState} from 'react';
import {router} from 'expo-router';
import {FlatList,Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {globalSearchRepository,type GlobalSearchResults} from '@/lib/database';
import type {ContactRole} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
import {getRoleLabel,useI18n} from '@/i18n/I18nContext';

type SearchRow=
  | {kind:'heading';id:string;label:string}
  | {kind:'contact';id:string;name:string;phone:string;role:ContactRole}
  | {kind:'property';id:string;title:string;area:string;blockNumber:number|null;rent:number};
export default function GlobalSearch(){const {t,language,isRTL}=useI18n();const [query,setQuery]=useState('');const [results,setResults]=useState<GlobalSearchResults>({contacts:[],properties:[]});
  useEffect(()=>{let active=true;const timer=setTimeout(()=>{globalSearchRepository.search(query).then(value=>{if(active)setResults(value)})},120);
    return()=>{active=false;clearTimeout(timer)}},[query]);
  const rows:SearchRow[]=[];
  if(results.contacts.length){rows.push({kind:'heading',id:'contacts',label:t('peopleCount',{count:results.contacts.length})});rows.push(...results.contacts.map(item=>({kind:'contact' as const,id:item.id,name:item.name,phone:item.phone,role:item.role})))}
  if(results.properties.length){rows.push({kind:'heading',id:'properties',label:t('propertiesCount',{count:results.properties.length})});rows.push(...results.properties.map(item=>({kind:'property' as const,id:item.id,title:item.title,area:item.area,blockNumber:item.blockNumber,rent:item.monthlyRent})))}
  const empty=query.trim()?t('noSearchResults'):t('searchHelp');
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('globalSearch')} query={query} onQueryChange={setQuery}/>
    <FlatList data={rows} keyExtractor={item=>`${item.kind}:${item.id}`} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>{empty}</Text>}
      renderItem={({item})=>item.kind==='heading'?<Text style={styles.heading}>{item.label}</Text>:item.kind==='contact'?
        <Pressable onPress={()=>router.push({pathname:'/contact-detail',params:{id:item.id}})} style={[styles.card,{flexDirection:isRTL?'row-reverse':'row'}]}>
          <View style={styles.copy}><Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{item.name}</Text><Text style={[styles.sub,{textAlign:isRTL?'right':'left'}]}>{item.phone}</Text></View><Text style={styles.badge}>{getRoleLabel(language,item.role)}</Text>
        </Pressable>:
        <Pressable onPress={()=>router.push({pathname:'/property-detail',params:{id:item.id}})} style={[styles.card,{flexDirection:isRTL?'row-reverse':'row'}]}>
          <View style={styles.copy}><Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{item.title}</Text><Text style={[styles.sub,{textAlign:isRTL?'right':'left'}]}>📍 {item.area}{item.blockNumber!==null?` · ${t('blockNumberValue',{value:item.blockNumber})}`:''}</Text></View><Text style={styles.rent}>{t('kwd',{value:item.rent})}</Text>
        </Pressable>}/>
  </SafeAreaView>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},list:{padding:spacing.md,gap:spacing.sm,flexGrow:1},
  heading:{fontSize:18,fontWeight:'800',color:colors.red,textAlign:'right',paddingTop:spacing.sm},empty:{textAlign:'center',color:colors.muted,
    marginTop:70,fontSize:16,lineHeight:25,paddingHorizontal:spacing.xl},card:{minHeight:76,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,
    backgroundColor:'white',padding:spacing.md,flexDirection:'row-reverse',alignItems:'center',gap:spacing.md},copy:{flex:1},title:{fontSize:17,
    fontWeight:'800',color:colors.text,textAlign:'right'},sub:{fontSize:14,color:colors.muted,textAlign:'right',marginTop:5},badge:{color:colors.red,fontWeight:'700'},
  rent:{color:colors.blue,fontSize:16,fontWeight:'800'}});
