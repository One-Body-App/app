import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ApiCall } from '@/src/Services/api';
import Button from '@/src/components/Button';
import MapBox, { MapSuggestion } from '@/src/components/MapBox';
import { StyledText } from '@/src/components/styled/Text';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors, Spacing } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { Location } from '@/utils/types';
import { StackScreenProps } from '@react-navigation/stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  ArrowDown2,
  Gallery,
  Location as LocationIcon,
  Setting2,
  VideoPlay,
} from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fontSize } from '@/src/styles/typography';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

type Props = StackScreenProps<MainStackParamList, 'Post'>;

const NewPost = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [camera, setCamera] = useState(false);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [location, setLocation] = useState<MapSuggestion | null>(null);
  const [locationSelector, setLocationSelector] = useState<boolean>(false);

  const postSocial = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: 'social/post',
        token: token,
        params: { content },
        verb: 'post',
      });

      setIsLoading(false);
      if (result.status == 200) {
        setContent('');
        navigation.popToTop();
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'MyProfileTab',
          },
        });
      }
    } catch (e) {
      setIsLoading(false);
    }
  };

  const { dark, colors } = useTheme();
  const device = useCameraDevice('back');

  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginHorizontal: spacing.x24,
      }}
    >
      <KeyboardAvoidingView
        style={{
          paddingTop: spacing.x24,
          paddingBottom: spacing.x48,
          flex: 1,
          justifyContent: 'space-between',
        }}
        // style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={{ flex: 1 }}>
          <View>
            {location ? (
              <View
                style={{
                  marginVertical: spacing.x16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <LocationIcon
                    color={Colors.primary.brand}
                    style={{ marginRight: spacing.x10 }}
                    size={24}
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <Button
                    text={location?.place_name}
                    onPress={() => setLocationSelector(true)}
                    wrapperViewBtnStyle={{ flex: 1 }}
                  />
                  <Button
                    text=""
                    wrapperBtnStyle={{
                      marginLeft: spacing.x16,
                    }}
                    onPress={() => setLocation(null)}
                    rightIcon={<MaterialCommunityIcons name="window-close" size={20} />}
                  />
                </View>
              </View>
            ) : null}

            <StyledTextInput
              style={{ height: 200, flexGrow: 1 }}
              inputWrapperStyle={{ paddingVertical: spacing.x10 }}
              value={content}
              multiline
              returnKeyType="done"
              label={''}
              autoCorrect
              placeholder="What's on your heart?"
              // onSubmitEditing={() => inputRefs.password?.current.focus()}
              onChangeText={(value) => {
                setContent(value);
              }}
            />

            <MapBox
              location={location}
              modalVisible={locationSelector}
              setModalVisible={setLocationSelector}
              setLocation={setLocation}
              modalTitle="Find Location"
            />
            {device != null ? (
              <Camera style={StyleSheet.absoluteFill} device={device} isActive={camera} />
            ) : null}
            <View
              style={{
                columnGap: spacing.x10,
                flexDirection: 'row',

                paddingVertical: spacing.x16,
              }}
            >
              <Button
                text="Photo"
                btnTextStyle={[fontSize.x3, { marginTop: spacing.x10 }]}
                btnStyle={{
                  backgroundColor: Colors.neutral[700],
                  padding: spacing.x16,
                  borderRadius: borderRadius.base,
                  flex: 1,
                }}
                wrapperViewBtnStyle={{ flex: 1 }}
                wrapperBtnStyle={{
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                leftIcon={<Gallery color={Colors.primary.brand} size={32} />}
                onPress={async () => {
                  setCamera(true);
                  // LoginManager.logOut();
                  // dispatch(logout());
                  // await auth().signOut();
                }}
              />
              {/* <Button
            text="Video"
            wrapperViewBtnStyle={{ flex: 1 }}
            btnTextStyle={[fontSize.x3, { marginTop: spacing.x10 }]}
            btnStyle={{
              backgroundColor: Colors.neutral[700],
              flex: 1,
              padding: spacing.x16,
              borderRadius: borderRadius.base,
            }}
            wrapperBtnStyle={{ flexDirection: 'column' }}
            leftIcon={<VideoPlay color={Colors.primary.brand} size={32} />}
            onPress={async () => {
              // LoginManager.logOut();
              // dispatch(logout());
              // await auth().signOut();
            }}
          /> */}
              <Button
                text="Location"
                wrapperViewBtnStyle={{ flex: 1 }}
                btnTextStyle={[fontSize.x3, { marginTop: spacing.x10 }]}
                btnStyle={{
                  backgroundColor: Colors.neutral[700],
                  flex: 1,
                  padding: spacing.x16,
                  borderRadius: borderRadius.base,
                }}
                wrapperBtnStyle={{ flexDirection: 'column' }}
                leftIcon={<LocationIcon color={Colors.primary.brand} size={32} />}
                onPress={() => {
                  // navigation.navigate('Settings');
                  setLocationSelector(true);
                }}
              />
            </View>
          </View>
        </ScrollView>
        <Button
          disabled={isLoading}
          onPress={() => {
            postSocial();
          }}
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          content={
            <>
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <StyledText style={{ color: 'white' }}>Post</StyledText>
              )}
            </>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewPost;
