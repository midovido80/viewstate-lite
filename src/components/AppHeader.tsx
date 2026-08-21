import {Ionicons} from '@expo/vector-icons';
import {StyleSheet,Text,TextInput,View} from 'react-native';
import {useI18n} from '@/i18n/I18nContext';
import {colors,spacing,radius} from '@/theme/tokens';

export function AppHeader({title,query,onQueryChange}:{title:string;query?:string;onQueryChange?:(v:string)=>void}) {
  const {isRTL,t}=useI18n();
  return <View style={styles.header}>
    <Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{title}</Text>
    {onQueryChange && <View style={[styles.search,{flexDirection:isRTL?'row-reverse':'row'}]}>
      <Ionicons name="search" size={20} color={colors.muted}/>
      <TextInput value={query} onChangeText={onQueryChange} placeholder={t('search')}
        placeholderTextColor={colors.muted} style={[styles.input,{textAlign:isRTL?'right':'left'}]}/>
    </View>}
  </View>;
}
const styles=StyleSheet.create({header:{backgroundColor:colors.blue,padding:spacing.md,paddingTop:spacing.lg,gap:spacing.md},
  title:{color:'white',fontSize:24,fontWeight:'700'},search:{backgroundColor:'white',borderRadius:radius.md,
    minHeight:48,alignItems:'center',paddingHorizontal:spacing.md,gap:spacing.sm},input:{flex:1,fontSize:16,color:colors.text}});

