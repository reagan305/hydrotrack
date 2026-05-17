import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../../firebase/config";
import {
  getSettings,
  subscribeSettingsChange,
} from "../../utils/storage";
import { getAppTheme } from "../../utils/appTheme";
import BottomNav from "../BottomNav";

export default function HistoryScreen() {
  const [settings, setSettings] = useState(null);
  const [viewMode, setViewMode] = useState("day");
  const [currentTankLevel, setCurrentTankLevel] = useState(0);
  const [turbidityValue, setTurbidityValue] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  const historyEvents = [
    { id: 1, text: "Water level reached target level", time: "Today, 10:45 PM" },
    { id: 2, text: "Pump stopped automatically", time: "Today, 10:42 PM" },
    { id: 3, text: "Low water warning detected", time: "Today, 9:58 PM" },
  ];

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await getSettings();
      setSettings(saved);
    };

    loadSettings();

    const unsubscribe = subscribeSettingsChange((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const sensorRef = ref(realtimeDb, "/Sensor");

    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        setCurrentTankLevel(Number(data.WaterLevel || 0));
        setTurbidityValue(Number(data.Turbidity || 0));
        setConnectionStatus("Live");
      } else {
        setConnectionStatus("No Data");
      }
    });

    return () => unsubscribe();
  }, []);

  const chartData = useMemo(() => {
    const live = currentTankLevel;

    if (viewMode === "week") {
      return [
        { label: "Mon", value: Math.max(live - 30, 0) },
        { label: "Tue", value: Math.max(live - 20, 0) },
        { label: "Wed", value: Math.max(live - 10, 0) },
        { label: "Thu", value: live },
        { label: "Fri", value: Math.min(live + 5, 100) },
        { label: "Sat", value: Math.min(live + 10, 100) },
        { label: "Sun", value: live },
      ];
    }

    if (viewMode === "month") {
      return [
        { label: "1", value: Math.max(live - 40, 0) },
        { label: "5", value: Math.max(live - 30, 0) },
        { label: "10", value: Math.max(live - 20, 0) },
        { label: "15", value: Math.max(live - 10, 0) },
        { label: "20", value: live },
        { label: "25", value: Math.min(live + 8, 100) },
        { label: "30", value: live },
      ];
    }

    return [
      { label: "12AM", value: Math.max(live - 25, 0) },
      { label: "2AM", value: Math.max(live - 18, 0) },
      { label: "4AM", value: Math.max(live - 12, 0) },
      { label: "6AM", value: Math.max(live - 6, 0) },
      { label: "8AM", value: live },
      { label: "10AM", value: Math.min(live + 5, 100) },
      { label: "Now", value: live },
    ];
  }, [viewMode, currentTankLevel]);

  if (!settings) return null;

  const theme = getAppTheme(settings.theme);
  const styles = getStyles(theme);

  const formattedActivity = historyEvents.map((event) => {
    const txt = event.text.toLowerCase();

    let color = "#38bdf8";
    let icon = "💧";

    if (txt.includes("warning") || txt.includes("low")) {
      color = "#ef4444";
      icon = "!";
    }

    if (txt.includes("reached") || txt.includes("normal")) {
      color = "#22c55e";
      icon = "✓";
    }

    return { ...event, color, icon };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>HydroTrack</Text>
      <Text style={styles.subtitle}>Water Analytics and System Activity</Text>

      <View style={styles.liveBadge}>
        <View
          style={[
            styles.liveDot,
            { backgroundColor: connectionStatus === "Live" ? "#22c55e" : "#ef4444" },
          ]}
        />
        <Text style={styles.liveText}>{connectionStatus}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Current Tank Level" value={`${currentTankLevel}%`} styles={styles} />
        <StatCard label="Live Turbidity" value={turbidityValue} styles={styles} />
        <StatCard label="Connection" value={connectionStatus} styles={styles} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Water Level Trend</Text>
        <Text style={styles.cardSubtitle}>Last point reflects current live tank level.</Text>

        <View style={styles.segmentWrap}>
          {["day", "week", "month"].map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={viewMode === mode ? styles.segmentActive : styles.segmentButton}
            >
              <Text style={viewMode === mode ? styles.segmentActiveText : styles.segmentText}>
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartBox}>
          {chartData.map((point, index) => (
            <View key={index} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(point.value * 1.6, 8),
                    backgroundColor:
                      point.value >= Number(settings.defaultTargetLevel)
                        ? "#22c55e"
                        : "#38bdf8",
                  },
                ]}
              />
              <Text style={styles.barValue}>{point.value}%</Text>
              <Text style={styles.barLabel}>{point.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.targetText}>
          Target Level: {settings.defaultTargetLevel}%
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <Text style={styles.cardSubtitle}>Latest system actions and alerts</Text>

        {formattedActivity.map((item) => (
          <View key={item.id} style={styles.logItem}>
            <View style={[styles.logIcon, { backgroundColor: item.color }]}>
              <Text style={styles.logIconText}>{item.icon}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.logText}>{item.text}</Text>
              <Text style={styles.logTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>

      <BottomNav currentScreen="history"
      themeMode={settings.theme} />
    </ScrollView>
  );
}

function StatCard({ label, value, styles }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
    statsGrid: { gap: 12, marginBottom: 18 },
    statCard: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statLabel: { color: theme.subtext, fontSize: 13 },
    statValue: { color: theme.text, fontSize: 28, fontWeight: "900", marginTop: 8 },
    card: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: { color: theme.text, fontSize: 20, fontWeight: "800" },
    cardSubtitle: { color: theme.subtext, marginTop: 4, marginBottom: 12 },
    segmentWrap: { flexDirection: "row", gap: 10, marginBottom: 18 },
    segmentButton: {
      flex: 1,
      backgroundColor: theme.soft,
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    segmentActive: {
      flex: 1,
      backgroundColor: "#0ea5e9",
      padding: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    segmentText: { color: theme.subtext, fontWeight: "800" },
    segmentActiveText: { color: "#ffffff", fontWeight: "900" },
    chartBox: {
      height: 210,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.border,
      paddingVertical: 14,
    },
    barWrap: { flex: 1, alignItems: "center" },
    bar: { width: 22, borderRadius: 999 },
    barValue: { color: theme.text, fontSize: 10, marginTop: 6 },
    barLabel: { color: theme.subtext, fontSize: 10, marginTop: 4 },
    targetText: { color: "#22c55e", fontWeight: "800", marginTop: 14, textAlign: "center" },
    logItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: theme.soft,
      borderRadius: 16,
      padding: 14,
      marginTop: 12,
    },
    logIcon: {
      width: 46,
      height: 46,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    logIconText: { color: "#ffffff", fontWeight: "900", fontSize: 18 },
    logText: { color: theme.text, fontWeight: "800" },
    logTime: { color: theme.subtext, marginTop: 4, fontSize: 12 },
  });