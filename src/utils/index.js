import {Dimensions} from 'react-native';

/**
 * receive percent in string format as a params (ex: '10%')
 */
export const screenHeightPercentage = percent => {
  return Dimensions.get('window').height * (parseFloat(percent) / 100.0);
};

/**
 * screen width value
 */
export const screenWidth = () => {
  return Dimensions.get('window').width;
};
