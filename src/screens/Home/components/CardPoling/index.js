/* eslint-disable prettier/prettier */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import {theme} from '../../../../assets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import {Gap} from '../../../../components';

const POLL_STORAGE_KEY = '@polling_result';

const CardPoling = () => {
  const [pollData, setPollData] = useState({
    totalVotes: 0,
    options: [],
    hasVoted: false,
    selectedOption: null,
  });
  const [userId, setUserId] = useState(null);
  const [title, setTitle] = useState('');
  const titleRef = database().ref('polling/title');
  titleRef.on('value', snapshot => {
    const fetchedTitle = snapshot.val();
    setTitle(fetchedTitle);
  });
  const fetchImageURL = async imageName => {
    try {
      const path = `images/polling/${imageName}`;
      console.log(`Fetching image from path: ${path}`);
      const url = await storage().ref(path).getDownloadURL();
      console.log(`Successfully fetched image URL for: ${imageName}`);
      return url;
    } catch (error) {
      console.error(`Error fetching image URL for ${imageName}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          setUserId(currentUser.uid);
        }

        // Mendapatkan data polling kandidat secara realtime
        const candidateRef = database().ref('polling/candidates');
        candidateRef.on('value', async snapshot => {
          const candidates = snapshot.val();

          const options = await Promise.all(
            Object.keys(candidates).map(async candidate => {
              const imageName =
                candidates[candidate].imageName || `${candidate}.png`;
              const imageUrl = await fetchImageURL(imageName);

              return {
                text: candidate,
                votes: candidates[candidate].votes,
                image: imageUrl,
              };
            }),
          );

          const totalVotes = options.reduce(
            (sum, option) => sum + option.votes,
            0,
          );

          setPollData(prevState => ({
            ...prevState,
            options,
            totalVotes,
          }));
        });

        // Mengecek data vote pengguna secara realtime
        const userVoteRef = database().ref(`polling/users/${currentUser.uid}`);
        userVoteRef.on('value', snapshot => {
          if (snapshot.exists()) {
            const userVoteData = snapshot.val();
            const selectedOption = pollData.options.findIndex(
              option => option.text === userVoteData.selectedCandidate,
            );

            setPollData(prevState => ({
              ...prevState,
              hasVoted: true,
              selectedOption,
            }));
          }
        });
      } catch (error) {
        console.error('Error loading candidates or user data:', error);
      }
    };

    loadCandidates();
  }, []);

  const handleVote = async index => {
    if (!pollData.hasVoted && userId) {
      const userVoteSnapshot = await database()
        .ref(`polling/users/${userId}`)
        .once('value');

      if (!userVoteSnapshot.exists()) {
        const newOptions = [...pollData.options];
        newOptions[index].votes += 1;

        await database()
          .ref(`polling/candidates/${newOptions[index].text}/votes`)
          .set(newOptions[index].votes);
        await database().ref(`polling/users/${userId}`).set({
          selectedCandidate: newOptions[index].text,
        });
        setPollData({
          ...pollData,
          options: newOptions,
          totalVotes: pollData.totalVotes + 1,
          hasVoted: true,
          selectedOption: index,
        });
      } else {
        Alert.alert('Anda sudah memberikan suara sebelumnya.');
      }
    }
  };

  const handleChangeVote = () => {
    Alert.alert(
      'Ganti Pilihan',
      'Apakah Anda yakin ingin mengganti pilihan? Ini akan menghapus hasil polling Anda.',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Ya',
          onPress: async () => {
            const newOptions = [...pollData.options];
            const prevSelectedOption = pollData.selectedOption;

            if (prevSelectedOption !== null) {
              newOptions[prevSelectedOption].votes -= 1;

              const previousCandidate = newOptions[prevSelectedOption].text;

              await database()
                .ref(`polling/candidates/${previousCandidate}/votes`)
                .set(newOptions[prevSelectedOption].votes);

              await database().ref(`polling/users/${userId}`).remove();
            }

            setPollData({
              ...pollData,
              options: newOptions,
              hasVoted: false,
              selectedOption: null,
              totalVotes: pollData.totalVotes - 1,
            });

            await AsyncStorage.removeItem(POLL_STORAGE_KEY);
          },
        },
      ],
    );
  };

  const calculatePercentage = votes => {
    if (pollData.totalVotes === 0) {
      return 0;
    }
    const percentage = (votes / pollData.totalVotes) * 100;
    return percentage >= 100 ? 98 : percentage;
  };

  return (
    <View style={styles.cardContainer}>
      <Gap height={8} />
      <Text style={styles.title}>{title}</Text>
      <Gap height={16} />
      {pollData.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleVote(index)}
          disabled={pollData.hasVoted}
          style={[
            styles.optionContainer,
            pollData.selectedOption === index && pollData.hasVoted
              ? styles.selectedOptionContainer
              : null,
          ]}>
          <View style={styles.optionContent}>
            <View style={styles.imageWrapper}>
              <Image
                source={{uri: option.image}}
                style={styles.candidateImage}
              />
            </View>
            <Text style={styles.optionText}>{option.text}</Text>
            {pollData.hasVoted && (
              <Text style={styles.percentageText}>
                {`${calculatePercentage(option.votes).toFixed(0.1)}%`}
              </Text>
            )}
          </View>
          {pollData.hasVoted && (
            <View
              style={[
                styles.resultBar,
                {width: `${calculatePercentage(option.votes)}%`},
              ]}
            />
          )}
        </TouchableOpacity>
      ))}
      {pollData.hasVoted && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleChangeVote}
            style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Ganti Pilihan</Text>
          </TouchableOpacity>
          <Gap height={24} />
        </View>
      )}
      <Gap height={8} />
    </View>
  );
};

export default CardPoling;

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderColor: '#C1D8DD',
    borderWidth: 1,
    backgroundColor: '#003CB0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 27,
    paddingVertical: 8,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#ffff',
    fontFamily: theme.fonts.inter.semiBold,
    textAlign: 'left',
  },
  optionContainer: {
    marginVertical: 4,
    backgroundColor: '#c1ddf7',
    borderRadius: 10,
    overflow: 'hidden',
    height: 60,
  },
  selectedOptionContainer: {
    borderColor: '#fff',
    borderWidth: 2,
  },
  optionContent: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    height: '115%',
  },
  imageWrapper: {
    position: 'absolute',
    left: 10,
  },
  candidateImage: {
    width: 86,
    height: 70,
  },
  optionText: {
    fontSize: 14,
    color: '#5088bb',
    marginLeft: '60%',
    flex: 1,
    fontFamily: theme.fonts.inter.semiBold,
  },
  resultBar: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    backgroundColor: 'rgba(0, 61, 176, 0.5)',
    zIndex: 2,
    borderRadius: 8,
    borderColor: '#fff',
    borderWidth: 1,
  },
  percentageText: {
    fontSize: 14,
    color: '#5087BB',
    fontWeight: 'bold',
    fontFamily: theme.fonts.inter.semiBold,
  },
  changeButton: {
    marginTop: 15,
    backgroundColor: '#92CBFF',
    paddingVertical: '3%',
    paddingHorizontal: '15%',
    borderRadius: 10,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#344ab9',
    fontWeight: '500',
    fontSize: 16,
    fontFamily: theme.fonts.inter.semiBold,
  },
});
