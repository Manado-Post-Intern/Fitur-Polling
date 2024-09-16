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
      {text: 'Drs. Steven Kandouw ', votes: 0},
      {text: 'Dr. Elly Engelbert Lasut, M.E', votes: 0},
      {text: 'Mayjen TNI (Purn.) Yulius Lumbaa', votes: 0},
      {text: 'Calon Lain', votes: 0},
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
      return '0%';
    }
    return `${((votes / pollData.totalVotes) * 100).toFixed(1)}%`;
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
    <View style={styles.container}>
      {pollData.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleVote(index)}
          disabled={pollData.hasVoted}
          style={styles.optionContainer}>
          <Text style={styles.optionText}>{option.text}</Text>
          {pollData.hasVoted && (
            <View style={styles.resultContainer}>
              <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={[
                  styles.resultBar,
                  {width: calculatePercentage(option.votes)},
                ]}
              />
              <Text style={styles.percentageText}>
                {calculatePercentage(option.votes)}
              </Text>
            </View>
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
  container: {
    padding: 20,
  },
  optionContainer: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 10,
    height: 20,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  resultBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  percentageText: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    textAlignVertical: 'center',
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
