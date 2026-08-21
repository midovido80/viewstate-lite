import {useCallback,useState} from 'react';import {router,useFocusEffect} from 'expo-router';import {FlatList,Pressable,StyleSheet,Text,View} from 'react-native';import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';import {contactsRepository,propertiesRepository,requirementsRepository} from '@/lib/database';import {findMatches} from '@/features/matching/engine';
import {useI18n} from '@/i18n/I18nContext';import type {MatchResult,Property,Requirement} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
type Row={match:MatchResult;property:Property;requirement:Requirement;contactName:string};
export default function MatchesScreen(){const {t}=useI18n();const [rows,setRows]=useState<Row[]>([]);useFocusEffect(useCallback(()=>{
  void (async()=>{
    const [requirements,properties,contacts]=await Promise.all([
      requirementsRepository.listActive(),propertiesRepository.list(),contactsRepository.list()
    ]);
    const matches=findMatches(requirements,properties);
    setRows(matches.flatMap(match=>{
      const property=properties.find(x=>x.id===match.propertyId);
      const requirement=requirements.find(x=>x.id===match.requirementId);
      if(!property||!requirement)return [];
      return [{match,property,requirement,contactName:contacts.find(x=>x.id===requirement.contactId)?.name??'عميل'}];
    }));
  })();
},[]));
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('matches')}/><FlatList data={rows} keyExtractor={x=>`${x.match.requirementId}:${x.match.propertyId}`} contentContainerStyle={styles.list}
    ListEmptyComponent={<Text style={styles.empty}>{t('noMatches')}</Text>} renderItem={({item})=><Pressable onPress={()=>router.push({pathname:'/property-detail',params:{id:item.property.id}})} style={styles.card}>
      <View style={{flex:1}}><Text style={styles.title}>{item.contactName} ← {item.property.title}</Text><Text style={styles.reasons}>تطابق: {item.match.reasons.join('، ')}</Text></View>
      <Text style={styles.score}>{item.match.score}%</Text></Pressable>}/></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},list:{padding:spacing.md,gap:spacing.sm,flexGrow:1},card:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,flexDirection:'row-reverse',alignItems:'center',gap:spacing.md},
  title:{fontSize:17,fontWeight:'700',textAlign:'right',color:colors.text},reasons:{color:colors.muted,textAlign:'right',marginTop:6},score:{fontSize:22,fontWeight:'800',color:colors.red},empty:{textAlign:'center',marginTop:70,color:colors.muted,fontSize:17}});
