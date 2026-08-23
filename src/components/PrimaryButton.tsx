import {Pressable,StyleSheet,Text} from 'react-native';
import {colors,radius,spacing} from '@/theme/tokens';
export function PrimaryButton({title,onPress,color=colors.blue,disabled=false,testID}:{title:string;onPress:()=>void;color?:string;disabled?:boolean;testID?:string}) {
  return <Pressable testID={testID} accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({pressed})=>[styles.button,{backgroundColor:color,opacity:disabled ? 0.5 : pressed ? 0.8 : 1}]}>
    <Text style={styles.text}>{title}</Text></Pressable>;
}
const styles=StyleSheet.create({button:{minHeight:48,borderRadius:radius.md,alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.lg},
  text:{color:'white',fontSize:16,fontWeight:'700'}});
