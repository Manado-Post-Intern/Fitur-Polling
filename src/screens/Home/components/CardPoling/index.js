import {StyleSheet, View, TouchableOpacity} from 'react-native';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {Card, Text, useTheme} from '@rneui/themed';
import RNPoll, {IChoice} from 'react-native-poll';
import RNAnimated from 'react-native-animated-component';
const CardPoling = () => {
  const initialChoices = [
    {id: 1, choice: 'Steven Kandouw', votes: 50},
    {id: 2, choice: 'Elly Lasut', votes: 50},
    {id: 3, choice: 'Yulius Lumbaa', votes: 50},
    {id: 4, choice: 'Calon Lain', votes: 50},
  ];
  const [choices, setChoices] = useState(initialChoices);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChoicePress = choice => {
    if (!hasVoted) {
      setSelectedChoice(choice.id);
      setHasVoted(true);
      setChoices(prevChoices =>
        prevChoices.map(c =>
          c.id === choice.id ? {...c, votes: c.votes + 1} : c,
        ),
      );
    }
  };
  const handleCancelVote = () => {
    setSelectedChoice(null);
    setHasVoted(false);
    setChoices(initialChoices);
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
        selectedChoiceId={selectedChoice}
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
