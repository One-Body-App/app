import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';

export function navigateWithinCurrentNavigator<
  ParamList extends ParamListBase,
  RouteName extends Extract<keyof ParamList, string>,
>(navigation: NavigationProp<ParamList>, name: RouteName, params?: ParamList[RouteName]) {
  const action = CommonActions.navigate({
    name,
    params,
  });
  const target = navigation.getState().key;

  navigation.dispatch(target ? { ...action, target } : action);
}
