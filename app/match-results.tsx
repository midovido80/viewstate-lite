import {useCallback,useMemo,useState} from 'react';
import {FlatList,StyleSheet,Text} from 'react-native';
import {router,useFocusEffect,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {MatchCard} from '@/components/MatchCard';
import {findMatches,MINIMUM_MATCH_SCORE} from '@/features/matching/engine';
import {contactsRepository,propertiesRepository,requirementsRepository} from '@/lib/database';
import type {Contact,MatchResult,Property,Requirement} from '@/types/domain';
import {colors,spacing} from '@/theme/tokens';
import {useI18n} from '@/i18n/I18nContext';

type Row={match:MatchResult;property:Property;requirement:Requirement;contactName:string};
export default function MatchResults(){const {requirementId,propertyId}=useLocalSearchParams<{requirementId?:string;propertyId?:string}>();const {t,isRTL,language}=useI18n();const [requirements,setRequirements]=useState<Requirement[]>([]);const [properties,setProperties]=useState<Property[]>([]);const [contacts,setContacts]=useState<Contact[]>([]);
  useFocusEffect(useCallback(()=>{void Promise.all([requirementsRepository.listActive(),propertiesRepository.list(),contactsRepository.list()]).then(([needs,homes,people])=>{setRequirements(needs);setProperties(homes);setContacts(people)})},[]));
  const rows=useMemo<Row[]>(()=>findMatches(requirements,properties,language).filter(match=>(!requirementId||match.requirementId===requirementId)&&(!propertyId||match.propertyId===propertyId)).flatMap(match=>{const property=properties.find(item=>item.id===match.propertyId);const requirement=requirements.find(item=>item.id===match.requirementId);if(!property||!requirement)return[];return[{match,property,requirement,contactName:contacts.find(item=>item.id===requirement.contactId)?.name??t('client')}]}),[contacts,language,properties,propertyId,requirementId,requirements,t]);
  const title=requirementId?t('matchingProperties'):propertyId?t('matchingPeople'):t('matches');
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={title}/><FlatList data={rows} keyExtractor={item=>`${item.match.requirementId}:${item.match.propertyId}`} contentContainerStyle={styles.list}
    ListHeaderComponent={<Text style={[styles.help,{textAlign:isRTL?'right':'left'}]}>{t('qualifyingResults',{score:MINIMUM_MATCH_SCORE})}</Text>}
    ListEmptyComponent={<Text style={styles.empty}>{t('noQualifyingResult')}</Text>}
    renderItem={({item})=><MatchCard {...item} onPressProperty={()=>router.push({pathname:'/property-detail',params:{id:item.property.id,safe:'1'}})} onPressContact={()=>router.push({pathname:'/contact-detail',params:{id:item.requirement.contactId}})}/>}/></SafeAreaView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},list:{padding:spacing.md,gap:spacing.md,flexGrow:1},help:{textAlign:'right',color:colors.muted,backgroundColor:colors.surface,padding:spacing.md,lineHeight:22},empty:{textAlign:'center',marginTop:70,color:colors.muted,fontSize:16,lineHeight:25}});
