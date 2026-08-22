import {useCallback,useMemo,useState} from 'react';
import {FlatList,StyleSheet,Text} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {MatchCard} from '@/components/MatchCard';
import {findMatches} from '@/features/matching/engine';
import {contactsRepository,propertiesRepository,requirementsRepository} from '@/lib/database';
import {useI18n} from '@/i18n/I18nContext';
import type {Contact,MatchResult,Property,Requirement} from '@/types/domain';
import {colors,spacing} from '@/theme/tokens';

type Row={match:MatchResult;property:Property;requirement:Requirement;contactName:string};
export default function MatchesScreen(){const {t,language}=useI18n();const [requirements,setRequirements]=useState<Requirement[]>([]);const [properties,setProperties]=useState<Property[]>([]);const [contacts,setContacts]=useState<Contact[]>([]);
  useFocusEffect(useCallback(()=>{void Promise.all([requirementsRepository.listActive(),propertiesRepository.list(),contactsRepository.list()]).then(([needs,homes,people])=>{setRequirements(needs);setProperties(homes);setContacts(people)})},[]));
  const rows=useMemo<Row[]>(()=>findMatches(requirements,properties,language).flatMap(match=>{const property=properties.find(item=>item.id===match.propertyId);const requirement=requirements.find(item=>item.id===match.requirementId);if(!property||!requirement)return[];return[{match,property,requirement,contactName:contacts.find(item=>item.id===requirement.contactId)?.name??t('client')}]}),[contacts,language,properties,requirements,t]);
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('matches')}/><FlatList data={rows} keyExtractor={item=>`${item.match.requirementId}:${item.match.propertyId}`} contentContainerStyle={styles.list}
    ListEmptyComponent={<Text style={styles.empty}>{t('noMatches')}</Text>} renderItem={({item})=><MatchCard {...item} onPressProperty={()=>router.push({pathname:'/property-detail',params:{id:item.property.id,safe:'1'}})} onPressContact={()=>router.push({pathname:'/contact-detail',params:{id:item.requirement.contactId}})}/>}/></SafeAreaView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},list:{padding:spacing.md,gap:spacing.md,flexGrow:1},empty:{textAlign:'center',marginTop:70,color:colors.muted,fontSize:17}});
