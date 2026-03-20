import * as Notifications from 'expo-notifications';

export const configureNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
};

export const requestNotificationPermissions = async () => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const result = await Notifications.requestPermissionsAsync();
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
};

export const scheduleReminder = async (date: Date, title: string, body: string) => {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
};

