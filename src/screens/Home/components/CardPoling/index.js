import {StyleSheet, View, TouchableOpacity, Alert} from 'react-native';
import React, {useEffect, useState, useCallback, useRef} from 'react';
import {Card, Text} from '@rneui/themed';
import RNPoll from 'react-native-poll';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
const POLL_STORAGE_KEY = '@poll_data';
const CardPoling = () => {
  const [pollData, setPollData] = useState({
    totalVotes: 0,
    options: [
      {text: 'Drs. Steven Kandouw ', votes: 2},
      {text: 'Dr. Elly Engelbert Lasut, M.E', votes: 3},
      {text: 'Mayjen TNI (Purn.) Yulius Lumbaa', votes: 1},
      {text: 'Calon Lain', votes: 2},
    ],
    hasVoted: false,
    selectedOption: null,
  });

  useEffect(() => {
    const loadPollData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(POLL_STORAGE_KEY);
        if (savedData) {
          setPollData(JSON.parse(savedData));
        }
      } catch (error) {
        console.log('Error loading poll data:', error);
      }
    };
    loadPollData();
  }, []);

  useEffect(() => {
    const savePollData = async () => {
      try {
        await AsyncStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(pollData));
      } catch (error) {
        console.log('Error saving poll data:', error);
      }
    };
    if (pollData.hasVoted) {
      savePollData();
    }
  }, [pollData]);

  const handleVote = index => {
    if (!pollData.hasVoted) {
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

  const calculatePercentage = votes => {
    if (pollData.totalVotes === 0) {
      return 0;
    }
    return (votes / pollData.totalVotes) * 100;
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
            if (pollData.selectedOption !== null) {
              newOptions[pollData.selectedOption].votes -= 1;
            }

            setPollData({
              ...pollData,
              options: newOptions,
              hasVoted: false,
              selectedOption: null,
              totalVotes: pollData.totalVotes - 1,
            });

            try {
              await AsyncStorage.removeItem(POLL_STORAGE_KEY);
              console.log('Polling data cleared from storage');
            } catch (error) {
              console.log('Error clearing poll data:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.cardContainer}>
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
                {width: `${calculatePercentage(option.votes)}%`},
              ]}
            />
          )}
        </TouchableOpacity>
      ))}
      {pollData.hasVoted && (
        <View style={styles.buttonContainer}>
          <Text style={styles.voteInfo}>
            Kamu sudah memilih: {pollData.options[pollData.selectedOption].text}
          </Text>
          <TouchableOpacity
            onPress={handleChangeVote}
            style={styles.changeButton}>
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
  optionContainer: {
    marginVertical: 10,
    backgroundColor: '#9FC0DE',
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectedOptionContainer: {
    borderColor: '#fff',
    borderWidth: 2,
  },
  optionContent: {
    padding: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  optionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#5a82a6',
    zIndex: 1,
  },
  percentageText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  voteInfo: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
  },
  changeButton: {
    marginTop: 15,
    backgroundColor: '#3b5998',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  changeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
