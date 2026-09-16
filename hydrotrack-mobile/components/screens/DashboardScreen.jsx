import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ref,
  onValue,
  set,
} from "firebase/database";

import { realtimeDb } from "../../firebase/config";

import {
  getSettings,
  subscribeSettingsChange,
} from "../../utils/storage";

import { getAppTheme } from "../../utils/appTheme";

import BottomNav from "../BottomNav";

import {
  requestNotificationPermission,
  sendLocalNotification,
} from "../../utils/notifications";

const TANK_HEIGHT = 230;

export default function DashboardScreen() {
  const [settings, setSettings] = useState(null);

  const [waterLevel, setWaterLevel] =
    useState(0);

  const [targetLevel, setTargetLevel] =
    useState(null);

  const [turbidityValue, setTurbidityValue] =
    useState(0);

  const [waterQuality, setWaterQuality] =
    useState("Unknown");

  const [connectionStatus, setConnectionStatus] =
    useState("Connecting...");

  const [deviceConfigured, setDeviceConfigured] =
    useState(false);

  const [pumpOn, setPumpOn] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState("--");

  const [currentVolume, setCurrentVolume] =
    useState(0);

  const [lowWaterSent, setLowWaterSent] =
    useState(false);

  const [tankFullSent, setTankFullSent] =
    useState(false);

  const [qualitySent, setQualitySent] =
    useState(false);

  const [offlineSent, setOfflineSent] =
    useState(false);

  const [sensorDataReady, setSensorDataReady] =
    useState(false);

  const [liveConfirmed, setLiveConfirmed] =
    useState(false);

  const animatedLevel = useRef(
    new Animated.Value(0)
  ).current;

  // Device must be confirmed Live before an Offline notification can fire.
  const wasDeviceLive = useRef(false);

  const targetOptions = Array.from(
    { length: 10 },
    (_, i) => (i + 1) * 10
  );

  useEffect(() => {
    const loadSettings = async () => {
      await requestNotificationPermission();

      const saved = await getSettings();

      setSettings(saved);

      const savedTarget =
        await AsyncStorage.getItem(
          "hydrotrack_last_target"
        );

      if (savedTarget) {
        setTargetLevel(Number(savedTarget));
      }
    };

    loadSettings();

    const unsubscribe =
      subscribeSettingsChange(
        (newSettings) => {
          setSettings(newSettings);
        }
      );

    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.timing(animatedLevel, {
      toValue: waterLevel,
      duration: 1400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [waterLevel]);

  useEffect(() => {
    if (!settings) return;

    const sensorRef = ref(realtimeDb, "/Sensor");
    const startedAt = Date.now();
    let lastHeartbeat = 0;
    let previousHeartbeat = null;
    let freshHeartbeatReceived = false;

    const setOfflineState = () => {
      setConnectionStatus("Offline");
    };

    const checkHeartbeat = () => {
      if (freshHeartbeatReceived && lastHeartbeat > 0) {
        const age = Date.now() - lastHeartbeat;
        if (age > 15000) {
          setOfflineState();
        } else {
          setConnectionStatus("Live");
        }
        return;
      }

      // Do not call the device offline immediately after login.
      // Wait for the ESP32 to send a NEW heartbeat in this session.
      if (Date.now() - startedAt > 20000) {
        setOfflineState();
      } else {
        setConnectionStatus("Connecting...");
      }
    };

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (!snapshot.exists()) {
        setDeviceConfigured(false);
        setSensorDataReady(false);
        setLiveConfirmed(false);
        setOfflineState();
        return;
      }

      setDeviceConfigured(true);

      const data = snapshot.val();
      const level = Number(data.WaterLevel ?? 0);
      const turbidity = Number(data.Turbidity ?? 0);
      const capacity = Number(settings.tankCapacity || 0);
      const heartbeat = Number(data.lastUpdated || 0);

      if (heartbeat > 0) {
        if (previousHeartbeat !== null && heartbeat !== previousHeartbeat) {
          freshHeartbeatReceived = true;
          setLiveConfirmed(true);
          setSensorDataReady(true);
          wasDeviceLive.current = true;
        }

        previousHeartbeat = heartbeat;
        lastHeartbeat = heartbeat;

        setLastUpdated(
          new Date(heartbeat).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }

      setWaterLevel(level);
      setTurbidityValue(turbidity);

      // The ESP32 makes the calibrated Clean/Dirty decision.
      // The dashboard does not use the old 150/350 thresholds anymore.
      const deviceQuality = String(data.WaterQuality || "").trim();
      setWaterQuality(
        getQualityFromTurbidity(turbidity, deviceQuality)
      );

      const reportedPumpStatus = String(data.PumpStatus || "OFF").toUpperCase();
      setPumpOn(reportedPumpStatus === "ON");

      setCurrentVolume(
        Math.round((level / 100) * capacity)
      );

      checkHeartbeat();
    });

    const heartbeatTimer = setInterval(checkHeartbeat, 2000);

    return () => {
      unsubscribe();
      clearInterval(heartbeatTimer);
    };
  }, [settings]);

  useEffect(() => {
    if (!settings) return;

    if (
      settings.autoPumpControl &&
      pumpOn &&
      targetLevel !== null &&
      waterLevel >= targetLevel
    ) {
      Alert.alert(
        "Target Reached",
        `Pump stopped automatically at ${targetLevel}%`
      );
    }

    if (
      settings.overflowProtection &&
      pumpOn &&
      waterLevel >= 100
    ) {
      Alert.alert(
        "Overflow Protection",
        "Pump stopped to prevent overflow."
      );
    }
  }, [
    waterLevel,
    targetLevel,
    pumpOn,
    settings,
  ]);

  // Notifications should only be evaluated after we have received
  // a real sensor snapshot. This prevents false alerts on startup
  // when waterLevel is still the initial 0 and waterQuality is Unknown.
  useEffect(() => {
    if (!settings || !sensorDataReady || !liveConfirmed) return;

    const lowLevelThreshold = Number(
      settings.lowLevelThreshold || 0
    );

    if (
      settings.lowWaterAlerts &&
      waterLevel <= lowLevelThreshold &&
      !lowWaterSent
    ) {
      sendLocalNotification(
        "Low Water Alert",
        `Water level is ${waterLevel}%`
      );
      setLowWaterSent(true);
    }

    if (waterLevel > lowLevelThreshold) {
      setLowWaterSent(false);
    }

    if (
      settings.tankFullAlerts &&
      waterLevel >= 100 &&
      !tankFullSent
    ) {
      sendLocalNotification(
        "Tank Full",
        "Tank has reached 100% capacity."
      );
      setTankFullSent(true);
    }

    if (waterLevel < 100) {
      setTankFullSent(false);
    }

    if (
      settings.qualityAlerts &&
      waterQuality === "Dirty" &&
      !qualitySent
    ) {
      sendLocalNotification(
        "Water Quality Warning",
        "Water quality is poor."
      );
      setQualitySent(true);
    }

    if (
      waterQuality !== "Dirty"
    ) {
      setQualitySent(false);
    }

    // Only allow an Offline notification after the ESP32 has
    // previously been confirmed Live. This prevents false
    // Offline alerts during startup or temporary UI transitions.
    if (connectionStatus === "Live") {
      wasDeviceLive.current = true;
      setOfflineSent(false);
    }

    if (
      connectionStatus === "Offline" &&
      wasDeviceLive.current &&
      !offlineSent
    ) {
      sendLocalNotification(
        "Device Offline",
        "HydroTrack device is offline."
      );
      setOfflineSent(true);
    }
  }, [
    waterLevel,
    turbidityValue,
    waterQuality,
    connectionStatus,
    settings,
    sensorDataReady,
    liveConfirmed,
    lowWaterSent,
    tankFullSent,
    qualitySent,
    offlineSent,
  ]);

  if (!settings) return null;

  const theme = getAppTheme(
    settings.theme
  );

  const styles = getStyles(theme);

  const tankCapacity = Number(
    settings.tankCapacity || 0
  );

  const volumeUnit =
    settings.volumeUnit || "L";

  const lowLevelThreshold = Number(
    settings.lowLevelThreshold || 0
  );

  const remainingVolume = Math.max(
    tankCapacity - currentVolume,
    0
  );

  const waterHeight =
    animatedLevel.interpolate({
      inputRange: [0, 100],
      outputRange: [0, TANK_HEIGHT],
    });

  function getQualityFromTurbidity(value, deviceQuality) {
    const reported = String(deviceQuality || "").trim();

    // Prefer the calibrated decision made by the ESP32.
    if (reported === "Clean" || reported === "Dirty") {
      return reported;
    }

    // Only used while an older/empty Firebase record has no WaterQuality.
    if (value <= 0) return "Unknown";
    if (value <= 850) return "Dirty";
    if (value >= 1000) return "Clean";
    return "Unknown";
  }

  const getQualityColor = () => {
    if (waterQuality === "Clean")
      return "#22c55e";

    if (waterQuality === "Dirty")
      return "#ef4444";

    return "#38bdf8";
  };


  const getRecommendedAction = () => {
    if (connectionStatus !== "Live") {
      return "Check sensor or internet connection.";
    }

    if (waterQuality === "Dirty") {
      return "Check water quality.";
    }

    if (waterQuality === "Unknown") {
      return "Waiting for water-quality reading.";
    }

    if (
      waterLevel <= lowLevelThreshold
    ) {
      return pumpOn
        ? "Tank is refilling."
        : "Start pump to refill tank.";
    }

    if (
      settings.autoPumpControl &&
      targetLevel !== null &&
      waterLevel >= targetLevel
    ) {
      return "Target level reached.";
    }

    if (
      !settings.autoPumpControl &&
      settings.overflowProtection &&
      waterLevel >= 100
    ) {
      return "Pump stopped to prevent overflow.";
    }

    if (
      !settings.autoPumpControl &&
      !settings.overflowProtection &&
      waterLevel >= 100
    ) {
      return "Tank may overflow. Stop pump manually.";
    }

    return "System operating normally.";
  };

  const handleSelectTarget = async (
    level
  ) => {
    setTargetLevel(level);

    await AsyncStorage.setItem(
      "hydrotrack_last_target",
      String(level)
    );
  };

  const handleStartPump = async () => {
    if (targetLevel === null) {
      Alert.alert(
        "Select Target",
        "Please select a target water level first."
      );

      return;
    }

    if (
      settings.autoPumpControl &&
      waterLevel >= targetLevel
    ) {
      Alert.alert(
        "Already Reached",
        "Current water level already meets the selected target."
      );

      return;
    }

    // A pump command is a physical-device operation. Only allow it
    // when the ESP32 is currently reporting Live.
    if (connectionStatus !== "Live") {
      Alert.alert(
        "Device Offline",
        "Please connect the HydroTrack device to Wi-Fi before starting the pump."
      );

      return;
    }

    try {
      // Send the command immediately. Do NOT wait here for Firebase
      // polling; the dashboard's /Sensor listener will update the
      // pump status as soon as the ESP32 reports the real state.
      await set(
        ref(realtimeDb, "/Pump"),
        {
          Status: true,
          TargetLevel: targetLevel,
        }
      );

      Alert.alert(
        "Pump Started",
        "The pump has been started."
      );
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Could not send the pump command. Check your internet connection and make sure the HydroTrack device is online."
      );
    }
  };

  const handleStopPump = async () => {
    // Stopping is also a physical-device command.
    if (connectionStatus !== "Live") {
      Alert.alert(
        "Device Offline",
        "Please connect the HydroTrack device to Wi-Fi before stopping the pump."
      );

      return;
    }

    try {
      // Send the stop command immediately. The existing Firebase
      // listener is responsible for reflecting the actual ESP32 state.
      await set(
        ref(realtimeDb, "/Pump"),
        {
          Status: false,
          TargetLevel:
            targetLevel || 0,
        }
      );

      Alert.alert(
        "Pump Stopped",
        "The pump has been stopped."
      );
    } catch (error) {
      Alert.alert(
        "Connection Error",
        "Could not send the pump command. Check your internet connection and make sure the HydroTrack device is online."
      );
    }
  };

  const handleSetupDevice = () => {
    Alert.alert(
      "Set Up Device",
      "Power on the ESP32, connect to HydroTrack_Setup WiFi, then enter your WiFi credentials."
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 30,
      }}
    >
      <Text style={styles.title}>
        HydroTrack
      </Text>

      <Text style={styles.subtitle}>
        Smart Water Tank Monitoring
      </Text>

      <View style={styles.liveBadge}>
        <View
          style={[
            styles.liveDot,
            {
              backgroundColor:
                connectionStatus ===
                "Live"
                  ? "#22c55e"
                  : "#ef4444",
            },
          ]}
        />

        <Text style={styles.liveText}>
          {connectionStatus}
        </Text>
      </View>

      {!deviceConfigured && (
        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>
            Device Not Configured
          </Text>

          <Text style={styles.setupText}>
            No HydroTrack device is currently connected. Set up your ESP32 device to begin monitoring.
          </Text>

          <TouchableOpacity
            style={styles.setupButton}
            onPress={handleSetupDevice}
          >
            <Text style={styles.buttonText}>
              Set Up Device
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text
              style={styles.cardTitle}
            >
              Water Level
            </Text>

            <Text
              style={
                styles.cardSubtitle
              }
            >
              Live sensor reading
            </Text>
          </View>

          <Text
            style={styles.bigPercentage}
          >
            {waterLevel}%
          </Text>
        </View>

        <View style={styles.tankSection}>
          <View style={styles.tank}>
            <Animated.View
              style={[
                styles.waterFill,
                {
                  height: waterHeight,
                },
              ]}
            >
              <View
                style={styles.waveTop}
              />

              <View
                style={styles.waveTop2}
              />

              <Text
                style={styles.waterText}
              >
                {waterLevel}%
              </Text>
            </Animated.View>
          </View>

          <View style={{ flex: 1 }}>
            <InfoRow
              label="Tank Capacity"
              value={`${tankCapacity}${volumeUnit}`}
              styles={styles}
            />

            <InfoRow
              label="Current Water Level"
              value={`${waterLevel}%`}
              styles={styles}
            />

            <InfoRow
              label="Remaining"
              value={`${remainingVolume}${volumeUnit}`}
              styles={styles}
            />

            <InfoRow
              label="Low Level Limit"
              value={`${lowLevelThreshold}%`}
              styles={styles}
            />

            <InfoRow
              label="Selected Target"
              value={
                targetLevel !== null
                  ? `${targetLevel}%`
                  : "Not Selected"
              }
              color="#38bdf8"
              styles={styles}
            />

            <InfoRow
              label="Last Updated"
              value={lastUpdated}
              styles={styles}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Select Target Water Level
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.targetButtons
          }
        >
          {targetOptions.map(
            (level) => (
              <TouchableOpacity
                key={level}
                onPress={() =>
                  handleSelectTarget(
                    level
                  )
                }
                style={
                  targetLevel === level
                    ? styles.activeTarget
                    : styles.targetButton
                }
              >
                <Text
                  style={
                    styles.targetText
                  }
                >
                  {level}%
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Water Quality
        </Text>

        <View
          style={[
            styles.qualityCircle,
            {
              borderColor:
                getQualityColor(),
            },
          ]}
        >
          <Text
            style={{
              color:
                getQualityColor(),
              fontWeight: "900",
              fontSize: 18,
            }}
          >
            {waterQuality}
          </Text>
        </View>

        <InfoRow
          label="Turbidity Index"
          value={turbidityValue}
          styles={styles}
        />

        <InfoRow
          label="Quality"
          value={waterQuality}
          color={getQualityColor()}
          styles={styles}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Pump Control
        </Text>

        <InfoRow
          label="Pump Status"
          value={
            pumpOn ? "ON" : "OFF"
          }
          color={
            pumpOn
              ? "#22c55e"
              : "#ef4444"
          }
          styles={styles}
        />

        <InfoRow
          label="Automatic Mode"
          value={
            settings.autoPumpControl
              ? "Enabled"
              : "Disabled"
          }
          color={
            settings.autoPumpControl
              ? "#22c55e"
              : "#ef4444"
          }
          styles={styles}
        />

        <InfoRow
          label="Overflow Protection"
          value={
            settings.overflowProtection
              ? "Enabled"
              : "Disabled"
          }
          color={
            settings.overflowProtection
              ? "#22c55e"
              : "#ef4444"
          }
          styles={styles}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={
              handleStartPump
            }
          >
            <Text
              style={styles.buttonText}
            >
              Start Pump
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stopButton}
            onPress={
              handleStopPump
            }
          >
            <Text
              style={styles.buttonText}
            >
              Stop Pump
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Quick Alerts
        </Text>

        <InfoRow
          label="System State"
          value={
            connectionStatus !==
            "Live"
              ? "Unknown"
              : waterLevel <=
                lowLevelThreshold
              ? "Low Water Warning"
              : "System Normal"
          }
          color={
            connectionStatus !==
            "Live"
              ? "#f59e0b"
              : waterLevel <=
                lowLevelThreshold
              ? "#ef4444"
              : "#22c55e"
          }
          styles={styles}
        />

        <InfoRow
          label="Recommended Action"
          value={getRecommendedAction()}
          color="#38bdf8"
          styles={styles}
        />
      </View>

      <BottomNav
        currentScreen="dashboard"
        themeMode={settings.theme}
      />
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  color,
  styles,
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          color
            ? { color }
            : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
      padding: 20,
    },

    title: {
      color: theme.text,
      fontSize: 34,
      fontWeight: "900",
    },

    subtitle: {
      color: theme.subtext,
      marginTop: 4,
      marginBottom: 16,
    },

    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor:
        theme.card,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      marginBottom: 18,
      borderWidth: 1,
      borderColor:
        theme.border,
    },

    liveDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      marginRight: 8,
    },

    liveText: {
      color: theme.text,
      fontWeight: "700",
    },

    setupCard: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },

    setupTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 10,
    },

    setupText: {
      color: theme.subtext,
      lineHeight: 22,
      marginBottom: 16,
    },

    setupButton: {
      backgroundColor: "#22c55e",
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
    },

    card: {
      backgroundColor:
        theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor:
        theme.border,
    },

    cardHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    cardTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "800",
    },

    cardSubtitle: {
      color: theme.subtext,
      marginTop: 4,
    },

    bigPercentage: {
      color: "#38bdf8",
      fontSize: 28,
      fontWeight: "900",
    },

    tankSection: {
      flexDirection: "row",
      gap: 16,
    },

    tank: {
      width: 120,
      height: TANK_HEIGHT,
      borderWidth: 5,
      borderColor:
        theme.border,
      borderRadius: 30,
      overflow: "hidden",
      backgroundColor:
        theme.soft,
      justifyContent:
        "flex-end",
    },

    waterFill: {
      width: "100%",
      position: "absolute",
      bottom: 0,
      backgroundColor:
        "#0ea5e9",
      overflow: "hidden",
      justifyContent:
        "center",
      alignItems: "center",
    },

   
    waterText: {
      color: "#ffffff",
      fontWeight: "900",
      fontSize: 26,
    },

    infoRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        theme.border,
      gap: 10,
    },

    infoLabel: {
      color: theme.subtext,
      flex: 1,
    },

    infoValue: {
      color: theme.text,
      fontWeight: "800",
      flex: 1.4,
      textAlign: "right",
    },

    targetButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
      paddingRight: 20,
    },

    targetButton: {
      backgroundColor:
        theme.soft,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      alignItems: "center",
    },

    activeTarget: {
      backgroundColor:
        "#0ea5e9",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
      alignItems: "center",
    },

    targetText: {
      color: "#ffffff",
      fontWeight: "900",
    },

    qualityCircle: {
      width: 130,
      height: 130,
      borderRadius: 999,
      borderWidth: 8,
      justifyContent:
        "center",
      alignItems: "center",
      alignSelf: "center",
      marginVertical: 20,
    },

    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },

    startButton: {
      flex: 1,
      backgroundColor:
        "#22c55e",
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
    },

    stopButton: {
      flex: 1,
      backgroundColor:
        "#ef4444",
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
    },

    buttonText: {
      color: "#ffffff",
      fontWeight: "800",
    },
  });