import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from 'react-native';
import {colors,radius,spacing} from '@/theme/tokens';
import {useI18n} from '@/i18n/I18nContext';

export interface ChoiceOption<T extends string> {value:T;label:string}

export function ChoicePicker<T extends string>({label,value,placeholder,options,onChange}:{
  label:string;value:T|null;placeholder:string;options:readonly ChoiceOption<T>[];onChange:(value:T)=>void;
}) {
  const {isRTL}=useI18n();
  const [open,setOpen]=useState(false);
  const selected=options.find(option=>option.value===value);
  return <View style={styles.wrap}>
    <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{label}</Text>
    <Pressable onPress={()=>setOpen(true)} style={[styles.selector,{flexDirection:isRTL?'row':'row-reverse'}]}>
      <Ionicons name="chevron-down" size={20} color={colors.blue}/>
      <Text style={[styles.value,{textAlign:isRTL?'right':'left'},!selected&&styles.placeholder]}>{selected?.label??placeholder}</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
      <Pressable style={styles.backdrop} onPress={()=>setOpen(false)}>
        <SafeAreaView style={styles.sheet}>
          <Text style={styles.title}>{label}</Text>
          <ScrollView>{options.map(option=><Pressable key={option.value} onPress={()=>{onChange(option.value);setOpen(false)}} style={styles.row}>
            <Ionicons name={option.value===value?'checkmark-circle':'ellipse-outline'} size={23} color={option.value===value?colors.blue:colors.border}/>
            <Text style={styles.rowText}>{option.label}</Text>
          </Pressable>)}</ScrollView>
        </SafeAreaView>
      </Pressable>
    </Modal>
  </View>;
}

const styles=StyleSheet.create({wrap:{gap:spacing.xs},label:{fontSize:15,fontWeight:'600',color:colors.text,textAlign:'right'},
  selector:{minHeight:50,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,backgroundColor:'white',
    paddingHorizontal:spacing.md,flexDirection:'row',alignItems:'center',gap:spacing.sm},value:{flex:1,fontSize:16,color:colors.text,textAlign:'right'},
  placeholder:{color:colors.muted},backdrop:{flex:1,backgroundColor:'rgba(8,25,45,.45)',justifyContent:'flex-end'},
  sheet:{backgroundColor:'white',padding:spacing.md,borderTopLeftRadius:radius.lg,borderTopRightRadius:radius.lg,maxHeight:'85%'},
  title:{fontSize:20,fontWeight:'800',color:colors.red,textAlign:'right',marginBottom:spacing.sm},
  row:{minHeight:54,borderBottomWidth:1,borderBottomColor:colors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  rowText:{fontSize:16,color:colors.text,textAlign:'right'}});
