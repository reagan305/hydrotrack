import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getSettings, saveSettings, resetSettings } from "../../utils/storage";
import { getAppTheme } from "../../utils/appTheme";
import { logoutUser } from "../../firebase/config";
import BottomNav from "../BottomNav";

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await getSettings();
    setSettings(saved);
  };

  const handleChange = (field, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "lowLevelThreshold") {
        const validTargets = [40, 60, 80, 100].filter(
          (level) => level > Number(value)
        );

        if (!validTargets.includes(Number(updated.defaultTargetLevel))) {
          updated.defaultTargetLevel = validTargets[0] || 100;
        }
      }

      if (field === "defaultTargetLevel") {
        if (Number(value) <= Number(updated.lowLevelThreshold)) {
          const validTargets = [40, 60, 80, 100].filter(
            (level) => level > Number(updated.lowLevelThreshold)
          );

          updated.defaultTargetLevel = validTargets[0] || 100;
        }
      }

      return updated;
    });
  };

  const handleSave = async () => {
    await saveSettings(settings);
    Alert.alert("Saved", "Settings saved successfully");
  };

  const handleReset = async () => {
    const defaults = await resetSettings();
    setSettings(defaults);
    Alert.alert("Reset", "Settings reset to default");
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Could not log out.");
    }
  };

  if (!settings) return null;

  const theme = getAppTheme(settings.theme);
  const styles = getStyles(theme);

  const validDefaultTargets = [40, 60, 80, 100].filter(
    (level) => level > Number(settings.lowLevelThreshold || 0)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.title}>HydroTrack</Text>
      <Text style={styles.subtitle}>System Settings and Configuration</Text>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>Configuration Panel</Text>
      </View>

      <SettingsCard title="Tank Settings" styles={styles}>
        <Field label="Tank Capacity" styles={styles}>
          <TextInput
            value={String(settings.tankCapacity)}
            onChangeText={(value) => handleChange("tankCapacity", value)}
            style={styles.input}
            keyboardType="numeric"
            placeholder="500"
            placeholderTextColor={theme.subtext}
          />
        </Field>

        <Field label="Volume Unit" styles={styles}>
          <OptionRow
            options={["L", "Gallons", "m³"]}
            selected={settings.volumeUnit}
            onSelect={(value) => handleChange("volumeUnit", value)}
            styles={styles}
          />
        </Field>

        <Field label="Low Level Alert Threshold" styles={styles}>
          <OptionRow
            options={[10, 20, 25, 30, 40, 50]}
            selected={settings.lowLevelThreshold}
            onSelect={(value) => handleChange("lowLevelThreshold", value)}
            suffix="%"
            styles={styles}
          />
        </Field>

        <Field label="Default Target Level" styles={styles}>
          <OptionRow
            options={validDefaultTargets}
            selected={settings.defaultTargetLevel}
            onSelect={(value) => handleChange("defaultTargetLevel", value)}
            suffix="%"
            styles={styles}
          />
        </Field>
      </SettingsCard>

      <SettingsCard title="Pump Settings" styles={styles}>
        <Toggle
          label="Automatic Pump Control"
          value={settings.autoPumpControl}
          onChange={(value) => handleChange("autoPumpControl", value)}
          styles={styles}
        />

        <Toggle
          label="Overflow Protection"
          value={settings.overflowProtection}
          onChange={(value) => handleChange("overflowProtection", value)}
          styles={styles}
        />

        <Field label="Pump Safety Timeout" styles={styles}>
          <OptionRow
            options={["5 min", "10 min", "15 min"]}
            selected={settings.pumpSafetyTimeout}
            onSelect={(value) => handleChange("pumpSafetyTimeout", value)}
            styles={styles}
          />
        </Field>
      </SettingsCard>

      <SettingsCard title="Water Quality Settings" styles={styles}>
        <Toggle
          label="Turbidity Monitoring"
          value={settings.turbidityMonitoring}
          onChange={(value) => handleChange("turbidityMonitoring", value)}
          styles={styles}
        />

        <Toggle
          label="Quality Warning Alerts"
          value={settings.qualityAlerts}
          onChange={(value) => handleChange("qualityAlerts", value)}
          styles={styles}
        />
      </SettingsCard>

      <SettingsCard title="Notification & Appearance" styles={styles}>
        <Toggle
          label="Tank Full Alerts"
          value={settings.tankFullAlerts}
          onChange={(value) => handleChange("tankFullAlerts", value)}
          styles={styles}
        />

        <Toggle
          label="Low Water Alerts"
          value={settings.lowWaterAlerts}
          onChange={(value) => handleChange("lowWaterAlerts", value)}
          styles={styles}
        />

        <Field label="Theme Mode" styles={styles}>
          <OptionRow
            options={["light", "dark"]}
            selected={settings.theme}
            onSelect={(value) => handleChange("theme", value)}
            styles={styles}
          />
        </Field>
      </SettingsCard>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      <BottomNav currentScreen="settings" themeMode={settings.theme} />
    </ScrollView>
  );
}

function SettingsCard({ title, children, styles }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, children, styles }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Toggle({ label, value, onChange, styles }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function OptionRow({ options, selected, onSelect, suffix = "", styles }) {
  return (
    <View style={styles.optionRow}>
      {options.map((item) => (
        <TouchableOpacity
          key={item}
          onPress={() => onSelect(item)}
          style={selected === item ? styles.optionActive : styles.optionButton}
        >
          <Text style={styles.optionText}>
            {item}
            {typeof item === "number" ? suffix : ""}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
    title: { color: theme.text, fontSize: 34, fontWeight: "900" },
    subtitle: { color: theme.subtext, marginTop: 4, marginBottom: 16 },
    statusBadge: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(14,165,233,0.12)",
      borderWidth: 1,
      borderColor: "rgba(56,189,248,0.35)",
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      marginBottom: 18,
    },
    statusText: { color: "#38bdf8", fontWeight: "800" },
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 22,
      padding: 18,
      marginBottom: 18,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 18,
    },
    fieldGroup: { marginBottom: 18 },
    label: { color: theme.subtext, fontWeight: "800", marginBottom: 10 },
    input: {
      backgroundColor: theme.soft,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 15,
    },
    toggleRow: {
      backgroundColor: theme.soft,
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    toggleLabel: { color: theme.text, fontWeight: "800", flex: 1 },
    optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    optionButton: {
      backgroundColor: theme.soft,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    optionActive: {
      backgroundColor: "#0ea5e9",
      borderWidth: 1,
      borderColor: "#0ea5e9",
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    optionText: { color: theme.text, fontWeight: "800" },
    actionBar: { flexDirection: "row", gap: 12, marginBottom: 18 },
    saveButton: {
      flex: 1,
      backgroundColor: "#0ea5e9",
      padding: 15,
      borderRadius: 14,
      alignItems: "center",
    },
    resetButton: {
      flex: 1,
      backgroundColor: "#ef4444",
      padding: 15,
      borderRadius: 14,
      alignItems: "center",
    },
    logoutButton: {
      backgroundColor: "#f97316",
      padding: 15,
      borderRadius: 14,
      alignItems: "center",
      marginBottom: 20,
    },
    buttonText: { color: "#ffffff", fontWeight: "900" },
  });