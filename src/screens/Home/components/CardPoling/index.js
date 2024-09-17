/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

const POLL_STORAGE_KEY = '@polling_result';

const CardPoling = () => {
  const [pollData, setPollData] = useState({
    totalVotes: 0,
    options: [],
    hasVoted: false,
    selectedOption: null,
  });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        // Authenticate and get the current user's ID
        const currentUser = auth().currentUser;
        if (currentUser) {
          setUserId(currentUser.uid);
        }

        // Load candidates from Firebase
        const snapshot = await database().ref('polling/candidates').once('value');
        const candidates = snapshot.val();

        const options = Object.keys(candidates).map(candidate => ({
          text: candidate,
          votes: candidates[candidate].votes,
        }));

        const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

        setPollData(prevState => ({
          ...prevState,
          options,
          totalVotes,
        }));

        // Check if the user has already voted by checking Firebase
        const userVoteSnapshot = await database().ref(`polling/users/${currentUser.uid}`).once('value');
        if (userVoteSnapshot.exists()) {
          const userVoteData = userVoteSnapshot.val();
          const selectedOption = options.findIndex(option => option.text === userVoteData.selectedCandidate);

          setPollData(prevState => ({
            ...prevState,
            hasVoted: true,
            selectedOption,
          }));
        }
      } catch (error) {
        console.error('Error loading candidates or user data:', error);
      }
    };

    loadCandidates();
  }, []);

  useEffect(() => {
    const savePollData = async () => {
      try {
        await AsyncStorage.setItem(POLL_STORAGE_KEY, JSON.stringify({
          hasVoted: pollData.hasVoted,
          selectedOption: pollData.selectedOption,
        }));

        if (pollData.hasVoted && pollData.selectedOption !== null) {
          const selectedCandidate = pollData.options[pollData.selectedOption].text;

          // Save the user vote to Firebase
          await database().ref(`polling/candidates/${selectedCandidate}/votes`).set(
            pollData.options[pollData.selectedOption].votes
          );

          // Save user voting record with userId and selected candidate
          await database().ref(`polling/users/${userId}`).set({
            selectedCandidate,
          });
        }
      } catch (error) {
        console.error('Error saving poll data:', error);
      }
    };

    savePollData();
  }, [pollData, userId]);

  const handleVote = index => {
    if (!pollData.hasVoted && userId) {
      const newOptions = [...pollData.options];
      newOptions[index].votes += 1;

      setPollData({
        ...pollData,
        options: newOptions,
        totalVotes: pollData.totalVotes + 1,
        hasVoted: true,
        selectedOption: index,
      });
    }
  };

  const handleChangeVote = () => {
    Alert.alert(
      'Ganti Pilihan',
      'Apakah Anda yakin ingin mengganti pilihan? Ini akan menghapus hasil polling Anda.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            const newOptions = [...pollData.options];
            const prevSelectedOption = pollData.selectedOption;

            if (prevSelectedOption !== null) {
              newOptions[prevSelectedOption].votes -= 1;

              const previousCandidate = newOptions[prevSelectedOption].text;

              // Update votes in Firebase
              await database().ref(`polling/candidates/${previousCandidate}/votes`).set(
                newOptions[prevSelectedOption].votes
              );

              // Remove the user vote record
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
      ]
    );
  };

  const calculatePercentage = votes => {
    if (pollData.totalVotes === 0) {
      return 0;
    }
    return (votes / pollData.totalVotes) * 100;
  };

  return (
    <View style={styles.cardContainer}>
      <View>
        <Text style={styles.title}>Polling</Text>
        <Text style={styles.subtitle}>
          Siapakah calon Gubernur Sulawesi Utara periode 2024-2029
        </Text>
      </View>
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
          ]}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionText}>{option.text}</Text>
            {pollData.hasVoted && (
              <Text style={styles.percentageText}>
                {`${calculatePercentage(option.votes).toFixed(1)}%`}
              </Text>
            )}
          </View>
          {pollData.hasVoted && (
            <View
              style={[
                styles.resultBar,
                { width: `${calculatePercentage(option.votes)}%` },
              ]}
            />
          )}
        </TouchableOpacity>
      ))}
      {pollData.hasVoted && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleChangeVote}
            style={styles.changeButton}
          >
            <Text style={styles.changeButtonText}>Ganti Pilihan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CardPoling;

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderColor: '#C1D8DD',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#6496C2',
  },
  subtitle: {
    fontSize: 16,
  },
  optionContainer: {
    marginVertical: 4,
    backgroundColor: '#9FC0DE',
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectedOptionContainer: {
    borderColor: '#fff',
    borderWidth: 2,
  },
  optionContent: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  resultBar: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 5,
    backgroundColor: '#5a82a6',
    zIndex: 1,
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 5,
    alignItems: 'center',
  },
  changeButton: {
    marginTop: 15,
    backgroundColor: '#054783',
    paddingVertical: 10,
    paddingHorizontal: '35%',
    borderRadius: 10,
  },
  changeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#ff4500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});