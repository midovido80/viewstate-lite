import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {colors,radius,spacing} from '@/theme/tokens';

export default function ContactAddMethod(){return <SafeAreaView style={styles.page} edges={['top']}>
  <AppHeader title="إضافة شخص"/>
  <View style={styles.content}>
    <Text style={styles.question}>كيف تريد إضافة الشخص؟</Text>
    <Text style={styles.helper}>اختر الطريقة الأسرع لك الآن</Text>
    <Pressable onPress={()=>router.push('/contact-form')} style={styles.card}>
      <Ionicons name="create-outline" size={36} color={colors.blue}/>
      <View style={styles.copy}><Text style={styles.title}>إضافة يدويًا</Text><Text style={styles.description}>اكتب الاسم والرقم والتصنيف</Text></View>
      <Ionicons name="chevron-back" size={24} color={colors.muted}/>
    </Pressable>
    <Pressable onPress={()=>router.push('/contact-import')} style={styles.card}>
      <Ionicons name="phone-portrait-outline" size={36} color={colors.green}/>
      <View style={styles.copy}><Text style={styles.title}>استيراد من الهاتف</Text><Text style={styles.description}>اختر شخصًا أو عدة أشخاص من جهات الاتصال</Text></View>
      <Ionicons name="chevron-back" size={24} color={colors.muted}/>
    </Pressable>
  </View>
</SafeAreaView>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md},
  question:{fontSize:23,fontWeight:'800',color:colors.red,textAlign:'right',marginTop:spacing.sm},helper:{fontSize:15,color:colors.muted,textAlign:'right'},
  card:{minHeight:102,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,backgroundColor:'white',padding:spacing.md,
    flexDirection:'row-reverse',alignItems:'center',gap:spacing.md},copy:{flex:1},title:{fontSize:18,fontWeight:'800',color:colors.text,textAlign:'right'},
  description:{fontSize:14,color:colors.muted,textAlign:'right',marginTop:5}});
