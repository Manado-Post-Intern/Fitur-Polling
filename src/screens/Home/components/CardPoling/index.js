import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Card, Text} from '@rneui/themed';
import RNPoll from 'react-native-poll';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CardPoling = () => {
  const [choices, setChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const userId = auth().currentUser.uid;

  // Fetch data from Firebase Realtime Database
  useEffect(() => {
    const fetchCandidatesAndUserVote = async () => {
      // Fetch candidates
      const snapshot = await database()
        .ref('/polling/candidates')
        .once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedChoices = Object.keys(data).map((key, index) => ({
          id: index + 1,
          choice: key,
          votes: data[key].votes,
        }));
        setChoices(formattedChoices);

        // Fetch user's vote if they have already voted
        const storedVote = await AsyncStorage.getItem(`@vote_${userId}`);
        console.log('Stored vote from AsyncStorage:', storedVote);

        if (storedVote) {
          const selected = formattedChoices.find(
            choice => choice.choice === storedVote,
          );
          if (selected) {
            setSelectedChoice(selected.id);
            setHasVoted(true);
          }
        }
      }
    };

    fetchCandidatesAndUserVote();
  }, [refreshKey, userId]);

  const handleChoicePress = async choice => {
    if (!hasVoted) {
      setSelectedChoice(choice.id);
      setHasVoted(true);
      setChoices(prevChoices =>
        prevChoices.map(c =>
          c.id === choice.id ? {...c, votes: c.votes + 1} : c,
        ),
      );

      // Increment the vote count in the database using a transaction
      await database()
        .ref(`/polling/candidates/${choice.choice}/votes`)
        .transaction(votes => {
          return (votes || 0) + 1;
        });

      // Store the user's vote in the subcollection
      await database()
        .ref(`/polling/votes/${userId}`)
        .set({userId, choice: choice.choice});

      // Store the vote in AsyncStorage
      await AsyncStorage.setItem(`@vote_${userId}`, choice.choice);
    }
  };

  const handleCancelVote = async () => {
    if (selectedChoice !== null) {
      const previousChoice = choices.find(c => c.id === selectedChoice);
      if (previousChoice) {
        // Decrease the vote count of the previous choice using a transaction
        await database()
          .ref(`/polling/candidates/${previousChoice.choice}/votes`)
          .transaction(votes => {
            return (votes || 0) - 1;
          });

        // Remove user's vote from the subcollection
        await database().ref(`/polling/votes/${userId}`).remove();

        // Update local state to reflect the vote reduction
        setChoices(prevChoices =>
          prevChoices.map(c =>
            c.id === selectedChoice ? {...c, votes: c.votes - 1} : c,
          ),
        );
      }
    }
    await AsyncStorage.removeItem(`@vote_${userId}`);
    setSelectedChoice(null);
    setHasVoted(false);
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <Card
      key={refreshKey}
      containerStyle={{
        borderRadius: 10,
        backgroundColor: '#ffff',
      }}>
      <Card.Title style={styles.cardTitle}>
        Poling Calon Gubernur {'\n'}Sulawesi Utara 2024-2029
      </Card.Title>
      <RNPoll
        totalVotes={choices.reduce((total, choice) => total + choice.votes, 0)}
        choices={choices}
        choiceTextStyle={styles.choiceTextStyle}
        fillBackgroundColor="rgba(108, 184, 249, 1)"
        onChoicePress={handleChoicePress}
        borderColor="#56A4EB"
        pollContainerStyle={styles.pollContainer}
        selectedChoiceId={selectedChoice} // Ensure this is set correctly
        style={styles.poll}
      />
      {hasVoted && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleCancelVote}
            style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Ganti Pilihan</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

export default CardPoling;

const styles = StyleSheet.create({
  cardTitle: {
    color: '#6496c2',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  choiceTextStyle: {
    color: '#373737',
  },
  pollContainer: {
    borderRadius: 10,
    padding: 5,
    marginTop: -15,
  },
  poll: {
    borderRadius: 10,
    padding: 15,
  },
  buttonContainer: {
    marginTop: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#054783',
    paddingVertical: 12,
    paddingHorizontal: 115,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
