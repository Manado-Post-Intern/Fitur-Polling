import {FlatList, Pressable, StyleSheet, View} from 'react-native';
import React from 'react';
import {Gap, TextInter} from '../../../../components';
import {IcPlus, theme} from '../../../../assets';
import More from '../../../../components/atoms/More';
import {Card} from './components';

const categories = ['Politik', 'Budaya', 'Pendidikan'];
const data = [0, 1, 2, 3];

const NewsForYou = ({canalModalRef, item}) => {
  return (
    <View>
      <View style={styles.titleContainer}>
        <TextInter style={styles.title}>Berita Untukmu</TextInter>
      </View>
      <Gap height={8} />
      <View style={styles.categoriesWrapper}>
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            horizontal
            renderItem={({item, index}) => (
              <TextInter style={styles.categories} key={index}>
                {item}
              </TextInter>
            )}
          />
          <Pressable onPress={() => canalModalRef.current?.present()}>
            <IcPlus />
          </Pressable>
        </View>
      </View>
      <Gap height={4} />
      {item?.map((item, i) => (
        <Card item={item} key={i} />
      ))}
      <More />
    </View>
  );
};

export default NewsForYou;

const styles = StyleSheet.create({
  titleContainer: {
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto',
    color: theme.colors.MPGrey2,
    fontWeight: '700',
    marginLeft: 16,
  },
  categoriesWrapper: {
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categories: {
    marginHorizontal: 8,
    marginVertical: 5,
    fontFamily: theme.fonts.inter.semiBold,
    fontSize: 10,
    color: theme.colors.grey1,
  },
});
