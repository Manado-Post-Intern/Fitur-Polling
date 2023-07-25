import {Image, LogBox, ScrollView, StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  IMGDummyHighlight,
  IMGDummyNews,
  IMGGodStatue,
  IMGLogoMinahasa,
  IMGMPTextPrimary,
  IMGYourAds,
  theme,
} from '../../assets';
import {
  Actions,
  BackButton,
  CategoryHorizontal,
  Gap,
  More,
  TextInter,
  TimeStamp,
} from '../../components';
import {screenHeightPercentage, screenWidth} from '../../utils';
import {Card} from '../Home/components/NewsForYou/components';
import {Card as TrendingCard} from '../Trending/components';
import {loadSession, popular, readArticle} from '../../api';
import axios from 'axios';
import RenderHtml from 'react-native-render-html';

LogBox.ignoreLogs([
  'You should always pass contentWidth',
  'No source prop was provided. Nothing will be rendered',
]);

// const related = [0, 1, 2];
// const trending = [0, 1, 2, 3, 4];

const Article = ({route}) => {
  const {articleId} = route.params;
  const [token, setToken] = useState(null);
  const [article, setArticle] = useState(null);
  const [trending, setTrending] = useState(null);

  const getArticle = async () => {
    try {
      const response = await axios.get(readArticle, {
        headers: {
          Accept: 'application/vnd.promedia+json; version=1.0',
          Authorization: `Bearer ${token}`,
        },
        params: {id: articleId},
      });
      setArticle(response.data.data.detail);
    } catch (error) {
      console.log(error);
    }
  };

  const getTrending = async () => {
    try {
      const response = await axios.get(popular, {
        headers: {
          Accept: 'application/vnd.promedia+json; version=1.0',
          Authorization: `Bearer ${token}`,
        },
      });
      setTrending(response.data.data.list);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (token) {
      getArticle();
      getTrending();
    }
  }, [token]);

  useEffect(() => {
    loadSession()
      .then(session => {
        if (session) {
          setToken(session.access_token);
        }
      })
      .catch(error => {
        console.log(error);
      });
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.backButtonContainer}>
        <BackButton />
      </View>
      <Image style={styles.image} source={{uri: article?.photo_url}} />
      <View style={styles.innerContainer}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.articleContainer}>
            <Image style={styles.mp} source={IMGMPTextPrimary} />
            <TextInter
              style={{fontSize: 24, fontFamily: theme.fonts.inter.semiBold}}>
              {article?.title}
            </TextInter>
            <Gap height={7} />
            <TimeStamp data={article?.published_date} />
            <Gap height={7} />
            {article?.author.map((item, index) => {
              return (
                <View style={styles.authorContainer} key={index}>
                  <View style={styles.authorImageContainer}>
                    {item?.photo && (
                      <Image
                        style={styles.authorImage}
                        source={{uri: item.photo}}
                      />
                    )}
                  </View>
                  <Gap width={4} />
                  <TextInter style={styles.authorName}>{item.name}</TextInter>
                </View>
              );
            })}
            <View style={styles.articleTextContainer}>
              <RenderHtml
                baseStyle={{color: 'black'}}
                source={{html: article?.content}}
              />
              <Gap height={10} />
              <TextInter style={styles.tagTerkait}>Tag Terkait</TextInter>
              <Gap height={10} />
              <CategoryHorizontal categories={article?.tag} />
            </View>
          </View>

          <Gap height={16} />

          <Image style={styles.ads} source={IMGYourAds} />

          {article?.related.length !== 0 && (
            <View style={styles.sectionTitleContainer}>
              <TextInter style={styles.sectionTitle}>Related News</TextInter>
            </View>
          )}
          {article?.related?.map((item, i) => (
            <Card key={i} item={item} />
          ))}

          <View style={styles.sectionTitleContainer}>
            <TextInter style={styles.sectionTitle}>Trending</TextInter>
          </View>
          {trending?.slice(0, 5).map((item, i) => (
            <TrendingCard key={i} item={item} />
          ))}
          <More trending />
          <Gap height={320} />
        </ScrollView>
      </View>
      {/* <View style={styles.actionContainer}>
        <Actions border={false} type="big" />
      </View> */}
    </View>
  );
};

export default Article;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: screenHeightPercentage('5%'),
    left: 25,
    zIndex: 50,
  },
  image: {
    width: '100%',
    height: 300,
  },
  innerContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    overflow: 'hidden',
    zIndex: 10,
  },
  scrollView: {
    backgroundColor: theme.colors.MPWhite2,
  },
  articleContainer: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderRadius: 24,
  },
  mp: {
    width: 139,
    resizeMode: 'contain',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImageContainer: {
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
  },
  authorImage: {
    width: 20,
    height: 20,
    borderRadius: 20,
  },
  authorName: {
    fontFamily: theme.fonts.inter.semiBold,
    fontSize: 14,
    color: theme.colors.MPBlue0,
  },

  articleTextContainer: {
    padding: 10,
  },
  articleText: {
    fontSize: 16,
    color: '#232324',
    lineHeight: 24,
  },
  tagTerkait: {
    fontSize: 14,
    color: theme.colors.MPBlue1,
  },

  ads: {
    width: screenWidth(),
    resizeMode: 'contain',
    height: 100,
  },

  sectionTitleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 24,
  },
  sectionTitle: {
    fontFamily: theme.fonts.inter.bold,
    fontSize: 24,
    color: theme.colors.MPGrey2,
  },

  actionContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: theme.colors.white,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    zIndex: 20,
  },
});
