import { Pressable, View, Text } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { CommentListFilter } from './commentListUtils';
import flatStyles from './flatStyles';

type CommentFilterTabsProps = {
  value: CommentListFilter;
  onChange: (nextValue: CommentListFilter) => void;
  backgroundColor: string;
  borderColor: string;
  activeColor: string;
  inactiveColor: string;
};

function CommentFilterTabs({
  value,
  onChange,
  backgroundColor,
  borderColor,
  activeColor,
  inactiveColor,
}: CommentFilterTabsProps) {
  const label = value === 'latest' ? 'Latest' : 'Relevant';
  const nextValue: CommentListFilter = value === 'latest' ? 'relevant' : 'latest';
  const chevronColor = activeColor || inactiveColor;

  return (
    <View style={[flatStyles.filterBar, { backgroundColor, borderBottomColor: borderColor }]}>
      <Pressable
        style={flatStyles.filterDropdownButton}
        onPress={() => {
          onChange(nextValue);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Comment filter. Current selection ${label}.`}
      >
        <Text style={[flatStyles.filterText, flatStyles.filterTextActive, { color: activeColor }]}>
          {label}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color={chevronColor} />
      </Pressable>
    </View>
  );
}

export default CommentFilterTabs;
