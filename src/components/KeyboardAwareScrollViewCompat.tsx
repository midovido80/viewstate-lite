import {forwardRef} from 'react';
import {Platform,ScrollView,type ScrollViewProps} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller';

type Props=ScrollViewProps;

export const KeyboardAwareScrollViewCompat=forwardRef<any,Props>(function KeyboardAwareScrollViewCompat({children,keyboardShouldPersistTaps='always',keyboardDismissMode,...props},ref){
  const dismissMode=keyboardDismissMode??(Platform.OS==='ios'?'interactive':'on-drag');
  if(Platform.OS==='web')return <ScrollView ref={ref} keyboardShouldPersistTaps={keyboardShouldPersistTaps} keyboardDismissMode={dismissMode} {...props}>{children}</ScrollView>;
  return <KeyboardAwareScrollView ref={ref} keyboardShouldPersistTaps={keyboardShouldPersistTaps} keyboardDismissMode={dismissMode}
    bottomOffset={32} disableScrollOnKeyboardHide {...props}>{children}</KeyboardAwareScrollView>;
});
