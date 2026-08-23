import {Pressable,StyleSheet,Text} from 'react-native';
import {colors,radius,spacing} from '@/theme/tokens';
export function PrimaryButton({title,onPress,color=colors.blue,disabled=false}:{title:string;onPress:()=>void;color?:string;disabled?:boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({pressed})=>[styles.button,{backgroundColor:color,opacity:disabled ? 0.5 : pressed ? 0.8 : 1}]}>
    <Text style={styles.text}>{title}</Text></Pressable>;
}
const styles=StyleSheet.create({button:{minHeight:52,borderRadius:radius.md,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.lg,paddingVertical:10},
  text:{color:'white',fontSize:16,lineHeight:22,fontWeight:'700',textAlign:'center',flexShrink:1}});
