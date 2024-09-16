import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const POLL_STORAGE_KEY = '@polling_result';

const CardPoling = () => {
  const [pollData, setPollData] = useState({
    totalVotes: 0,
    options: [
      {text: 'Steven Kandouw ', votes: 2},
      {text: 'Elly Lasut', votes: 3},
      {text: 'Yulius Lumbaa', votes: 1},
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
        } else {
          // Jika tidak ada data tersimpan, inisialisasi dengan data awal
          const initialData = {
            ...pollData,
            totalVotes: pollData.options.reduce(
              (sum, option) => sum + option.votes,
              0,
            ),
          };
          await AsyncStorage.setItem(
            POLL_STORAGE_KEY,
            JSON.stringify(initialData),
          );
          setPollData(initialData);
        }
      } catch (error) {
        console.log('Error loading poll data:', error);
      }
    };
    loadPollData();
  }, []);
  const resetPollData = async () => {
    const initialData = {
      totalVotes: 8, // 2 + 3 + 1 + 2
      options: [
        {text: 'Steven Kandouw ', votes: 2},
        {text: 'Elly Lasut', votes: 3},
        {text: 'Yulius Lumbaa', votes: 1},
        {text: 'Calon Lain', votes: 2},
      ],
      hasVoted: false,
      selectedOption: null,
    };

    try {
      await AsyncStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(initialData));
      setPollData(initialData);
      Alert.alert('Sukses', 'Data polling telah direset.');
    } catch (error) {
      console.log('Error resetting poll data:', error);
      Alert.alert('Error', 'Gagal mereset data polling.');
    }
  };
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
          <TouchableOpacity
            onPress={handleChangeVote}
            style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Ganti Pilihan</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={resetPollData} style={styles.resetButton}>
        <Text style={styles.resetButtonText}>Reset Data Polling</Text>
      </TouchableOpacity> */}
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
