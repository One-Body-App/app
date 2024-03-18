import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './connectPortalStyles';

type types = 'Explore' | 'My Places';

function People() {
  const [selectedOption, setSelectedOption] = useState<types>('Explore');

  return (
    <View>
      <Text style={styles.header}>People/Places</Text>

      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={[styles.option, selectedOption === 'Explore' && styles.selectedOption]}
          onPress={() => setSelectedOption('Explore')}
        >
          <Text>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, selectedOption === 'My Places' && styles.selectedOption]}
          onPress={() => setSelectedOption('My Places')}
        >
          <Text>My Places</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default People;
