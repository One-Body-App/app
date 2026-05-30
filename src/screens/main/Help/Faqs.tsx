import React, { useCallback, useMemo, useState } from 'react';
import { Text, View, FlatList, Pressable, ListRenderItem, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import AntDesign from '@react-native-vector-icons/ant-design';
import { useSelector } from 'react-redux';
import RenderHtml from 'react-native-render-html';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import Header from '@/components/Header';
import { styles } from './styles';
import { Colors } from '@/src/styles';
import { RootState } from '@/src/redux/reducers/rootReducer';
// import ZendeskChat from 'react-native-zendesk-chat';

type FaqItem = {
  name?: string;
  body?: string;
};

const faqRowStyles = StyleSheet.create({
  list: {
    height: getHeight(10),
    alignSelf: 'center',
  },
  separator: {
    height: getHeight(1.5),
  },
  row: {
    width: getWidth(96),
    borderBottomWidth: 0.45,
    borderBottomColor: '#70747D',
    borderRadius: 10,
  },
  rowButton: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: getHeight(5),
    flexDirection: 'row',
    marginHorizontal: 10,
  },
  rowTitle: {
    color: ' #032F3C',
    fontFamily: 'OpenSans-Regular',
    fontSize: 16,
    fontWeight: '400',
  },
  answer: {
    marginHorizontal: 10,
    padding: 10,
  },
});

function FaqSeparator() {
  return <View style={faqRowStyles.separator} />;
}

type FaqRowProps = {
  item: FaqItem;
  index: number;
  selected: boolean;
  onToggle: (index: number) => void;
};

const FaqRow = React.memo(function FaqRow({ item, index, selected, onToggle }: FaqRowProps) {
  const handlePress = useCallback(() => {
    onToggle(index);
  }, [index, onToggle]);
  const htmlSource = useMemo(() => ({ html: item?.body ?? '' }), [item?.body]);

  return (
    <View style={faqRowStyles.row}>
      <Pressable onPress={handlePress} style={faqRowStyles.rowButton}>
        <Text style={faqRowStyles.rowTitle}>{item?.name}</Text>
        {selected ? (
          <AntDesign name="up" color={Colors.primarySapphire[500]} size={15} />
        ) : (
          <AntDesign name="down" color={Colors.primarySapphire[500]} size={15} />
        )}
      </Pressable>
      {selected ? (
        <View style={faqRowStyles.answer}>
          <RenderHtml source={htmlSource} />
        </View>
      ) : null}
    </View>
  );
});

function Faqs({ navigation }: { navigation: any }) {
  const faqs = useSelector((state: RootState) => state.general.faqs) as FaqItem[];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const handleToggleFaq = useCallback((index: number) => {
    setSelectedIndex((currentIndex) => (currentIndex === index ? null : index));
  }, []);
  const renderFaqItem: ListRenderItem<FaqItem> = useCallback(
    ({ item, index }) => (
      <FaqRow
        item={item}
        index={index}
        selected={selectedIndex === index}
        onToggle={handleToggleFaq}
      />
    ),
    [handleToggleFaq, selectedIndex]
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header
        title="FAQs"
        leftView={
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </Pressable>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <FlatList<FaqItem>
          data={faqs}
          style={faqRowStyles.list}
          keyExtractor={(item, index) => index.toString()}
          ItemSeparatorComponent={FaqSeparator}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          renderItem={renderFaqItem}
        />
      </View>
    </View>
  );
}
export default Faqs;
