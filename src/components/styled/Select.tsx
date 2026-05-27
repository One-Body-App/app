import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, Pressable, View, ViewStyle, TextStyle } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import StyledText from './Text';
import { Colors, Typography } from '@/src/styles';
import Button from '../Button';
import { borderRadius } from '@/src/styles/outlines';
import StyledTextInput from './TextInput';
import SearchIcon from '@/assets/icons/search.svg';
import { spacing } from '@/src/styles/spacing';
import CustomModal from '../CustomModal';

type SelectedItem = {
  text: string;
  value: string;
};

interface Props {
  items: SelectedItem[];
  btnText: string;
  modalTitle: string;
  onChange: (item: any) => void;
  selectedItem?: string;
  label?: string;
  wrapperStyle?: ViewStyle;
  hideSearch?: boolean;
  showAllWithoutSearch?: boolean;
  btnStyle?: ViewStyle;
  btnTextStyle?: TextStyle;
  wrapperBtnStyle?: ViewStyle;
  wrapperViewBtnStyle?: ViewStyle;
  rightIcon?: ReactNode;
  leftIcon?: ReactNode;
}

export default function StyledSelect({
  btnText,
  items,
  onChange,
  modalTitle,
  selectedItem,
  label,
  wrapperStyle,
  hideSearch,
  showAllWithoutSearch,
  btnStyle,
  btnTextStyle,
  wrapperBtnStyle,
  wrapperViewBtnStyle,
  rightIcon,
  leftIcon,
}: Props) {
  const { dark, colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedItems, setSearchedItems] = useState<SelectedItem[]>(
    hideSearch || showAllWithoutSearch ? items : []
  );
  useEffect(() => {
    setSearchText('');

    if (hideSearch || showAllWithoutSearch) {
      setSearchedItems(items);
    }
  }, [items, hideSearch, showAllWithoutSearch]);

  useEffect(() => {
    let values = items;
    if (searchText != '') {
      values = items.filter(
        (item) => item.text.toLowerCase().indexOf(searchText.toLowerCase()) > -1
      );
      setSearchedItems(values);
    } else {
      setSearchedItems(hideSearch || showAllWithoutSearch ? items : []);
    }
  }, [searchText]);

  return (
    <View style={wrapperStyle}>
      {label ? <StyledText style={{ marginBottom: spacing.x10 }}>{label}</StyledText> : null}
      <Button
        text={btnText}
        leftIcon={leftIcon}
        btnStyle={[
          {
            flex: 1,
            backgroundColor: Colors.neutral[700],
            borderColor: Colors.neutral[800],
            borderRadius: borderRadius.xs,
          },
          btnStyle,
        ]}
        wrapperBtnStyle={[
          {
            justifyContent: 'space-between',
            paddingHorizontal: spacing.x10,
            paddingVertical: spacing.x16,
          },
          wrapperBtnStyle,
        ]}
        wrapperViewBtnStyle={wrapperViewBtnStyle}
        btnTextStyle={[
          {
            textTransform: 'capitalize',
            color: selectedItem ? Colors.neutral[200] : Colors.neutral[300],
          },
          btnTextStyle,
        ]}
        rightIcon={rightIcon ?? <Ionicons name="chevron-down" color={Colors.neutral[200]} />}
        // btnTextStyle={styles.btnText3}
        onPress={() => setModalVisible(true)}
      />

      <CustomModal
        modalVisible={modalVisible}
        onclose={() => setModalVisible(false)}
        // style={styles.bottomView}
        style={{
          justifyContent: 'flex-end',
          margin: 0,
        }}
      >
        <View
          style={{
            paddingVertical: spacing.x16,
            borderTopRightRadius: borderRadius.large,
            borderTopLeftRadius: borderRadius.large,
            // height: '90%',
            flex: 1,
            marginTop: spacing.x48,
            backgroundColor: colors.background,
          }}
        >
          {/* <View style={{ paddingHorizontal: spacing.x16, paddingBottom: spacing.x10 }}> */}
          <View
            style={{
              flex: hideSearch ? 0 : 1.5,

              maxHeight: 90,
              paddingHorizontal: spacing.x16,

              // paddingBottom: hideSearch ? spacing.x10 : 0,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                // flex: 1,
              }}
            >
              <StyledText style={[Typography.fontSize.x4, { paddingBottom: spacing.x10 }]}>
                {modalTitle}
              </StyledText>

              <Pressable
                onPress={() => {
                  // setModalVisible(false);
                  setModalVisible(false);
                }}
              >
                <MaterialCommunityIcons
                  name="window-close"
                  size={18}
                  color={dark ? colors.text : Colors.primary.brand}
                />
              </Pressable>
            </View>
            {!hideSearch ? (
              <View style={{ flex: 1 }}>
                <StyledTextInput
                  clearButtonMode="always"
                  wrapperStyle={{ flex: 1 }}
                  value={searchText}
                  returnKeyType="search"
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
            ) : null}
          </View>

          <View
            style={{
              flex: 1,
              paddingHorizontal: hideSearch ? 0 : spacing.x8,
            }}
          >
            <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled>
              {searchedItems.length == 0 && searchText != '' ? (
                <StyledText style={[Typography.body.x2M, { padding: spacing.x16 }]}>
                  No results found
                </StyledText>
              ) : null}
              {searchedItems.map((item, index) => {
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);

                      setModalVisible(false);
                    }}
                    // style={styles.listItem2}
                    key={item.value}
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
                        textTransform: 'capitalize',
                      }}
                      numberOfLines={1}
                    >
                      {item.text}
                    </StyledText>
                    {selectedItem == item.value ? (
                      <MaterialCommunityIcons name="check" size={15} color={Colors.neutral[200]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </CustomModal>
    </View>
  );
}
