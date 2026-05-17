import { Link } from "react-router-dom";
import { getAlerts, clearAlerts } from "../utils/storage";
import { useEffect, useState } from "react";
import { themeColors } from "../utils/theme";

function Alerts() {
  const theme = themeColors();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    setAlerts(getAlerts());
  }, []);

  const handleClearAlerts = () => {
    clearAlerts();
    setAlerts([]);
  };

  const getAlertMeta = (type) => {
    if (type === "danger") {
      return { label: "Critical", icon: "!", color: "#ef4444" };
    }

    if (type === "warning") {
      return { label: "Warning", icon: "⚠", color: "#f59e0b" };
    }

    if (type === "success") {
      return { label: "Success", icon: "✓", color: "#22c55e" };
    }

    return { label: "Info", icon: "i", color: "#38bdf8" };
  };

  const dangerCount = alerts.filter((a) => a.type === "danger").length;
  const warningCount = alerts.filter((a) => a.type === "warning").length;
  const successCount = alerts.filter((a) => a.type === "success").length;

  const styles = getStyles(theme);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>HydroTrack</h1>
          <p style={styles.subtitle}>System Alerts and Notifications</p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.statusBadge}>{alerts.length} Stored Alerts</div>

          <button onClick={handleClearAlerts} style={styles.clearButton}>
            Clear Alerts
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Critical</span>
          <h2 style={{ ...styles.statValue, color: "#ef4444" }}>
            {dangerCount}
          </h2>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>Warnings</span>
          <h2 style={{ ...styles.statValue, color: "#f59e0b" }}>
            {warningCount}
          </h2>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>Successful</span>
          <h2 style={{ ...styles.statValue, color: "#22c55e" }}>
            {successCount}
          </h2>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.cardTitle}>Alert Center</h2>
            <p style={styles.cardSubtitle}>
              Recent system warnings, actions, and safety messages
            </p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div style={styles.emptyBox}>
            No alerts yet. Go to the dashboard and trigger some actions.
          </div>
        ) : (
          <div style={styles.alertList}>
            {alerts.map((alert) => {
              const meta = getAlertMeta(alert.type);

              return (
                <div key={alert.id} style={styles.alertItem}>
                  <div
                    style={{
                      ...styles.iconCircle,
                      background: `${meta.color}22`,
                      color: meta.color,
                      border: `1px solid ${meta.color}66`,
                    }}
                  >
                    {meta.icon}
                  </div>

                  <div style={styles.alertContent}>
                    <div style={styles.alertTopLine}>
                      <p style={styles.alertTitle}>{alert.text}</p>

                      <span
                        style={{
                          ...styles.alertBadge,
                          color: meta.color,
                          background: `${meta.color}22`,
                          border: `1px solid ${meta.color}66`,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <p style={styles.alertTime}>{alert.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.navbar}>
        <Link to="/dashboard" style={styles.navLink}>
          Dashboard
        </Link>
        <Link to="/history" style={styles.navLink}>
          History
        </Link>
        <Link to="/alerts" style={styles.navLinkActive}>
          Alerts
        </Link>
        <Link to="/settings" style={styles.navLink}>
          Settings
        </Link>
      </div>
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

  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
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
    background: "rgba(239,68,68,0.12)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.35)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontWeight: "bold",
  },

  clearButton: {
    background: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.4)",
    padding: "10px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "22px",
  },

  statCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "22px",
    padding: "24px",
  },

  statLabel: {
    color: theme.subtext,
    fontSize: "14px",
  },

  statValue: {
    margin: "10px 0 0 0",
    fontSize: "34px",
    fontWeight: "900",
  },

  card: {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "28px",
    padding: "28px",
  },

  topBar: {
    marginBottom: "22px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: theme.text,
  },

  cardSubtitle: {
    marginTop: "6px",
    color: theme.subtext,
  },

  emptyBox: {
    background: theme.softBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "18px",
    padding: "22px",
    textAlign: "center",
    color: theme.subtext,
  },

  alertList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  alertItem: {
    background: theme.softBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "20px",
    padding: "18px",
    display: "flex",
    gap: "14px",
    alignItems: "center",
  },

  iconCircle: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "22px",
    flexShrink: 0,
  },

  alertContent: {
    flex: 1,
  },

  alertTopLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  alertTitle: {
    margin: 0,
    fontWeight: "bold",
    fontSize: "15px",
    color: theme.text,
  },

  alertBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  alertTime: {
    margin: "7px 0 0 0",
    color: theme.subtext,
    fontSize: "13px",
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

export default Alerts;