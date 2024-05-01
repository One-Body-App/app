import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LobbyConnectPortal from '../../components/ConnectPortal/LobbyConnectPortal';
import HomeScreenPlace from '@/src/components/ConnectPortal/Places/HomeScreenPlace';
import HomeScreenGo from '@/src/components/ConnectPortal/Go/HomeScreenGo';
import HomeScreenServe from '@/src/components/ConnectPortal/Serve/HomeScreenServe';

type connectPortalTabsTypes = 'Places' | 'Go' | 'Serve';
function ConnectPortalHome() {
  const [selectedOption, setSelectedOption] = useState<connectPortalTabsTypes>('Places');
  const [lobbyModalVisible, setLobbyModalVisible] = useState(true);
  const navigation = useNavigation();
  useEffect(() => {}, []);
  const handleOptionSelect = (option: connectPortalTabsTypes) => {
    setSelectedOption(option);
  };
  const toggleLobbyModal = () => {
    setLobbyModalVisible(!lobbyModalVisible);
  };
  const renderContent = () => {
    switch (selectedOption) {
      case 'Places':
        return <HomeScreenPlace />;
      case 'Go':
        return <HomeScreenGo />;
      case 'Serve':
        return <HomeScreenServe />;
      default:
        return null;
    }
  };
  return (
    <ScrollView>
      <View style={{ flex: 1 }}>
        <View>{renderContent()}</View>

        <LobbyConnectPortal
          onClose={() => setLobbyModalVisible(false)}
          visible={lobbyModalVisible}
        />

        <TouchableOpacity onPress={toggleLobbyModal}>
          <Text>Open Lobby</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
interface OptionButtonProps {
  label: string;
  option: connectPortalTabsTypes;
  selectedOption: connectPortalTabsTypes;
  onPress: (option: connectPortalTabsTypes) => void;
}
const OptionButton: React.FC<OptionButtonProps> = ({ label, option, selectedOption, onPress }) => {
  const isSelected = selectedOption === option;

  return (
    <TouchableOpacity
      style={{ backgroundColor: isSelected ? 'lightblue' : 'white', padding: 10 }}
      onPress={() => onPress(option)}
    >
      <Text>{label}</Text>
    </TouchableOpacity>
  );
};
export default ConnectPortalHome;
