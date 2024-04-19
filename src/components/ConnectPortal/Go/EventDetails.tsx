import React, { useState } from 'react';
import {
  View,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCalendar,
  faClock,
  faMapMarker,
  faArrowsTurnRight,
  faSave,
  faCloud,
  faLink,
} from '@fortawesome/free-solid-svg-icons';
import { styles } from '../connectPortalStyles';
import StyledText from '../../styled/Text';

interface EventDetailsProps {
  route: {
    params: {
      event: {
        name: string;
        date: Date;
        hour: string;
        location: string;
        imageSource: ImageSourcePropType;
      };
    };
  };
}

function EventDetails({ route }: EventDetailsProps) {
  const { event } = route.params;

  const [selectedOption, setSelectedOption] = useState<'direction' | 'save' | null>(null);

  const handleOptionSelect = (option: 'direction' | 'save') => {
    setSelectedOption(option === selectedOption ? null : option);
  };

  return (
    <View style={styles.container}>
      <View style={styles.organizationCard}>
        <View>
          <Image source={event.imageSource} style={styles.organizationImage} />
        </View>
        <View style={styles.organizationInfo}>
          <StyledText style={styles.organizationName}>{event.name}</StyledText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faCalendar} size={16} style={styles.typeIcon} />
            <StyledText style={styles.organizationInfo}>
              {event.date.toLocaleDateString()}
            </StyledText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faClock} size={16} style={styles.typeIcon} />
            <StyledText style={styles.organizationInfo}>{event.hour}</StyledText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faMapMarker} size={16} style={styles.typeIcon} />
            <StyledText style={styles.organizationInfo}>{event.location}</StyledText>
          </View>
        </View>
      </View>
      <View style={LocalStyle.buttonContainer}>
        <TouchableOpacity
          style={[LocalStyle.button, selectedOption === 'direction' && LocalStyle.buttonActive]}
          onPress={() => handleOptionSelect('direction')}
        >
          <FontAwesomeIcon icon={faArrowsTurnRight} size={16} style={LocalStyle.buttonIcon} />
          <StyledText
            style={[
              LocalStyle.buttonText,
              selectedOption === 'direction' && LocalStyle.buttonTextActive,
            ]}
          >
            Direction
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[LocalStyle.button, selectedOption === 'save' && LocalStyle.buttonActive]}
          onPress={() => handleOptionSelect('save')}
        >
          <FontAwesomeIcon icon={faSave} size={16} style={LocalStyle.buttonIcon} />
          <StyledText
            style={[
              LocalStyle.buttonText,
              selectedOption === 'save' && LocalStyle.buttonTextActive,
            ]}
          >
            Save
          </StyledText>
        </TouchableOpacity>
      </View>
      <View style={LocalStyle.infoContainer}>
        <View style={LocalStyle.infoBoxContainer}>
          <View style={LocalStyle.infoBox}>
            <StyledText style={[LocalStyle.infoText]}>POSTED BY</StyledText>
          </View>
        </View>

        <View style={LocalStyle.infoBoxContainer}>
          <View style={LocalStyle.infoBox}>
            <FontAwesomeIcon icon={faCloud} size={16} style={LocalStyle.infoIcon} />
            <StyledText style={LocalStyle.infoText}>24°C</StyledText>
            <StyledText style={LocalStyle.infoText}> Rain</StyledText>
          </View>
        </View>
      </View>

      <View style={LocalStyle.container}>
        <ScrollView>
          <View style={LocalStyle.infoBoxWithBorder}>
            <StyledText style={LocalStyle.infoTitle}>STATUS</StyledText>
            <StyledText>Open</StyledText>
          </View>
          <View style={LocalStyle.infoBoxWithBorder}>
            <StyledText style={LocalStyle.infoTitle}>ABOUT</StyledText>
            <StyledText>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dis sed ullamcorper malesuada
              lobortis. Dui id eu ipsum ultrices.
            </StyledText>
          </View>
          <View style={LocalStyle.infoBoxWithBorder}>
            <StyledText style={LocalStyle.infoTitle}>EVENT TYPE</StyledText>
            <StyledText>Conference</StyledText>
          </View>
          <View style={[LocalStyle.infoBoxWithBorder, LocalStyle.linkContainer]}>
            <StyledText style={LocalStyle.infoTitle}>BOOKING URL</StyledText>
            <View style={LocalStyle.linkContent}>
              <FontAwesomeIcon icon={faLink} size={16} style={LocalStyle.infoIcon} />
              <StyledText style={LocalStyle.linkText}>
                https://nickcrawford.com/booking/easter
              </StyledText>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const LocalStyle = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f2f2',
    borderRadius: 25,
    paddingHorizontal: 60,
    paddingVertical: 15,
    marginHorizontal: 5,
    marginLeft: 10,
  },
  buttonActive: {
    backgroundColor: '#126B87',
  },
  buttonTextActive: {
    color: 'white',
  },
  buttonIcon: {
    color: 'black',
    marginRight: 5,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  infoBox: {
    flexDirection: 'row',
    marginTop: 10,
  },
  infoBoxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: '#f3f2f2',
    paddingHorizontal: 60,
    paddingVertical: 30,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  infoIcon: {
    color: 'black',
    marginRight: 5,
  },
  infoText: {
    fontSize: 16,
  },
  postedByText: {
    fontWeight: 'bold',
    color: '#126B87',
  },
  infoBoxWithBorder: {
    borderColor: '#f2f3f3',
    borderWidth: 1,
    backgroundColor: 'white',
    padding: 40,
    marginBottom: 10,
    borderRadius: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  linkText: {
    fontWeight: 'bold',
    color: '#126B87',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default EventDetails;
