import {router} from 'expo-router';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {useI18n} from '@/i18n/I18nContext';
import {colors,radius,spacing} from '@/theme/tokens';
export default function Home(){const {t,isRTL}=useI18n();return <SafeAreaView style={styles.page} edges={['top']}>
  <AppHeader title="ViewState Lite"/>
  <View style={styles.content}><Text style={[styles.welcome,{textAlign:isRTL?'right':'left'}]}>نظّم عميلك، طابق طلبه، وشارك العقار بسرعة.</Text>
    <View style={[styles.grid,{flexDirection:isRTL?'row-reverse':'row'}]}>
      <Card title={t('addContact')} onPress={()=>router.push('/contact-add')}/>
      <Card title={t('addProperty')} onPress={()=>router.push('/property-form')}/>
      <Card title={t('importContacts')} onPress={()=>router.push('/contact-import')}/>
      <Card title={t('matches')} onPress={()=>router.push('/(tabs)/matches')}/>
    </View>
  </View></SafeAreaView>}
function Card({title,onPress}:{title:string;onPress:()=>void}){return <Pressable onPress={onPress} style={styles.card}><Text style={styles.cardText}>{title}</Text></Pressable>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.lg},welcome:{fontSize:20,
  color:colors.red,fontWeight:'700'},grid:{flexWrap:'wrap',gap:spacing.md},card:{width:'47%',minHeight:120,backgroundColor:colors.surface,
  borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,justifyContent:'center'},cardText:{fontSize:17,fontWeight:'700',
  color:colors.blue,textAlign:'center'}});
