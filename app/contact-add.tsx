import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {useI18n} from '@/i18n/I18nContext';
import {colors,radius,spacing} from '@/theme/tokens';

export default function ContactAddMethod(){const {t,isRTL}=useI18n();return <SafeAreaView style={styles.page} edges={['top']}>
  <AppHeader title={t('addContact')}/>
  <View style={styles.content}>
    <Text style={[styles.question,{textAlign:isRTL?'right':'left'}]}>{t('addPersonQuestion')}</Text>
    <Text style={[styles.helper,{textAlign:isRTL?'right':'left'}]}>{t('fastestMethod')}</Text>
    <Pressable onPress={()=>router.push('/contact-form')} style={[styles.card,{flexDirection:isRTL?'row-reverse':'row'}]}>
      <Ionicons name="create-outline" size={36} color={colors.blue}/>
      <View style={styles.copy}><Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{t('manualAdd')}</Text><Text style={[styles.description,{textAlign:isRTL?'right':'left'}]}>{t('manualAddHint')}</Text></View>
      <Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={24} color={colors.muted}/>
    </Pressable>
    <Pressable onPress={()=>router.push('/contact-import')} style={[styles.card,{flexDirection:isRTL?'row-reverse':'row'}]}>
      <Ionicons name="phone-portrait-outline" size={36} color={colors.green}/>
      <View style={styles.copy}><Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{t('importContacts')}</Text><Text style={[styles.description,{textAlign:isRTL?'right':'left'}]}>{t('importHint')}</Text></View>
      <Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={24} color={colors.muted}/>
    </Pressable>
  </View>
</SafeAreaView>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md},
  question:{fontSize:23,fontWeight:'800',color:colors.red,textAlign:'right',marginTop:spacing.sm},helper:{fontSize:15,color:colors.muted,textAlign:'right'},
  card:{minHeight:102,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:'white',padding:spacing.md,
    flexDirection:'row-reverse',alignItems:'center',gap:spacing.md},copy:{flex:1},title:{fontSize:18,fontWeight:'800',color:colors.text,textAlign:'right'},
  description:{fontSize:14,color:colors.muted,textAlign:'right',marginTop:5}});
