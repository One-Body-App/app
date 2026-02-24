import { TouchableOpacity, View, Text } from 'react-native';
import { CommentListFilter } from './commentListUtils';
import { flatStyles } from './flatStyles';

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
  return (
    <View style={[flatStyles.filterBar, { backgroundColor, borderBottomColor: borderColor }]}>
      <TouchableOpacity
        style={flatStyles.filterButton}
        onPress={() => {
          onChange('relevant');
        }}
      >
        <Text
          style={[
            flatStyles.filterText,
            value === 'relevant' ? flatStyles.filterTextActive : undefined,
            {
              color: value === 'relevant' ? activeColor : inactiveColor,
            },
          ]}
        >
          Relevant
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={flatStyles.filterButton}
        onPress={() => {
          onChange('latest');
        }}
      >
        <Text
          style={[
            flatStyles.filterText,
            value === 'latest' ? flatStyles.filterTextActive : undefined,
            {
              color: value === 'latest' ? activeColor : inactiveColor,
            },
          ]}
        >
          Latest
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default CommentFilterTabs;
