import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get, set } from "firebase/database";
import { auth, realtimeDb } from "../firebase/config";

export const defaultSettings = {
  tankCapacity: "500",
  volumeUnit: "L",
  defaultTargetLevel: 80,
  lowLevelThreshold: 25,
  autoPumpControl: true,
  overflowProtection: true,
  turbidityMonitoring: true,
  qualityAlerts: true,
  tankFullAlerts: true,
  lowWaterAlerts: true,
  pumpSafetyTimeout: "10 min",
  theme: "dark",
};

let listeners = [];

export const subscribeSettingsChange = (callback) => {
  listeners.push(callback);

  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
  };
};

const notifySettingsChange = (settings) => {
  listeners.forEach((callback) => callback(settings));
};

const getUserSettingsRef = () => {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  return ref(realtimeDb, `users/${user.uid}/settings`);
};

export const saveSettings = async (settings) => {
  const finalSettings = {
    ...defaultSettings,
    ...settings,
  };

  await AsyncStorage.setItem(
    "hydrotrack_settings",
    JSON.stringify(finalSettings)
  );

  const settingsRef = getUserSettingsRef();

  if (settingsRef) {
    await set(settingsRef, finalSettings);
  }

  notifySettingsChange(finalSettings);
};

export const getSettings = async () => {
  const settingsRef = getUserSettingsRef();

  if (settingsRef) {
    const snapshot = await get(settingsRef);

    if (snapshot.exists()) {
      const firebaseSettings = {
        ...defaultSettings,
        ...snapshot.val(),
      };

      await AsyncStorage.setItem(
        "hydrotrack_settings",
        JSON.stringify(firebaseSettings)
      );

      return firebaseSettings;
    }
  }

  const saved = await AsyncStorage.getItem("hydrotrack_settings");

  if (saved) {
    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    };
  }

  return defaultSettings;
};

export const resetSettings = async () => {
  await AsyncStorage.setItem(
    "hydrotrack_settings",
    JSON.stringify(defaultSettings)
  );

  const settingsRef = getUserSettingsRef();

  if (settingsRef) {
    await set(settingsRef, defaultSettings);
  }

  notifySettingsChange(defaultSettings);
  return defaultSettings;
};