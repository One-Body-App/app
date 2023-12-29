import { useNavigation } from '@react-navigation/native';
import React, {
  useState,
  useContext,
  createContext,
  useEffect,
  Context,
  SetStateAction,
  Dispatch,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChats, setAllSms } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/src/services/api';
import { appListner } from '@/src/services/notification/notificationServices';

type initialState = {
  channels: string[];
  updateChannels: Dispatch<SetStateAction<never[]>>;
};
const defaultInitialState: initialState = {
  channels: [],
  updateChannels: () => {},
};

const AppContext: Context<initialState> = createContext(defaultInitialState);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: React.ReactElement }) {
  const [channels, setChannels] = useState([]);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.userToken);

  const getAllSms = async (reciverId: string) => {
    dispatch(getChats({ token }));
    try {
      const res = await ApiCall({
        route: `chat/chat-room/${reciverId}/messages`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        const newArrayOfObj = res?.response?.data.map(
          ({ sender: user, message: text, ...rest }) => ({
            user,
            text,
            ...rest,
          })
        );
        dispatch(setAllSms(newArrayOfObj));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    appListner(navigation, getAllSms);
  }, []);

  return (
    <AppContext.Provider value={{ channels, updateChannels: setChannels }}>
      {children}
    </AppContext.Provider>
  );
}
