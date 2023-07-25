import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import React from 'react';
import {IMGMPText, IMGMPTextPrimary, IcBack, theme} from '../../assets';
import {Button, TextInter} from '../../components';
import {Input} from '../Marketplace/components';

const WriteNews = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <IcBack />
          <Image
            source={IMGMPTextPrimary}
            style={{
              resizeMode: 'contain',
              width: 130,
              // height: 50,
              // backgroundColor: 'red',
            }}
          />
        </View>

        <View>
          <Button
            onPress={() => navigation.navigate('ChannelTagSelection')}
            label={'Selanjutnya'}
            style={{paddingHorizontal: 15, height: 40}}
          />
        </View>
      </View>

      <View style={{flex: 1, paddingVertical: 20, paddingHorizontal: 30}}>
        <Input placeholder={'Judul Berita'} />

        <View style={styles.browseContainer}>
          {/* {!data.adsImage ? ( */}
          <Pressable
            style={styles.browseButton}
            // onPress={handleImageSelect}
          >
            <TextInter style={styles.browseLabel}>browse picture</TextInter>
          </Pressable>
          {/* ) : (
            <>
              <Image
                source={{
                  uri: data.adsImage,
                }}
                style={{
                  resizeMode: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setData({...data, adsImage: ''})}
                style={{
                  backgroundColor: theme.colors.errorRed,
                  position: 'absolute',
                  top: 13,
                  right: 13,
                  paddingHorizontal: 13,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}>
                <Text
                  style={{
                    fontSize: 20,
                    color: 'white',
                    fontFamily: theme.fonts.inter.semiBold,
                  }}>
                  X
                </Text>
              </TouchableOpacity>
            </>
          )} */}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.linkInput}
            placeholder={'Isi Berita'}
            multiline
            placeholderTextColor="#617D9780"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WriteNews;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 15,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.43,
    shadowRadius: 9.51,
    elevation: 15,
  },
  browseContainer: {
    borderRadius: 8,
    width: '100%',
    backgroundColor: '#E2E6EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    height: 130,
    marginVertical: 10,
  },
  browseButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.grey1,
  },
  browseLabel: {
    color: theme.colors.fontLight,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#DFE8F566',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9E9E9',
    paddingRight: 10,
    flex: 1,
  },
  linkInput: {
    color: '#617D97',
    flex: 1,
    // backgroundColor: 'red',
  },
});
