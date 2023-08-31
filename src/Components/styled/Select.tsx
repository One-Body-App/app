import { poppings } from '@/src/styles/typography';
import { FC, useEffect, useState } from 'react';
import { ButtonProps, ScrollView, TouchableOpacity, View, ViewStyle } from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyledText } from './Text';
import { Colors, Typography } from '@/src/styles';
import Button from '../Button';
import { borderRadius } from '@/src/styles/outlines';
import { useTheme } from '@react-navigation/native';
import { StyledTextInput } from './TextInput';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing } from '@/src/styles/spacing';

type selectedItem = {
  text: string;
  value: string;
};

interface Props {
  items: selectedItem[];
  btnText: string;
  modalTitle: string;
  onChange: (item: any) => void;
  selectedItem?: string;
  label?: string;
  wrapperStyle?: ViewStyle;
}

export const StyledSelect: FC<Props> = ({
  btnText,
  items,
  onChange,
  modalTitle,
  selectedItem,
  label,
  wrapperStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedItems, setSearchedItems] = useState<selectedItem[]>([]);

  const { colors } = useTheme();

  useEffect(() => {
    setSearchedItems(items);
    setSearchText('');
  }, [items]);

  useEffect(() => {
    let values = items;
    if (searchText != '') {
      values = items.filter((item) => item.text.toLowerCase().includes(searchText.toLowerCase()));
    }

    setSearchedItems(values);
  }, [searchText]);

  return (
    <View style={wrapperStyle}>
      {label ? <StyledText style={{ marginBottom: 10 }}>{label}</StyledText> : null}
      <Button
        text={btnText}
        btnStyle={{
          flex: 1,
          backgroundColor: Colors.neutral[600],
          borderColor: Colors.neutral[700],
          borderRadius: borderRadius.small,
          // ...styles.btn3,
          // backgroundColor: scheme == 'dark' ? colors.text : '#E7F0F3',
        }}
        wrapperBtnStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 16,
        }}
        btnTextStyle={{
          color: Colors.neutral[300],
        }}
        RightIcon={<Ionicons name="chevron-down" color={Colors.neutral[200]} />}
        // btnTextStyle={styles.btnText3}
        onPress={() => setModalVisible(true)}
      />

      <Modal
        backdropOpacity={0.3}
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onSwipeComplete={() => setModalVisible(false)}
        swipeDirection={['down']}
        // style={styles.bottomView}
        style={{
          justifyContent: 'flex-end',
          margin: 0,
        }}
        propagateSwipe={true}
      >
        <View
          style={{
            paddingVertical: 18,
            borderTopRightRadius: borderRadius.large,
            borderTopLeftRadius: borderRadius.large,
            height: '50%',
            backgroundColor: colors.background,
          }}
        >
          <View style={{ flex: 1, paddingHorizontal: 18 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                flex: 1,
              }}
            >
              <StyledText style={{ fontSize: 18 }}>{modalTitle}</StyledText>
              <MaterialCommunityIcons name="window-close" size={18} color={Colors.primary.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <StyledTextInput
                wrapperStyle={{ flex: 1 }}
                value={searchText}
                returnKeyType={'search'}
                placeholder="Search"
                leftIcon={
                  <MaterialCommunityIcons
                    name="magnify"
                    size={15}
                    style={{ marginRight: 10 }}
                    color={Colors.neutral.brand}
                  />
                }
                onChangeText={(text) => {
                  setSearchText(text);
                  // changeHandler('password', password.trim())
                }}
              />
            </View>
          </View>

          <View style={{ flex: 4 }}>
            <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>
              {searchedItems.length == 0 ? (
                <StyledText style={[Typography.body.x2M, { padding: 18 }]}>
                  No results found
                </StyledText>
              ) : null}
              {searchedItems.map((item, index) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.value);

                      setModalVisible(false);
                    }}
                    // style={styles.listItem2}
                    key={index}
                    style={{
                      paddingHorizontal: 18,
                      paddingVertical: 17,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      borderColor: Colors.primary[800],
                      borderWidth: selectedItem == item.value ? 1 : 0,
                      backgroundColor:
                        selectedItem == item.value ? Colors.primarySapphire[900] : '',
                    }}
                  >
                    <StyledText
                      style={{
                        color: Colors.neutral.brand,
                      }}
                      numberOfLines={1}
                    >
                      {item.text}
                    </StyledText>
                    {selectedItem == item.value ? (
                      <MaterialCommunityIcons name="check" size={15} color={Colors.neutral.brand} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
