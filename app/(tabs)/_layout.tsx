import {Ionicons} from '@expo/vector-icons';
import {Tabs} from 'expo-router';
import {useI18n} from '@/i18n/I18nContext';
import {colors} from '@/theme/tokens';
export default function TabsLayout(){const {t}=useI18n();return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:colors.blue,
  tabBarLabelStyle:{fontSize:11},tabBarStyle:{height:66,paddingBottom:8,paddingTop:6}}}>
  <Tabs.Screen name="index" options={{title:t('home'),tabBarIcon:({color,size})=><Ionicons name="home" color={color} size={size}/>}}/>
  <Tabs.Screen name="contacts" options={{title:t('contacts'),tabBarIcon:({color,size})=><Ionicons name="people" color={color} size={size}/>}}/>
  <Tabs.Screen name="properties" options={{title:t('properties'),tabBarIcon:({color,size})=><Ionicons name="business" color={color} size={size}/>}}/>
  <Tabs.Screen name="matches" options={{title:t('matches'),tabBarIcon:({color,size})=><Ionicons name="git-compare" color={color} size={size}/>}}/>
  <Tabs.Screen name="more" options={{title:t('more'),tabBarIcon:({color,size})=><Ionicons name="menu" color={color} size={size}/>}}/>
</Tabs>}

