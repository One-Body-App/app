import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { StyleSheet, View } from "react-native";
import { Avatar, Button, Caption, Title } from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/reducers/rootReducer";
import { NO_PROFILE_IMAGE } from "../Services/constants";

export default function DrawerContent({
  descriptors,
  state,
  ...rest
}: DrawerContentComponentProps) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
 const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  const { drawerContentStyle, drawerContentContainerStyle } = focusedOptions;


  return (
    <DrawerContentScrollView  {...rest}
      contentContainerStyle={drawerContentContainerStyle}
      style={drawerContentStyle}>
      <View style={styles.drawerContent}>
        <View style={styles.userInfoSection}>
          <View style={{ flex: 1 }}>
            <Avatar.Image
              source={{
                uri: user?.profileImage || NO_PROFILE_IMAGE,
              }}
              size={60}
            />
          </View>
          <View style={{ padding: 10, flex: 2 }}>
            <Title style={styles.title} numberOfLines={1}>
              {user?.name}
            </Title>
            <Caption style={styles.caption}>@{user?.username}</Caption>
            <Button
              onPress={() => rest.navigation.navigate('MyProfile')}
              mode="text"
              style={{ marginLeft: -5, alignItems: 'flex-start', marginTop: 3 }}
              // contentStyle={{ marginLeft: -5 }}
              labelStyle={{ paddingHorizontal: 0, marginHorizontal: 6, marginVertical: 4 }}
            >
              View Profile
            </Button>
          </View>
        </View>
        <DrawerItemList descriptors={descriptors} state={state} {...rest} />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginTop: 20,
    flex: 1,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  paragraph: {
    fontWeight: 'bold',
    marginRight: 3,
  },
  drawerSection: {
    marginTop: 15,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
