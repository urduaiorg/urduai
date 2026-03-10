// analytics.js
// import analytics from '@react-native-firebase/analytics';
const analytics = () => ({ setAnalyticsCollectionEnabled: async () => { }, logEvent: async () => { }, setUserProperty: async () => { }, setUserId: async () => { }, logScreenView: async () => { } });
import { Platform } from 'react-native';

export const initializeAnalytics = async () => {
  try {
    await analytics().setAnalyticsCollectionEnabled(true);
    return true;
  } catch (error) {
    return false;
  }
};

export const logEvent = async (eventName, parameters = {}) => {
  try {
    await analytics().logEvent(eventName, {
      ...parameters,
      platform: Platform.OS,
      app_version: '3.0.8',
    });
  } catch (error) {
    // silent
  }
};

export const setUserProperty = async (name, value) => {
  try {
    await analytics().setUserProperty(name, String(value));
  } catch (error) {
    // silent
  }
};

export const setUserId = async (userId) => {
  try {
    await analytics().setUserId(userId);
  } catch (error) {
    // silent
  }
};

export const logScreenView = async (screenName, screenClass) => {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch (error) {
    // silent
  }
};

export default { initializeAnalytics, logEvent, setUserProperty, setUserId, logScreenView };
