import {Pressable,StyleSheet,Text,View} from 'react-native';
import {colors,radius,spacing} from '@/theme/tokens';
import {useI18n} from '@/i18n/I18nContext';

const VALUES=Array.from({length:10},(_,index)=>index+1);

export function NumberPicker({label,value,onChange}:{label:string;value:number|null;onChange:(value:number)=>void}) {
  const {isRTL}=useI18n();
  return <View style={styles.wrap}>
    <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{label}</Text>
    <View style={[styles.values,{flexDirection:isRTL?'row-reverse':'row'}]}>{VALUES.map(item=><Pressable key={item} onPress={()=>onChange(item)}
      style={[styles.chip,value===item&&styles.active]}><Text style={[styles.text,value===item&&styles.activeText]}>{item}</Text></Pressable>)}</View>
  </View>;
}

const styles=StyleSheet.create({wrap:{gap:spacing.xs},label:{fontSize:15,fontWeight:'600',color:colors.text,textAlign:'right'},
  values:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.xs},chip:{width:45,minHeight:42,borderWidth:1,borderColor:colors.border,
    borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:'white'},active:{backgroundColor:colors.blue,borderColor:colors.blue},
  text:{fontSize:16,color:colors.text,fontWeight:'600'},activeText:{color:'white'}});
