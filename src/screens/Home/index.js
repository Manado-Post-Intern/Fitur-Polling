import {SafeAreaView, ScrollView, StyleSheet, View} from 'react-native';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {theme} from '../../assets';
import {Banner1, Banner2, Gap} from '../../components';
import {
  ActionSection,
  BottomBanner,
  FullBanner,
  Headlines,
  LatestNews,
  NewsForYou,
  SecondBanner,
  Story,
  TopBanner,
} from './components';
import {screenHeightPercentage} from '../../utils';
import CanalModal from './components/NewsForYou/components/CanalModal';
import axios from 'axios';
import {headline, latestEndPoint} from '../../api';
import {regionList} from '../../data';
import {AdsContext} from '../../context/AdsContext';
import {TokenContext} from '../../context/TokenContext';
import {checkUserPreferences} from '../../utils/checkUserPreferences';
import {AuthContext} from '../../context/AuthContext';
import moment from 'moment';
import {Card, Text, useTheme} from '@rneui/themed';
import RNPoll, {IChoice} from 'react-native-poll';
import RNAnimated from 'react-native-animated-component';
const data = [0, 1, 2];
const daerah = ['Manado', 'Minahasa Utara', 'Bitung', 'Tondano'];

const Home = ({navigation}) => {
  const {token} = useContext(TokenContext);
  const {mpUser} = useContext(AuthContext);
  const canalModalRef = useRef();
  const [headlines, setHeadlines] = useState(null);
  const [forYou, setForYou] = useState(null);
  // const [trending, setTrending] = useState(null);
  const [latest, setLatest] = useState(null);
  const [story, setStory] = useState(null);
  const {top, bottom, second, full} = useContext(AdsContext);

  const getHeadline = async () => {
    try {
      const response = await axios.get(headline, {
        headers: {
          Accept: 'application/vnd.promedia+json; version=1.0',
          Authorization: `Bearer ${token}`,
        },
      });
      setHeadlines(response.data.data.list);
    } catch (error) {
      console.log(error);
    }
  };
  // const getForYou = async () => {
  //   try {
  //     const response = await axios.get(editorPick, {
  //       headers: {
  //         Accept: 'application/vnd.promedia+json; version=1.0',
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     setForYou(response.data.data.list);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  const getLatest = async () => {
    try {
      const response = await axios.get(latestEndPoint, {
        headers: {
          Accept: 'application/vnd.promedia+json; version=1.0',
          Authorization: `Bearer ${token}`,
        },
      });
      setLatest(response.data.data.list.latest);
    } catch (error) {
      console.log(error);
    }
  };
  // const getTrending = async () => {
  //   try {
  //     const response = await axios.get(popular, {
  //       headers: {
  //         Accept: 'application/vnd.promedia+json; version=1.0',
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     setTrending(response.data.data.list);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  const getStory = async () => {
    const promises = regionList.map(async item => {
      const response = await axios.get(latestEndPoint, {
        headers: {
          Accept: 'application/vnd.promedia+json; version=1.0',
          Authorization: `Bearer ${token}`,
        },
        params: {page: 1, section_id: item.id},
      });
      let data = response.data.data.list.latest[0];
      data.region = item.name;
      data.icon = item.icon_url;
      return data;
    });

    try {
      const result = await Promise.all(promises);
      setStory(result);
    } catch (error) {
      console.log(error);
    }
  };

  const getForYouNews = async preference => {
    const promises = preference.map(async item => {
      const response = await axios.get(latestEndPoint, {
        headers: {
          Accept: 'application/vnd.promedia+json; version=1.0',
          Authorization: `Bearer ${token}`,
        },
        params: {page: 1, section_id: item.id},
      });
      const data = response.data.data.list.latest;
      return data;
    });

    try {
      const result = await Promise.all(promises);
      const array = result.flat();
      setForYou({preferences: preference, array});
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (token) {
      getHeadline();
      // getForYou();
      // getTrending();
      getLatest();
      getStory();
      // getReferenceSite();
    }
  }, [token]);

  useEffect(() => {
    if (mpUser && token) {
      checkUserPreferences(mpUser)
        .then(res => {
          const preferences = [];
          if (res.channel && Array.isArray(res.channel)) {
            preferences.push(...res.channel);
          }

          if (res.region && Array.isArray(res.region)) {
            preferences.push(...res.region);
          }

          getForYouNews(preferences);
        })
        .catch(error => {
          if (error.message === 'User preferences not found') {
            // canalModalRef.current.present();
            navigation.navigate('ChooseCanal');
          } else {
            console.log(error);
          }
        });
    }
  }, [mpUser, token]);

  const choices: Array<IChoice> = [
    {id: 1, choice: 'Steven Kandouw Rita Tamuntuan', votes: 50},
    {id: 2, choice: 'Elly Lasut Mika Paruntu', votes: 50},
    {id: 3, choice: 'Yulius Lumbaa Victor Mailangkay', votes: 50},
    {id: 4, choice: 'Calon Lain', votes: 50},
  ];
  const CARD_BACKGROUND_COLOR = '#003CB0';
  return (
    <SafeAreaView style={styles.safeAreaView}>
      <View style={styles.container}>
        <ScrollView style={styles.bodyContainer}>
          <Gap height={36} />

          <Story item={story} />

          <Gap height={12} />

          <ActionSection preferences={mpUser?.preferences} />
          <Gap height={12} />
          {top && <TopBanner item={top} />}

          <Gap height={12} />
          <Card
            containerStyle={{
              borderRadius: 10,
              backgroundColor: CARD_BACKGROUND_COLOR,
            }}>
            <Card.Title style={styles.cardTitle}>
              {' '}
              Poling Calon Gubernur Sulawesi Utara 2024-2029
            </Card.Title>
            <RNPoll
              totalVotes={100}
              choices={choices}
              fillBackgroundColor="#bfdcf6"
              onChoicePress={(selectedChoice: IChoice) =>
                console.log('SelectedChoice: ', selectedChoice)
              }
              style={styles.poll}
            />
          </Card>
          <Headlines data={headlines} />

          <Gap height={12} />

          {second && <SecondBanner item={second} />}

          <Gap height={12} />

          <NewsForYou
            canalModalRef={canalModalRef}
            item={forYou?.array.sort((a, b) =>
              moment(b.published_date).diff(moment(a.published_date)),
            )}
            preferences={forYou?.preferences}
          />

          <Gap height={25} />
          <Banner2 />

          <LatestNews item={latest} />

          <Gap height={12} />

          {/* <TrendingSection item={trending} /> */}
          {bottom && <BottomBanner item={bottom} />}

          <Gap height={12} />

          {full && <FullBanner item={full} />}

          <Banner1 />

          {/* <MPDigital />

          <Gap height={12} />

          {data.map((item, i) => (
            <CardNews key={i} />
          ))}

          <Gap height={12} />

          <MPNewspaper /> */}

          <Gap height={screenHeightPercentage('11%')} />
        </ScrollView>

        <CanalModal
          canalModalRef={canalModalRef}
          preferences={forYou?.preferences}
        />
      </View>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  container: {
    zIndex: 0,
    flex: 1,
    backgroundColor: theme.colors.white2,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  poll: {
    backgroundColor: '#003CB0',
    borderRadius: 10,
    padding: 5,
  },
  bodyContainer: {
    top: -20,
  },
});
