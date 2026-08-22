import {StyleSheet,Text,TextInput,View,type TextInputProps} from 'react-native';
import {useI18n} from '@/i18n/I18nContext';
import {colors,radius,spacing} from '@/theme/tokens';
export function FormField({label,...props}:TextInputProps&{label:string}) {const {isRTL}=useI18n();return <View style={styles.wrap}>
  <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{label}</Text>
  <TextInput {...props} placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue}
    style={[styles.input,{textAlign:isRTL?'right':'left'},props.multiline&&styles.multi,props.style]}/>
</View>}
const styles=StyleSheet.create({wrap:{gap:spacing.xs},label:{fontSize:15,fontWeight:'600',color:colors.text},input:{minHeight:48,
  borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,paddingHorizontal:spacing.md,fontSize:16,color:colors.text,backgroundColor:'white'},
  multi:{minHeight:96,textAlignVertical:'top',paddingTop:spacing.md}});
