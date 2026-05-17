export const saveHistoryEvent = (eventText) => {
  const existing = JSON.parse(localStorage.getItem("hydrotrack_history")) || [];

  const newEvent = {
    id: Date.now(),
    text: eventText,
    time: new Date().toLocaleString(),
  };

  const updated = [newEvent, ...existing];
  localStorage.setItem("hydrotrack_history", JSON.stringify(updated));
};

export const getHistoryEvents = () => {
  return JSON.parse(localStorage.getItem("hydrotrack_history")) || [];
};

export const clearHistoryEvents = () => {
  localStorage.removeItem("hydrotrack_history");
};

export const saveAlert = (alertText, type = "info") => {
  const existing = JSON.parse(localStorage.getItem("hydrotrack_alerts")) || [];

  const newAlert = {
    id: Date.now(),
    text: alertText,
    type,
    time: new Date().toLocaleString(),
  };

  const updated = [newAlert, ...existing];
  localStorage.setItem("hydrotrack_alerts", JSON.stringify(updated));
};

export const getAlerts = () => {
  return JSON.parse(localStorage.getItem("hydrotrack_alerts")) || [];
};

export const clearAlerts = () => {
  localStorage.removeItem("hydrotrack_alerts");
};

export const getSettings = () => {
  return (
    JSON.parse(localStorage.getItem("hydrotrack_settings")) || {
      tankCapacity: "500L",
      defaultTargetLevel: 80,
      lowLevelThreshold: 25,
      autoPumpControl: true,
      overflowProtection: true,
      turbidityMonitoring: true,
      qualityAlerts: true,
      tankFullAlerts: true,
      lowWaterAlerts: true,
      pumpSafetyTimeout: "10 min",
      theme: "light",
    }
  );
};

export const saveSettings = (settings) => {
  localStorage.setItem("hydrotrack_settings", JSON.stringify(settings));
};