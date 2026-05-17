import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getSettings,
  saveSettings,
  saveHistoryEvent,
  saveAlert,
} from "../utils/storage";
import { themeColors } from "../utils/theme";

function Settings() {
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const theme = themeColors();

  const handleChange = (field, value) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

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

  const handleSave = () => {
    saveSettings(settings);
    saveHistoryEvent("System settings updated");
    saveAlert("Settings saved successfully", "success");
    alert("Settings saved successfully");
    window.location.reload();
  };

  const handleReset = () => {
    const defaults = {
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
    };

    setSettings(defaults);
    saveSettings(defaults);
    saveHistoryEvent("System settings reset to default");
    saveAlert("Settings reset to default", "info");
    window.location.reload();
  };

  const validDefaultTargets = [40, 60, 80, 100].filter(
    (level) => level > Number(settings.lowLevelThreshold || 0)
  );

  const styles = getStyles(theme);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>HydroTrack</h1>
          <p style={styles.subtitle}>System Settings and Configuration</p>
        </div>

        <div style={styles.statusBadge}>Configuration Panel</div>
      </div>

      <div style={styles.grid}>
        <SettingsCard title="Tank Settings" styles={styles}>
          <Field label="Tank Capacity" styles={styles}>
            <input
              type="text"
              value={settings.tankCapacity}
              onChange={(e) => handleChange("tankCapacity", e.target.value)}
              style={styles.input}
            />
          </Field>

          <Field label="Low Level Alert Threshold" styles={styles}>
            <select
              value={settings.lowLevelThreshold}
              onChange={(e) =>
                handleChange("lowLevelThreshold", Number(e.target.value))
              }
              style={styles.select}
            >
              <option value={10}>10%</option>
              <option value={20}>20%</option>
              <option value={25}>25%</option>
              <option value={30}>30%</option>
              <option value={40}>40%</option>
              <option value={50}>50%</option>
            </select>
          </Field>

          <Field label="Default Target Level" styles={styles}>
            <select
              value={settings.defaultTargetLevel}
              onChange={(e) =>
                handleChange("defaultTargetLevel", Number(e.target.value))
              }
              style={styles.select}
            >
              {validDefaultTargets.map((level) => (
                <option key={level} value={level}>
                  {level}%
                </option>
              ))}
            </select>
          </Field>
        </SettingsCard>

        <SettingsCard title="Pump Settings" styles={styles}>
          <Toggle
            label="Automatic Pump Control"
            checked={settings.autoPumpControl}
            onChange={(value) => handleChange("autoPumpControl", value)}
            styles={styles}
          />

          <Toggle
            label="Overflow Protection"
            checked={settings.overflowProtection}
            onChange={(value) => handleChange("overflowProtection", value)}
            styles={styles}
          />

          <Field label="Pump Safety Timeout" styles={styles}>
            <select
              value={settings.pumpSafetyTimeout}
              onChange={(e) => handleChange("pumpSafetyTimeout", e.target.value)}
              style={styles.select}
            >
              <option value="5 min">5 min</option>
              <option value="10 min">10 min</option>
              <option value="15 min">15 min</option>
            </select>
          </Field>
        </SettingsCard>

        <SettingsCard title="Water Quality Settings" styles={styles}>
          <Toggle
            label="Turbidity Monitoring"
            checked={settings.turbidityMonitoring}
            onChange={(value) => handleChange("turbidityMonitoring", value)}
            styles={styles}
          />

          <Toggle
            label="Quality Warning Alerts"
            checked={settings.qualityAlerts}
            onChange={(value) => handleChange("qualityAlerts", value)}
            styles={styles}
          />
        </SettingsCard>

        <SettingsCard title="Notification & Appearance" styles={styles}>
          <Toggle
            label="Tank Full Alerts"
            checked={settings.tankFullAlerts}
            onChange={(value) => handleChange("tankFullAlerts", value)}
            styles={styles}
          />

          <Toggle
            label="Low Water Alerts"
            checked={settings.lowWaterAlerts}
            onChange={(value) => handleChange("lowWaterAlerts", value)}
            styles={styles}
          />

          <Field label="Theme Mode" styles={styles}>
            <select
              value={settings.theme}
              onChange={(e) => handleChange("theme", e.target.value)}
              style={styles.select}
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </Field>
        </SettingsCard>
      </div>

      <div style={styles.actionBar}>
        <button style={styles.saveButton} onClick={handleSave}>
          Save Settings
        </button>
        <button style={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
      </div>

      <div style={styles.navbar}>
        <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
        <Link to="/history" style={styles.navLink}>History</Link>
        <Link to="/alerts" style={styles.navLink}>Alerts</Link>
        <Link to="/settings" style={styles.navLinkActive}>Settings</Link>
      </div>
    </div>
  );
}

function SettingsCard({ title, children, styles }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children, styles }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange, styles }) {
  return (
    <div style={styles.toggleRow}>
      <span style={styles.toggleLabel}>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

const getStyles = (theme) => ({
  page: {
    minHeight: "100vh",
    padding: "26px",
    fontFamily: "Arial, sans-serif",
    background: theme.pageBg,
    color: theme.text,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "26px",
    flexWrap: "wrap",
    gap: "16px",
  },

  title: {
    margin: 0,
    fontSize: "38px",
    fontWeight: "900",
    color: theme.text,
  },

  subtitle: {
    marginTop: "6px",
    color: theme.subtext,
  },

  statusBadge: {
    background: "rgba(14,165,233,0.12)",
    color: "#38bdf8",
    border: "1px solid rgba(56,189,248,0.35)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontWeight: "bold",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  },

  card: {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "22px",
    fontWeight: "800",
    color: theme.text,
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: theme.subtext,
  },

  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    fontSize: "14px",
    background: theme.softBg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
  },

  select: {
    padding: "13px 14px",
    borderRadius: "12px",
    fontSize: "14px",
    background: theme.softBg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
  },

  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    padding: "14px 16px",
    borderRadius: "14px",
    gap: "12px",
    flexWrap: "wrap",
    background: theme.softBg,
    border: `1px solid ${theme.border}`,
  },

  toggleLabel: {
    fontWeight: "bold",
    color: theme.text,
  },

  actionBar: {
    marginTop: "24px",
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },

  saveButton: {
    background: "#0ea5e9",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  resetButton: {
    background: theme.softBg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "13px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  navbar: {
    marginTop: "24px",
    borderRadius: "20px",
    padding: "16px",
    background: theme.navBg,
    border: `1px solid ${theme.border}`,
    display: "flex",
    justifyContent: "center",
    gap: "26px",
    flexWrap: "wrap",
  },

  navLink: {
    textDecoration: "none",
    color: theme.subtext,
    fontWeight: "bold",
  },

  navLinkActive: {
    textDecoration: "none",
    color: "#38bdf8",
    fontWeight: "bold",
  },
});

export default Settings;