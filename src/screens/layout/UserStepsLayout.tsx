import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { ReactElement } from 'react';
import { Platform, SafeAreaView, Text, View } from 'react-native';

type Props = {
  children: ReactElement;
  backgroundColor?: string;
};

const UserStepsLayout = ({ children, backgroundColor }: Props) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor ?? undefined }}>
      {children}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          paddingBottom: Platform.OS == 'android' ? spacing.x10 : 0,
        }}
      >
        <Text style={[Typography.subheader.M, { color: Colors.primarySapphire.brand }]}>
          Unify the Body{' '}
        </Text>
        <Text style={[Typography.subheader.M, { color: Colors.primarySapphire.brand }]}>
          1 Cor. 12:12
        </Text>
      </View>
    </SafeAreaView>
  );
};
export default UserStepsLayout;
