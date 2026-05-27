import React, { useState } from 'react';
import { Modal, FlatList, StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import type { CreateFlowColors } from './shared';

const OTHER_VALUE = '__other__';

type DropdownItem = {
  label: string;
  value: string;
};

type Props = {
  items: DropdownItem[];
  selectedValue: string;
  customValue: string;
  onSelect: (value: string) => void;
  onCustomChange: (text: string) => void;
  placeholder?: string;
  palette: CreateFlowColors;
  hasError?: boolean;
  errorColor?: string;
};

export default function EventTypeDropdown({
  items,
  selectedValue,
  customValue,
  onSelect,
  onCustomChange,
  placeholder = 'Select event type',
  palette,
  hasError = false,
  errorColor,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  const isOther = selectedValue === OTHER_VALUE;
  const selectedLabel = isOther
    ? 'Other'
    : items.find((item) => item.value === selectedValue)?.label;

  const allOptions: DropdownItem[] = [...items, { label: 'Other', value: OTHER_VALUE }];

  const handleSelect = (value: string) => {
    onSelect(value);
    setModalVisible(false);
  };

  return (
    <View>
      <Pressable
        style={[
          styles.trigger,
          {
            backgroundColor: palette.inputBg,
            borderColor: hasError ? errorColor || palette.accent : palette.inputBorder,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selectedLabel ? palette.inputText : palette.inputPlaceholder,
            },
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={22} color={palette.inputPlaceholder} />
      </Pressable>

      {isOther && (
        <TextInput
          style={[
            styles.customInput,
            {
              backgroundColor: palette.inputBg,
              borderColor: hasError ? errorColor || palette.accent : palette.inputBorder,
              color: palette.inputText,
            },
          ]}
          value={customValue}
          onChangeText={onCustomChange}
          placeholder="Enter your event type"
          placeholderTextColor={palette.inputPlaceholder}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: palette.cardBg,
                borderColor: palette.cardBorder,
              },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownTitle, { color: palette.textPrimary }]}>Event Type</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={allOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <Pressable
                    style={[
                      styles.option,
                      {
                        backgroundColor: isSelected ? palette.cardActiveBg : palette.cardBg,
                        borderColor: isSelected ? palette.cardActiveBorder : 'transparent',
                        borderWidth: isSelected ? 1 : 0,
                      },
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isSelected ? palette.accent : palette.textPrimary,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <MaterialIcons name="check" size={18} color={palette.accent} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export { OTHER_VALUE };

const styles = StyleSheet.create({
  trigger: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontSize: 16,
    flex: 1,
  },
  customInput: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginTop: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdown: {
    borderRadius: 18,
    borderWidth: 1,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dropdownTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  option: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 16,
  },
});
