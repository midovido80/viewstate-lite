import {Ionicons} from '@expo/vector-icons';
import {useMemo,useState} from 'react';
import {Modal,Pressable,SafeAreaView,SectionList,StyleSheet,Text,TextInput,View} from 'react-native';
import {filterKuwaitAreaGroups} from '@/data/kuwaitAreas';
import {colors,radius,spacing} from '@/theme/tokens';

export function MultiAreaPicker({value,onChange}:{value:string[];onChange:(areas:string[])=>void}){
  const [open,setOpen]=useState(false);const [query,setQuery]=useState('');
  const sections=useMemo(()=>filterKuwaitAreaGroups(query).map(group=>({title:group.governorate,data:[...group.areas]})),[query]);
  const toggle=(area:string)=>onChange(value.includes(area)?value.filter(item=>item!==area):[...value,area]);
  const close=()=>{setOpen(false);setQuery('')};
  return <View style={styles.wrap}>
    <Text style={styles.label}>المنطقة *</Text>
    <Pressable onPress={()=>setOpen(true)} style={styles.selector}>
      <Ionicons name="chevron-down" size={20} color={colors.blue}/><Text style={[styles.value,!value.length&&styles.placeholder]}>
        {value.length?`${value.join('، ')}`:'اختر منطقة أو أكثر'}</Text><Ionicons name="location-outline" size={22} color={colors.red}/>
    </Pressable>
    {value.length?<View style={styles.chips}>{value.map(area=><Pressable key={area} onPress={()=>toggle(area)} style={styles.chip}>
      <Ionicons name="close-circle" size={17} color={colors.blue}/><Text style={styles.chipText}>{area}</Text></Pressable>)}</View>:null}
    <Modal visible={open} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.page}>
        <View style={styles.header}><Pressable onPress={close} hitSlop={12}><Text style={styles.done}>تم ({value.length})</Text></Pressable>
          <Text style={styles.title}>اختر المناطق</Text></View>
        <View style={styles.search}><Ionicons name="search" size={21} color={colors.muted}/><TextInput autoFocus value={query} onChangeText={setQuery}
          placeholder="اكتب أول حرفين" placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue} style={styles.searchInput}/></View>
        <SectionList sections={sections} keyExtractor={item=>item} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}
          renderSectionHeader={({section})=><Text style={styles.section}>{section.title}</Text>}
          renderItem={({item})=>{const selected=value.includes(item);return <Pressable onPress={()=>toggle(item)} style={[styles.row,selected&&styles.selected]}>
            <Ionicons name={selected?'checkmark-circle':'ellipse-outline'} size={23} color={selected?colors.blue:colors.border}/><Text style={styles.rowText}>{item}</Text></Pressable>}}
          ListEmptyComponent={<Text style={styles.empty}>لا توجد منطقة مطابقة</Text>}/>
      </SafeAreaView>
    </Modal>
  </View>;
}

const styles=StyleSheet.create({wrap:{gap:spacing.xs},label:{fontSize:15,fontWeight:'600',color:colors.text,textAlign:'right'},selector:{minHeight:58,
  borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,paddingHorizontal:spacing.md,flexDirection:'row',alignItems:'center',gap:spacing.sm,backgroundColor:'white'},
  value:{flex:1,fontSize:16,color:colors.text,textAlign:'right',fontWeight:'600'},placeholder:{color:colors.muted,fontWeight:'400'},chips:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.xs},
  chip:{flexDirection:'row-reverse',gap:4,alignItems:'center',paddingHorizontal:8,paddingVertical:5,borderRadius:radius.md,backgroundColor:'#EEF5FF'},chipText:{color:colors.text},
  page:{flex:1,backgroundColor:colors.background},header:{backgroundColor:colors.blue,padding:spacing.md,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  done:{color:'white',fontSize:16,fontWeight:'800'},title:{color:'white',fontSize:21,fontWeight:'800'},search:{margin:spacing.md,minHeight:50,borderWidth:1,
  borderColor:colors.border,borderRadius:radius.md,backgroundColor:'white',paddingHorizontal:spacing.md,flexDirection:'row-reverse',alignItems:'center',gap:spacing.sm},
  searchInput:{flex:1,fontSize:16,textAlign:'right',color:'#1A1A1A',backgroundColor:'#FFFFFF'},list:{paddingHorizontal:spacing.md,paddingBottom:spacing.xl},
  section:{backgroundColor:colors.surface,color:colors.red,fontSize:17,fontWeight:'800',textAlign:'right',padding:spacing.sm,marginTop:spacing.sm,borderRadius:radius.sm},
  row:{minHeight:50,borderBottomWidth:1,borderBottomColor:colors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.sm},
  selected:{backgroundColor:'#EEF5FF'},rowText:{fontSize:16,textAlign:'right',color:colors.text},empty:{textAlign:'center',color:colors.muted,marginTop:60,fontSize:17}});
