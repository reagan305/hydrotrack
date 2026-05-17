import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import {
  getHistoryEvents,
  clearHistoryEvents,
  getSettings,
} from "../utils/storage";
import { realtimeDb } from "../firebase/config";
import { themeColors } from "../utils/theme";

function History() {
  const theme = themeColors();
  const settings = getSettings();

  const [historyEvents, setHistoryEvents] = useState([]);
  const [viewMode, setViewMode] = useState("day");
  const [currentTankLevel, setCurrentTankLevel] = useState(0);
  const [turbidityValue, setTurbidityValue] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    setHistoryEvents(getHistoryEvents());
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

  const handleClearHistory = () => {
    clearHistoryEvents();
    setHistoryEvents([]);
  };

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

  const chartPoints = chartData
    .map((point, index) => {
      const x = 40 + index * (500 / (chartData.length - 1));
      const y = 240 - point.value * 2;
      return `${x},${y}`;
    })
    .join(" ");

  const formatActivity = historyEvents.slice(0, 8).map((event) => {
    const txt = event.text.toLowerCase();

    let color = "#38bdf8";
    let icon = "💧";

    if (txt.includes("overflow") || txt.includes("warning") || txt.includes("low")) {
      color = "#ef4444";
      icon = "!";
    }

    if (txt.includes("clean") || txt.includes("normal") || txt.includes("reached")) {
      color = "#22c55e";
      icon = "✓";
    }

    return {
      ...event,
      color,
      icon,
      timeOnly: new Date(event.id).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  });

  const styles = getStyles(theme);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>HydroTrack</h1>
          <p style={styles.subtitle}>
            Water Analytics and System Activity
          </p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.liveBadge}>
            <span style={styles.liveDot}></span>
            {connectionStatus}
          </div>

          <button onClick={handleClearHistory} style={styles.clearButton}>
            Clear History
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Current Tank Level</span>
          <h2 style={styles.statValue}>{currentTankLevel}%</h2>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>Live Turbidity</span>
          <h2 style={styles.statValue}>{turbidityValue}</h2>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>Connection</span>
          <h2 style={styles.statValue}>{connectionStatus}</h2>
        </div>
      </div>

      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <div>
            <h2 style={styles.cardTitle}>Water Level Trend</h2>
            <p style={styles.cardSubtitle}>
              The last point reflects the current live tank level.
            </p>
          </div>

          <div style={styles.segmentWrap}>
            {["day", "week", "month"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={
                  viewMode === mode
                    ? styles.segmentActive
                    : styles.segmentButton
                }
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.chartWrapper}>
          <svg width="100%" height="340" viewBox="0 0 620 340">
            <defs>
              <linearGradient id="blueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <line x1="40" y1="240" x2="560" y2="240" stroke="#334155" />
            <line x1="40" y1="180" x2="560" y2="180" stroke="#334155" />
            <line x1="40" y1="120" x2="560" y2="120" stroke="#334155" />
            <line x1="40" y1="60" x2="560" y2="60" stroke="#334155" />

            <polyline
              fill="url(#blueFill)"
              stroke="none"
              points={`${chartPoints} 560,240 40,240`}
            />

            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="5"
              points={chartPoints}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {chartData.map((point, index) => {
              const x = 40 + index * (500 / (chartData.length - 1));
              const y = 240 - point.value * 2;

              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#38bdf8"
                />
              );
            })}

            <line
              x1="40"
              y1={240 - settings.defaultTargetLevel * 2}
              x2="560"
              y2={240 - settings.defaultTargetLevel * 2}
              stroke="#22c55e"
              strokeDasharray="8 8"
              strokeWidth="2"
            />

            {chartData.map((point, index) => {
              const x = 28 + index * (500 / (chartData.length - 1));

              return (
                <text
                  key={index}
                  x={x}
                  y="275"
                  fill="#94a3b8"
                  fontSize="13"
                >
                  {point.label}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      <div style={styles.logsCard}>
        <div style={styles.logsHeader}>
          <div>
            <h2 style={styles.cardTitle}>Recent Activity</h2>
            <p style={styles.cardSubtitle}>
              Latest system actions and alerts
            </p>
          </div>
        </div>

        <div style={styles.logsList}>
          {formatActivity.length === 0 ? (
            <div style={styles.emptyBox}>
              No history events available yet.
            </div>
          ) : (
            formatActivity.map((item) => (
              <div key={item.id} style={styles.logItem}>
                <div style={{ ...styles.logIcon, background: item.color }}>
                  {item.icon}
                </div>

                <div style={styles.logContent}>
                  <p style={styles.logText}>{item.text}</p>
                  <p style={styles.logTime}>{item.time}</p>
                </div>

                <div style={styles.timeRight}>{item.timeOnly}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={styles.navbar}>
        <Link to="/dashboard" style={styles.navLink}>
          Dashboard
        </Link>

        <Link to="/history" style={styles.navLinkActive}>
          History
        </Link>

        <Link to="/alerts" style={styles.navLink}>
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

  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  liveBadge: {
    background: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    border: "1px solid rgba(34,197,94,0.35)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  liveDot: {
    width: "9px",
    height: "9px",
    background: "#22c55e",
    borderRadius: "50%",
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
    backdropFilter: "blur(18px)",
  },

  statLabel: {
    color: theme.subtext,
    fontSize: "14px",
  },

  statValue: {
    margin: "10px 0 0 0",
    fontSize: "34px",
    fontWeight: "900",
    color: theme.text,
  },

  chartCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "28px",
    padding: "28px",
    marginBottom: "22px",
    backdropFilter: "blur(18px)",
  },

  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
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

  segmentWrap: {
    display: "flex",
    gap: "10px",
  },

  segmentButton: {
    background: theme.softBg,
    color: theme.subtext,
    border: `1px solid ${theme.border}`,
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  segmentActive: {
    background: "#38bdf8",
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  chartWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  logsCard: {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "28px",
    padding: "28px",
    backdropFilter: "blur(18px)",
  },

  logsHeader: {
    marginBottom: "18px",
  },

  logsList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  logItem: {
    background: theme.softBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  logIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "22px",
    flexShrink: 0,
  },

  logContent: {
    flex: 1,
  },

  logText: {
    margin: 0,
    fontWeight: "bold",
    fontSize: "15px",
    color: theme.text,
  },

  logTime: {
    marginTop: "6px",
    color: theme.subtext,
    fontSize: "13px",
  },

  timeRight: {
    color: theme.text,
    fontWeight: "bold",
    fontSize: "13px",
  },

  emptyBox: {
    background: theme.softBg,
    borderRadius: "16px",
    padding: "18px",
    textAlign: "center",
    color: theme.subtext,
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

export default History;