import {Platform,ScrollView,type ScrollViewProps} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

type Props=ScrollViewProps;

export function KeyboardAwareScrollViewCompat({children,keyboardShouldPersistTaps='handled',...props}:Props){
  if(Platform.OS==='web')return <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>{children}</ScrollView>;
  return <KeyboardAwareScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} keyboardDismissMode="interactive" bottomOffset={96} {...props}>{children}</KeyboardAwareScrollView>;
}
