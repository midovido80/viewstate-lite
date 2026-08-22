import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {useI18n} from '@/i18n/I18nContext';
import {colors,spacing,radius} from '@/theme/tokens';

export function AppHeader({title,query,onQueryChange}:{title:string;query?:string;onQueryChange?:(v:string)=>void}) {
  const {isRTL,t}=useI18n();
  return <View style={styles.header}>
    <Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{title}</Text>
    {onQueryChange ? <View style={[styles.search,{flexDirection:isRTL?'row-reverse':'row'}]}>
      <Ionicons name="search" size={20} color={colors.blue}/>
      <TextInput value={query} onChangeText={onQueryChange} placeholder={t('search')}
        autoFocus returnKeyType="search" placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue} style={[styles.input,{textAlign:isRTL?'right':'left'}]}/>
    </View> : <Pressable accessibilityRole="button" onPress={()=>router.push('/global-search')}
      style={[styles.search,{flexDirection:isRTL?'row-reverse':'row'}]}>
      <Ionicons name="search" size={20} color={colors.blue}/>
      <Text style={[styles.searchPrompt,{textAlign:isRTL?'right':'left'}]}>{t('search')}</Text>
    </Pressable>}
  </View>;
}
const styles=StyleSheet.create({header:{backgroundColor:colors.blue,padding:spacing.md,paddingTop:spacing.lg,gap:spacing.md},
  title:{color:'white',fontSize:24,fontWeight:'700'},search:{backgroundColor:'white',borderRadius:radius.md,
    minHeight:48,alignItems:'center',paddingHorizontal:spacing.md,gap:spacing.sm},input:{flex:1,fontSize:16,color:colors.text},
  searchPrompt:{flex:1,fontSize:16,color:colors.muted}});
