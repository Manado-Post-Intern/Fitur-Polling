/* eslint-disable prettier/prettier */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import {IcGanti, theme} from '../../../../assets';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [title, setTitle] = useState('');

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

  const loadCandidates = useCallback(async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        setUserId(currentUser.uid);
      }

      // Fetch title
      const titleSnapshot = await database().ref('polling/title').once('value');
      setTitle(titleSnapshot.val());

      // Fetch candidates
      const candidateSnapshot = await database()
        .ref('polling/candidates')
        .once('value');
      const candidates = candidateSnapshot.val();

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

      options.sort((a, b) => {
        if (a.text === 'Lainnya') {
          return 1;
        }
        if (b.text === 'Lainnya') {
          return -1;
        }
        return a.text.localeCompare(b.text);
      });

      const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

      setPollData(prevState => ({
        ...prevState,
        options,
        totalVotes,
      }));

      // Check user vote
      if (currentUser) {
        const userVoteSnapshot = await database()
          .ref(`polling/users/${currentUser.uid}`)
          .once('value');
        if (userVoteSnapshot.exists()) {
          const userVoteData = userVoteSnapshot.val();
          const selectedOption = options.findIndex(
            option => option.text === userVoteData.selectedCandidate,
          );

          setPollData(prevState => ({
            ...prevState,
            hasVoted: true,
            selectedOption,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading candidates or user data:', error);
    }
  }, []);

  useEffect(() => {
    loadCandidates();

    const candidateRef = database().ref('polling/candidates');
    const userVoteRef = database().ref(`polling/users/${userId}`);

    const candidateListener = candidateRef.on('value', loadCandidates);
    const userVoteListener = userVoteRef.on('value', loadCandidates);

    return () => {
      candidateRef.off('value', candidateListener);
      userVoteRef.off('value', userVoteListener);
    };
  }, [loadCandidates, userId]);

  const handleVote = async index => {
    if (!pollData.hasVoted && userId) {
      try {
        const userVoteRef = database().ref(`polling/users/${userId}`);
        const candidateRef = database().ref(
          `polling/candidates/${pollData.options[index].text}`,
        );

        await database().runTransaction(async transaction => {
          const userVoteSnapshot = await transaction.get(userVoteRef);
          const candidateSnapshot = await transaction.get(candidateRef);

          if (userVoteSnapshot.exists()) {
            return;
          }

          const currentVotes = candidateSnapshot.child('votes').val() || 0;
          transaction.update(candidateRef, {votes: currentVotes + 1});
          transaction.set(userVoteRef, {
            selectedCandidate: pollData.options[index].text,
          });
        });

        await loadCandidates();
      } catch (error) {
        console.error('Error while voting:', error);
        Alert.alert('Error', 'Failed to submit your vote. Please try again.');
      }
    } else if (pollData.hasVoted) {
      Alert.alert('Anda sudah memberikan suara sebelumnya.');
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
            try {
              const prevSelectedOption = pollData.selectedOption;
              if (prevSelectedOption !== null) {
                const previousCandidate =
                  pollData.options[prevSelectedOption].text;
                const candidateRef = database().ref(
                  `polling/candidates/${previousCandidate}`,
                );
                const userVoteRef = database().ref(`polling/users/${userId}`);

                await database().runTransaction(async transaction => {
                  const candidateSnapshot = await transaction.get(candidateRef);
                  const currentVotes =
                    candidateSnapshot.child('votes').val() || 0;
                  transaction.update(candidateRef, {
                    votes: Math.max(0, currentVotes - 1),
                  });
                  transaction.remove(userVoteRef);
                });

                await loadCandidates();
                await AsyncStorage.removeItem(POLL_STORAGE_KEY);
              }
            } catch (error) {
              console.error('Error while changing vote:', error);
              Alert.alert(
                'Error',
                'Failed to change your vote. Please try again.',
              );
            }
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCandidates();
    setIsRefreshing(false);
  };
  return (
    <View style={styles.cardContainer}>
      <Gap height={8} />
      <Text style={styles.title}>{title}</Text>
      <Gap height={16} />
      {pollData.options.map((option, index) => (
        <TouchableOpacity
          key={option.text}
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
            <IcGanti />
            <Text style={styles.changeButtonText}>Ganti Pilihan</Text>
          </TouchableOpacity>
          <Gap height={24} />
        </View>
      )}
      <TouchableOpacity
        onPress={handleRefresh}
        style={styles.refreshButton}
        disabled={isRefreshing}>
        <Text style={styles.refreshButtonText}>
          {isRefreshing ? 'Memperbarui...' : 'Perbarui Data'}
        </Text>
      </TouchableOpacity>
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

    paddingVertical: '3%',
    paddingHorizontal: '15%',
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  changeButtonText: {
    backgroundColor: '#92CBFF',
    fontWeight: '500',
    fontSize: 16,
    paddingHorizontal: '5%',
    fontFamily: theme.fonts.inter.semiBold,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: '#344ab9',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
