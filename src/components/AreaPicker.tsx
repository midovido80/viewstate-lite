import {Ionicons} from '@expo/vector-icons';
import {useMemo,useState} from 'react';
import {Modal,Pressable,SafeAreaView,SectionList,StyleSheet,Text,TextInput,View} from 'react-native';
import {filterKuwaitAreaGroups,governorateForArea} from '@/data/kuwaitAreas';
import {colors,radius,spacing} from '@/theme/tokens';
import {useI18n} from '@/i18n/I18nContext';

export function AreaPicker({value,onChange}:{value:string;onChange:(area:string)=>void}) {
  const {t,isRTL}=useI18n();
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const sections=useMemo(()=>filterKuwaitAreaGroups(query).map(group=>({title:group.governorate,data:[...group.areas]})),[query]);
  const governorate=value?governorateForArea(value):null;
  const close=()=>{setOpen(false);setQuery('')};
  return <>
    <View style={styles.fieldWrap}>
      <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{t('area')} *</Text>
      <Pressable accessibilityRole="button" onPress={()=>setOpen(true)} style={[styles.selector,{flexDirection:isRTL?'row':'row-reverse'}]}>
        <Ionicons name="chevron-down" size={20} color={colors.blue}/>
        <View style={styles.selectedText}>
          <Text style={[styles.value,{textAlign:isRTL?'right':'left'},!value&&styles.placeholder]}>{value||t('chooseArea')}</Text>
          {governorate?<Text style={[styles.governorate,{textAlign:isRTL?'right':'left'}]}>{governorate}</Text>:null}
        </View>
        <Ionicons name="location-outline" size={22} color={colors.red}/>
      </Pressable>
    </View>
    <Modal visible={open} animationType="none" hardwareAccelerated onRequestClose={close}>
      <SafeAreaView style={styles.modalPage}>
        <View style={styles.modalHeader}>
          <Pressable onPress={close} hitSlop={12}><Ionicons name="close" size={28} color="white"/></Pressable>
          <Text style={styles.modalTitle}>{t('chooseAreaTitle')}</Text>
        </View>
        <View style={styles.search}>
          <Ionicons name="search" size={21} color={colors.muted}/>
          <TextInput autoFocus value={query} onChangeText={setQuery} placeholder={t('typeFirstLetters')}
            placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue}
            style={[styles.searchInput,{textAlign:isRTL?'right':'left'}]}/>
        </View>
        <SectionList sections={sections} keyExtractor={item=>item} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t('noArea')}</Text>}
          renderSectionHeader={({section})=><Text style={styles.section}>{section.title}</Text>}
          renderItem={({item})=><Pressable onPress={()=>{onChange(item);close()}} style={[styles.row,item===value&&styles.selectedRow]}>
            <Ionicons name={item===value?'checkmark-circle':'ellipse-outline'} size={22} color={item===value?colors.blue:colors.border}/>
            <Text style={styles.rowText}>{item}</Text>
          </Pressable>}/>
      </SafeAreaView>
    </Modal>
  </>;
}

const styles=StyleSheet.create({
  fieldWrap:{gap:spacing.xs},label:{fontSize:15,fontWeight:'600',color:colors.text,textAlign:'right'},
  selector:{minHeight:58,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,paddingHorizontal:spacing.md,
    flexDirection:'row',alignItems:'center',gap:spacing.sm,backgroundColor:'white'},
  selectedText:{flex:1,flexShrink:1},value:{fontSize:16,lineHeight:23,color:colors.text,textAlign:'right',fontWeight:'600',flexShrink:1},placeholder:{color:colors.muted,fontWeight:'400'},
  governorate:{fontSize:12,color:colors.muted,textAlign:'right',marginTop:3},modalPage:{flex:1,backgroundColor:colors.background},
  modalHeader:{backgroundColor:colors.blue,padding:spacing.md,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  modalTitle:{color:'white',fontSize:21,fontWeight:'700'},search:{margin:spacing.md,minHeight:50,borderWidth:1,borderColor:colors.border,
    borderRadius:radius.md,backgroundColor:'white',paddingHorizontal:spacing.md,flexDirection:'row-reverse',alignItems:'center',gap:spacing.sm},
  searchInput:{flex:1,fontSize:16,textAlign:'right',color:'#1A1A1A',backgroundColor:'#FFFFFF'},list:{paddingHorizontal:spacing.md,paddingBottom:spacing.xl},
  section:{backgroundColor:colors.surface,color:colors.red,fontSize:17,fontWeight:'800',textAlign:'right',padding:spacing.sm,
    marginTop:spacing.sm,borderRadius:radius.sm},row:{minHeight:50,borderBottomWidth:1,borderBottomColor:colors.border,
    flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.sm},
  selectedRow:{backgroundColor:'#EEF5FF'},rowText:{flex:1,flexShrink:1,fontSize:16,lineHeight:23,textAlign:'right',color:colors.text,paddingVertical:10,paddingHorizontal:spacing.sm},empty:{textAlign:'center',color:colors.muted,marginTop:60,fontSize:17},
});
