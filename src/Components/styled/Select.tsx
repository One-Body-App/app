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
import SearchIcon from '@/assets/icons/search.svg';
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
      {label ? <StyledText style={{ marginBottom: spacing.x10 }}>{label}</StyledText> : null}
      <Button
        text={btnText}
        btnStyle={{
          flex: 1,
          backgroundColor: Colors.neutral[700],
          borderColor: Colors.neutral[800],
          borderRadius: borderRadius.small,
          // ...styles.btn3,
          // backgroundColor: scheme == 'dark' ? colors.text : '#E7F0F3',
        }}
        wrapperBtnStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: spacing.x10,
          paddingVertical: spacing.x16,
        }}
        btnTextStyle={{
          color: selectedItem ? Colors.neutral[200] : Colors.neutral[300],
        }}
        rightIcon={<Ionicons name="chevron-down" color={Colors.neutral[200]} />}
        // btnTextStyle={styles.btnText3}
        onPress={() => setModalVisible(true)}
      />

      <Modal
        backdropOpacity={0.3}
        isVisible={modalVisible}
        avoidKeyboard={true}
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
            paddingVertical: spacing.x16,
            borderTopRightRadius: borderRadius.large,
            borderTopLeftRadius: borderRadius.large,
            height: '60%',
            backgroundColor: colors.background,
          }}
        >
          <View style={{ flex: 1.5, maxHeight: 90, paddingHorizontal: spacing.x16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                flex: 1,
              }}
            >
              <StyledText style={Typography.fontSize.x4}>{modalTitle}</StyledText>

              <TouchableOpacity
                onPress={() => {
                  // setModalVisible(false);
                  setModalVisible(false);
                }}
              >
                <MaterialCommunityIcons
                  name="window-close"
                  size={18}
                  color={Colors.primary.brand}
                />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <StyledTextInput
                clearButtonMode="always"
                wrapperStyle={{ flex: 1 }}
                value={searchText}
                returnKeyType={'search'}
                placeholder="Search"
                leftIcon={
                  <View style={{ justifyContent: 'center' }}>
                    <SearchIcon
                      style={{ height: 15, width: 15, marginRight: spacing.x10 }}
                      stroke={Colors.neutral[200]}
                    />
                  </View>
                  // <MaterialCommunityIcons
                  //   name="magnify"
                  //   size={15}
                  //   style={{ marginRight: 10 }}
                  //   color={Colors.neutral[200]}
                  // />
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
                <StyledText style={[Typography.body.x2M, { padding: spacing.x16 }]}>
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
                      padding: spacing.x16,
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
                        color: Colors.neutral[200],
                      }}
                      numberOfLines={1}
                    >
                      {item.text}
                    </StyledText>
                    {selectedItem == item.value ? (
                      <MaterialCommunityIcons name="check" size={15} color={Colors.neutral[200]} />
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
