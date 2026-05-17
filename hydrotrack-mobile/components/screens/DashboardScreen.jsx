import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../../firebase/config";
import {
  getSettings,
  subscribeSettingsChange,
} from "../../utils/storage";
import { getAppTheme } from "../../utils/appTheme";
import BottomNav from "../BottomNav";

const TANK_HEIGHT = 230;

export default function DashboardScreen() {
  const [settings, setSettings] = useState(null);
  const [waterLevel, setWaterLevel] = useState(0);
  const [targetLevel, setTargetLevel] = useState(80);
  const [turbidityValue, setTurbidityValue] = useState(0);
  const [waterQuality, setWaterQuality] = useState("Unknown");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [pumpOn, setPumpOn] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("--");
  const [currentVolume, setCurrentVolume] = useState(0);

  const animatedLevel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await getSettings();
      setSettings(saved);
      applyDefaultTarget(saved);
    };

    loadSettings();

    const unsubscribe = subscribeSettingsChange((newSettings) => {
      setSettings(newSettings);
      applyDefaultTarget(newSettings);
    });

    return unsubscribe;
  }, []);

  const applyDefaultTarget = (saved) => {
    const validTargets = [40, 60, 80, 100].filter(
      (level) => level > Number(saved.lowLevelThreshold || 0)
    );

    setTargetLevel(
      validTargets.includes(Number(saved.defaultTargetLevel))
        ? Number(saved.defaultTargetLevel)
        : validTargets[0] || 100
    );
  };

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

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const level = Number(data.WaterLevel || 0);
        const turbidity = Number(data.Turbidity || 0);
        const capacity = Number(settings.tankCapacity || 0);

        setWaterLevel(level);
        setTurbidityValue(turbidity);
        setWaterQuality(getQualityFromTurbidity(turbidity));
        setConnectionStatus("Live");
        setCurrentVolume(Math.round((level / 100) * capacity));

        setLastUpdated(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } else {
        setConnectionStatus("No Data");
      }
    });

    return () => unsubscribe();
  }, [settings]);

  useEffect(() => {
    if (!settings) return;

    if (settings.autoPumpControl && pumpOn && waterLevel >= targetLevel) {
      setPumpOn(false);
    }
  }, [waterLevel, targetLevel, pumpOn, settings]);

  if (!settings) return null;

  const theme = getAppTheme(settings.theme);
  const styles = getStyles(theme);

  const tankCapacity = Number(settings.tankCapacity || 0);
  const volumeUnit = settings.volumeUnit || "L";
  const lowLevelThreshold = Number(settings.lowLevelThreshold || 0);
  const remainingVolume = Math.max(tankCapacity - currentVolume, 0);

  const targetOptions = [40, 60, 80, 100].filter(
    (level) => level > lowLevelThreshold
  );

  const waterHeight = animatedLevel.interpolate({
    inputRange: [0, 100],
    outputRange: [0, TANK_HEIGHT],
  });

  function getQualityFromTurbidity(value) {
    if (value <= 0) return "Unknown";
    if (value < 150) return "Clean";
    if (value < 350) return "Moderate";
    return "Dirty";
  }

  const getQualityColor = () => {
    if (waterQuality === "Clean") return "#22c55e";
    if (waterQuality === "Moderate") return "#f59e0b";
    if (waterQuality === "Dirty") return "#ef4444";
    return "#38bdf8";
  };

  const getRecommendedAction = () => {
    if (connectionStatus !== "Live") return "Reconnect ESP32 or Firebase.";
    if (waterQuality === "Dirty") return "Check water quality.";
    if (waterLevel <= lowLevelThreshold) return "Water level is low.";
    if (waterLevel >= targetLevel) return "Target reached.";
    return "System normal.";
  };

  const handleStartPump = () => {
    if (waterLevel >= targetLevel) return;
    setPumpOn(true);
  };

  const handleStopPump = () => {
    setPumpOn(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>HydroTrack</Text>
      <Text style={styles.subtitle}>Smart Water Tank Monitoring</Text>

      <View style={styles.liveBadge}>
        <View
          style={[
            styles.liveDot,
            { backgroundColor: connectionStatus === "Live" ? "#22c55e" : "#ef4444" },
          ]}
        />
        <Text style={styles.liveText}>{connectionStatus}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Water Level</Text>
            <Text style={styles.cardSubtitle}>Live sensor reading</Text>
          </View>

          <Text style={styles.bigPercentage}>{waterLevel}%</Text>
        </View>

        <View style={styles.tankSection}>
          <View style={styles.tank}>
            <Animated.View style={[styles.waterFill, { height: waterHeight }]}>
              <View style={styles.waveTop} />
              <View style={styles.waveTop2} />
              <Text style={styles.waterText}>{waterLevel}%</Text>
            </Animated.View>
          </View>

          <View style={{ flex: 1 }}>
            <InfoRow label="Tank Capacity" value={`${tankCapacity}${volumeUnit}`} styles={styles} />
            <InfoRow label="Current Water" value={`${currentVolume}${volumeUnit}`} styles={styles} />
            <InfoRow label="Remaining" value={`${remainingVolume}${volumeUnit}`} styles={styles} />
            <InfoRow label="Low Level Limit" value={`${lowLevelThreshold}%`} styles={styles} />
            <InfoRow label="Target Level" value={`${targetLevel}%`} color="#38bdf8" styles={styles} />
            <InfoRow label="Last Updated" value={lastUpdated} styles={styles} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Target Water Level</Text>

        <View style={styles.targetButtons}>
          {targetOptions.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setTargetLevel(level)}
              style={targetLevel === level ? styles.activeTarget : styles.targetButton}
            >
              <Text style={styles.targetText}>{level}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Water Quality</Text>

        <View style={[styles.qualityCircle, { borderColor: getQualityColor() }]}>
          <Text style={{ color: getQualityColor(), fontWeight: "900", fontSize: 18 }}>
            {waterQuality}
          </Text>
        </View>

        <InfoRow label="Turbidity" value={turbidityValue} styles={styles} />
        <InfoRow label="Quality" value={waterQuality} color={getQualityColor()} styles={styles} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pump Control</Text>

        <InfoRow
          label="Pump Status"
          value={pumpOn ? "ON" : "OFF"}
          color={pumpOn ? "#22c55e" : "#ef4444"}
          styles={styles}
        />

        <InfoRow
          label="Automatic Mode"
          value={settings.autoPumpControl ? "Enabled" : "Disabled"}
          color={settings.autoPumpControl ? "#22c55e" : "#ef4444"}
          styles={styles}
        />

        <InfoRow label="Auto Stop At" value={`${targetLevel}%`} styles={styles} />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartPump}>
            <Text style={styles.buttonText}>Start Pump</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stopButton} onPress={handleStopPump}>
            <Text style={styles.buttonText}>Stop Pump</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Alerts</Text>

        <InfoRow
          label="System State"
          value={waterLevel <= lowLevelThreshold ? "Low Water Warning" : "System Normal"}
          color={waterLevel <= lowLevelThreshold ? "#ef4444" : "#22c55e"}
          styles={styles}
        />

        <InfoRow
          label="Recommended Action"
          value={getRecommendedAction()}
          color="#38bdf8"
          styles={styles}
        />
      </View>

      <BottomNav currentScreen="dashboard"
      themeMode={settings.theme} />
    </ScrollView>
  );
}

function InfoRow({ label, value, color, styles }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
    title: { color: theme.text, fontSize: 34, fontWeight: "900" },
    subtitle: { color: theme.subtext, marginTop: 4, marginBottom: 16 },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: theme.card,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    liveDot: { width: 10, height: 10, borderRadius: 999, marginRight: 8 },
    liveText: { color: theme.text, fontWeight: "700" },
    card: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
    cardTitle: { color: theme.text, fontSize: 20, fontWeight: "800" },
    cardSubtitle: { color: theme.subtext, marginTop: 4 },
    bigPercentage: { color: "#38bdf8", fontSize: 28, fontWeight: "900" },
    tankSection: { flexDirection: "row", gap: 16 },
    tank: {
      width: 120,
      height: TANK_HEIGHT,
      borderWidth: 5,
      borderColor: theme.border,
      borderRadius: 30,
      overflow: "hidden",
      backgroundColor: theme.soft,
      justifyContent: "flex-end",
    },
    waterFill: {
      width: "100%",
      position: "absolute",
      bottom: 0,
      backgroundColor: "#0ea5e9",
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    waveTop: {
      position: "absolute",
      top: -18,
      left: -20,
      width: 160,
      height: 35,
      backgroundColor: "#38bdf8",
      borderRadius: 100,
      opacity: 0.9,
    },
    waveTop2: {
      position: "absolute",
      top: -12,
      left: -10,
      width: 150,
      height: 30,
      backgroundColor: "#7dd3fc",
      borderRadius: 100,
      opacity: 0.5,
    },
    waterText: { color: "#ffffff", fontWeight: "900", fontSize: 26 },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 10,
    },
    infoLabel: { color: theme.subtext, flex: 1 },
    infoValue: { color: theme.text, fontWeight: "800", flex: 1, textAlign: "right" },
    targetButtons: { flexDirection: "row", gap: 10, marginTop: 16 },
    targetButton: {
      flex: 1,
      backgroundColor: theme.soft,
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    activeTarget: {
      flex: 1,
      backgroundColor: "#0ea5e9",
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    targetText: { color: "#ffffff", fontWeight: "800" },
    qualityCircle: {
      width: 130,
      height: 130,
      borderRadius: 999,
      borderWidth: 8,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginVertical: 20,
    },
    buttonRow: { flexDirection: "row", gap: 12, marginTop: 16 },
    startButton: {
      flex: 1,
      backgroundColor: "#22c55e",
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    stopButton: {
      flex: 1,
      backgroundColor: "#ef4444",
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    buttonText: { color: "#ffffff", fontWeight: "800" },
  });