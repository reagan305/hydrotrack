import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  getSettings,
  subscribeSettingsChange,
} from "../../utils/storage";
import { getAppTheme } from "../../utils/appTheme";
import BottomNav from "../BottomNav";

export default function AlertsScreen() {
  const [settings, setSettings] = useState(null);
  const [alerts, setAlerts] = useState([
    { id: 1, text: "Low water level detected", time: "Today, 10:45 PM", type: "danger" },
    { id: 2, text: "Pump stopped successfully", time: "Today, 10:40 PM", type: "success" },
    { id: 3, text: "Water quality needs monitoring", time: "Today, 9:58 PM", type: "warning" },
  ]);

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

  if (!settings) return null;

  const theme = getAppTheme(settings.theme);
  const styles = getStyles(theme);

  const getAlertMeta = (type) => {
    if (type === "danger") return { label: "Critical", icon: "!", color: "#ef4444" };
    if (type === "warning") return { label: "Warning", icon: "⚠", color: "#f59e0b" };
    if (type === "success") return { label: "Success", icon: "✓", color: "#22c55e" };
    return { label: "Info", icon: "i", color: "#38bdf8" };
  };

  const dangerCount = alerts.filter((a) => a.type === "danger").length;
  const warningCount = alerts.filter((a) => a.type === "warning").length;
  const successCount = alerts.filter((a) => a.type === "success").length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>HydroTrack</Text>
      <Text style={styles.subtitle}>System Alerts and Notifications</Text>

      <View style={styles.headerRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{alerts.length} Stored Alerts</Text>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={() => setAlerts([])}>
          <Text style={styles.clearText}>Clear Alerts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Critical" value={dangerCount} color="#ef4444" styles={styles} />
        <StatCard label="Warnings" value={warningCount} color="#f59e0b" styles={styles} />
        <StatCard label="Success" value={successCount} color="#22c55e" styles={styles} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alert Center</Text>
        <Text style={styles.cardSubtitle}>
          Recent system warnings, actions, and safety messages
        </Text>

        {alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No alerts yet.</Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const meta = getAlertMeta(alert.type);

            return (
              <View key={alert.id} style={styles.alertItem}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: `${meta.color}22`,
                      borderColor: `${meta.color}66`,
                    },
                  ]}
                >
                  <Text style={[styles.iconText, { color: meta.color }]}>
                    {meta.icon}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{alert.text}</Text>

                  <View
                    style={[
                      styles.alertBadge,
                      {
                        backgroundColor: `${meta.color}22`,
                        borderColor: `${meta.color}66`,
                      },
                    ]}
                  >
                    <Text style={[styles.alertBadgeText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>

                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <BottomNav currentScreen="alerts"
      themeMode={settings.theme} />
    </ScrollView>
  );
}

function StatCard({ label, value, color, styles }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
    title: { color: theme.text, fontSize: 34, fontWeight: "900" },
    subtitle: { color: theme.subtext, marginTop: 4, marginBottom: 16 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 18,
    },
    statusBadge: {
      backgroundColor: "rgba(239,68,68,0.12)",
      borderWidth: 1,
      borderColor: "rgba(239,68,68,0.35)",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
    },
    statusText: { color: "#ef4444", fontWeight: "800" },
    clearButton: {
      backgroundColor: "rgba(239,68,68,0.15)",
      borderWidth: 1,
      borderColor: "rgba(239,68,68,0.4)",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
    },
    clearText: { color: "#ef4444", fontWeight: "800" },
    statsGrid: { gap: 12, marginBottom: 18 },
    statCard: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statLabel: { color: theme.subtext, fontSize: 13 },
    statValue: { fontSize: 30, fontWeight: "900", marginTop: 8 },
    card: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: { color: theme.text, fontSize: 20, fontWeight: "800" },
    cardSubtitle: { color: theme.subtext, marginTop: 4, marginBottom: 16 },
    emptyBox: { backgroundColor: theme.soft, borderRadius: 16, padding: 18 },
    emptyText: { color: theme.subtext, textAlign: "center" },
    alertItem: {
      backgroundColor: theme.soft,
      borderRadius: 18,
      padding: 14,
      flexDirection: "row",
      gap: 14,
      alignItems: "center",
      marginBottom: 14,
    },
    iconCircle: {
      width: 50,
      height: 50,
      borderRadius: 999,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: { fontSize: 20, fontWeight: "900" },
    alertTitle: { color: theme.text, fontWeight: "800", fontSize: 15 },
    alertBadge: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginTop: 6,
    },
    alertBadgeText: { fontSize: 12, fontWeight: "800" },
    alertTime: { color: theme.subtext, fontSize: 12, marginTop: 7 },
  });