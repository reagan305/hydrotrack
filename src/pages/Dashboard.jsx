import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ref, onValue } from "firebase/database";
import { logoutUser } from "../firebase/auth";
import { realtimeDb } from "../firebase/config";
import { getSettings } from "../utils/storage";
import { themeColors } from "../utils/theme";
function Dashboard() {
  const navigate = useNavigate();
  const theme = themeColors();
  const [settings, setSettings] = useState(getSettings());
  const [waterLevel, setWaterLevel] = useState(0);
  const [targetLevel, setTargetLevel] = useState(getSettings().defaultTargetLevel || 80);
  const [turbidityValue, setTurbidityValue] = useState(0);
  const [waterQuality, setWaterQuality] = useState("Unknown");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [pumpOn, setPumpOn] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("--");
  const [currentLitres, setCurrentLitres] = useState(0);
  const offlineTimerRef = useRef(null);
  useEffect(() => {
    const latestSettings = getSettings();
    setSettings(latestSettings);
    const validOptions = [40, 60, 80, 100].filter(
      (level) => level > Number(latestSettings.lowLevelThreshold || 0)
    );
    if (validOptions.includes(Number(latestSettings.defaultTargetLevel))) {
      setTargetLevel(Number(latestSettings.defaultTargetLevel));
    } else {
      setTargetLevel(validOptions[0] || 100);
    }
  }, []);
  useEffect(() => {
    const sensorRef = ref(realtimeDb, "/Sensor");
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const level = Number(data.WaterLevel || 0);
          const turbidity = Number(data.Turbidity || 0);
          const tankCapacityNumber = parseInt(settings.tankCapacity) || 0;
          setWaterLevel(level);
          setTurbidityValue(turbidity);
          setWaterQuality(getQualityFromTurbidity(turbidity));
          setConnectionStatus("Live");
          setCurrentLitres(Math.round((level / 100) * tankCapacityNumber));
          setLastUpdated(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
          if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = setTimeout(() => {
            setConnectionStatus("Disconnected");
            setPumpOn(false);
          }, 10000);
        } else {
          setConnectionStatus("No Data");
          setPumpOn(false);
        }
      },
      () => {
        setConnectionStatus("Disconnected");
        setPumpOn(false);
      }
    );
    return () => {
      unsubscribe();
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, [settings.tankCapacity]);
  useEffect(() => {
    if (settings.autoPumpControl && pumpOn && waterLevel >= targetLevel) {
      setPumpOn(false);
    }
  }, [waterLevel, targetLevel, pumpOn, settings.autoPumpControl]);
  const getQualityFromTurbidity = (value) => {
    if (value <= 0) return "Unknown";
    if (value < 150) return "Clean";
    if (value < 350) return "Moderate";
    return "Dirty";
  };
  const getQualityColor = () => {
    if (waterQuality === "Clean") return "#22c55e";
    if (waterQuality === "Moderate") return "#f59e0b";
    if (waterQuality === "Dirty") return "#ef4444";
    return "#38bdf8";
  };
  const getRecommendedAction = () => {
    if (connectionStatus !== "Live") return "Reconnect ESP32 or check Firebase.";
    if (waterQuality === "Dirty") return "Check water quality before pumping.";
    if (waterLevel <= Number(settings.lowLevelThreshold || 0)) {
      return "Water level is low. Start pump when ready.";
    }
    if (waterLevel >= targetLevel) return "Target reached. Pump can stay off.";
    return "System normal. Continue monitoring.";
  };
  const targetOptions = [40, 60, 80, 100].filter(
    (level) => level > Number(settings.lowLevelThreshold || 0)
  );
  const tankCapacityNumber = parseInt(settings.tankCapacity) || 0;
  const remainingLitres = Math.max(tankCapacityNumber - currentLitres, 0);
  const handleTargetChange = (level) => {
    setTargetLevel(level);
    if (waterLevel >= level && pumpOn) setPumpOn(false);
  };
  const handleStartPump = () => {
    if (waterLevel >= targetLevel) return;
    setPumpOn(true);
  };
  const handleStopPump = () => {
    setPumpOn(false);
  };
  const isLive = connectionStatus === "Live";
  const statusColor = isLive ? "#22c55e" : "#ef4444";
  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };
  const styles = getStyles(theme, statusColor);
  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes waveMoveSlow {
            0% { transform: translateX(-35px) translateY(0px) rotate(0deg); }
            50% { transform: translateX(35px) translateY(4px) rotate(1deg); }
            100% { transform: translateX(-35px) translateY(0px) rotate(0deg); }
          }
          @keyframes waveMoveFast {
            0% { transform: translateX(30px) translateY(2px); }
            50% { transform: translateX(-30px) translateY(-2px); }
            100% { transform: translateX(30px) translateY(2px); }
          }
          @keyframes waterFloat {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
            100% { transform: translateY(0px); }
          }
          @keyframes waterShine {
            0% { transform: translateX(-120%); opacity: 0; }
            50% { opacity: 0.35; }
            100% { transform: translateX(120%); opacity: 0; }
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.25); }
            50% { box-shadow: 0 0 45px rgba(56, 189, 248, 0.65); }
            100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.25); }
          }
        `}
      </style>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>HydroTrack</h1>
          <p style={styles.subtitle}>Smart Water Tank Monitoring System</p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.liveBadge}>
            <span style={styles.liveDot}></span>
            {connectionStatus}
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Sign Out
          </button>
        </div>
      </div>
      <div style={styles.dashboardGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Water Level</h2>
              <p style={styles.cardSubtitle}>Live reading from ESP32 ultrasonic sensor</p>
            </div>
            <div style={styles.percentageBadge}>{waterLevel}%</div>
          </div>
          <div style={styles.tankLayout}>
            <div style={styles.bigTank}>
              <div
                style={{
                  ...styles.waterContainer,
                  height: `${Math.min(waterLevel, 100)}%`,
                }}
              >
                <div style={styles.waveBack}></div>
                <div style={styles.waveFront}></div>
                <div style={styles.waterGlow}></div>
                <div style={styles.waterShine}></div>
                <span style={styles.waterText}>{waterLevel}%</span>
              </div>
            </div>
            <div style={styles.tankInfo}>
              <InfoBox label="Tank Capacity" value={settings.tankCapacity} styles={styles} />
              <InfoBox
                label="Current Water"
                value={`${currentLitres}L / ${settings.tankCapacity}`}
                styles={styles}
              />
              <InfoBox label="Remaining Capacity" value={`${remainingLitres}L`} styles={styles} />
              <InfoBox label="Low Level Limit" value={`${settings.lowLevelThreshold}%`} styles={styles} />
              <InfoBox label="Target Level" value={`${targetLevel}%`} styles={styles} blue />
              <InfoBox label="Last Updated" value={lastUpdated} styles={styles} />
              <InfoBox label="Connection" value={connectionStatus} styles={styles} color={statusColor} />
            </div>
          </div>
        </div>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Target Water Level</h2>
          <p style={styles.note}>Only levels above your low water threshold are available.</p>
          <div style={styles.targetButtons}>
            {targetOptions.map((level) => (
              <button
                key={level}
                onClick={() => handleTargetChange(level)}
                style={targetLevel === level ? styles.targetButtonActive : styles.targetButton}
              >
                {level}%
              </button>
            ))}
          </div>
          <div style={styles.infoRow}>
            <span>Default From Settings</span>
            <strong>{settings.defaultTargetLevel}%</strong>
          </div>
          <div style={styles.infoRow}>
            <span>Current Selected Target</span>
            <strong style={{ color: "#38bdf8" }}>{targetLevel}%</strong>
          </div>
          <div style={styles.infoRow}>
            <span>Low Level Threshold</span>
            <strong>{settings.lowLevelThreshold}%</strong>
          </div>
        </div>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Water Quality</h2>
          <div style={styles.qualityCircle}>
            <div
              style={{
                ...styles.qualityInner,
                borderColor: getQualityColor(),
                color: getQualityColor(),
              }}
            >
              {waterQuality}
            </div>
          </div>
          <div style={styles.infoRow}>
            <span>Turbidity Raw Value</span>
            <strong>{turbidityValue}</strong>
          </div>
          <div style={styles.infoRow}>
            <span>Quality Status</span>
            <strong style={{ color: getQualityColor() }}>{waterQuality}</strong>
          </div>
        </div>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Pump Control</h2>
          <div style={styles.infoRow}>
            <span>Pump Status</span>
            <strong style={{ color: pumpOn ? "#22c55e" : "#ef4444" }}>
              {pumpOn ? "ON" : "OFF"}
            </strong>
          </div>
          <div style={styles.infoRow}>
            <span>Automatic Mode</span>
            <strong style={{ color: settings.autoPumpControl ? "#22c55e" : "#ef4444" }}>
              {settings.autoPumpControl ? "Enabled" : "Disabled"}
            </strong>
          </div>
          <div style={styles.infoRow}>
            <span>Auto Stop At</span>
            <strong>{targetLevel}%</strong>
          </div>
          <div style={styles.pumpButtons}>
            <button onClick={handleStartPump} style={styles.startButton}>
              Start Pump
            </button>
            <button onClick={handleStopPump} style={styles.stopButton}>
              Stop Pump
            </button>
          </div>
          <p style={styles.note}>
            If automatic pump control is enabled, the pump stops when the tank reaches the selected target level.
          </p>
        </div>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Quick Alerts</h2>
          <div style={styles.infoRow}>
            <span>System State</span>
            <strong
              style={{
                color:
                  waterLevel <= Number(settings.lowLevelThreshold || 0)
                    ? "#ef4444"
                    : "#22c55e",
              }}
            >
              {waterLevel <= Number(settings.lowLevelThreshold || 0)
                ? "Low Water Warning"
                : "System Normal"}
            </strong>
          </div>
          <div style={styles.infoRow}>
            <span>Water Quality</span>
            <strong style={{ color: getQualityColor() }}>{waterQuality}</strong>
          </div>
          <div style={styles.infoRow}>
            <span>Recommended Action</span>
            <strong style={{ color: "#38bdf8" }}>{getRecommendedAction()}</strong>
          </div>
        </div>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>System Status</h2>
          <div style={styles.infoRow}>
            <span>Firebase</span>
            <strong style={{ color: statusColor }}>{isLive ? "Connected" : "Disconnected"}</strong>
          </div>
          <div style={styles.infoRow}>
            <span>Ultrasonic Sensor</span>
            <strong style={{ color: statusColor }}>{isLive ? "Active" : "Disconnected"}</strong>
          </div>
          <div style={styles.infoRow}>
            <span>Turbidity Sensor</span>
            <strong style={{ color: statusColor }}>{isLive ? "Active" : "Disconnected"}</strong>
          </div>
          <div style={styles.infoRow}>
            <span>Pump Relay</span>
            <strong style={{ color: pumpOn ? "#22c55e" : "#ef4444" }}>
              {pumpOn ? "Running" : "Stopped"}
            </strong>
          </div>
        </div>
      </div>
      <div style={styles.navbar}>
        <Link to="/dashboard" style={styles.navLinkActive}>Dashboard</Link>
        <Link to="/history" style={styles.navLink}>History</Link>
        <Link to="/alerts" style={styles.navLink}>Alerts</Link>
        <Link to="/settings" style={styles.navLink}>Settings</Link>
      </div>
    </div>
  );
}
function InfoBox({ label, value, styles, blue, color }) {
  return (
    <div style={styles.infoBox}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={{ color: color || (blue ? "#38bdf8" : "inherit") }}>
        {value}
      </strong>
    </div>
  );
}
const getStyles = (theme, statusColor) => ({
  page: {
    minHeight: "100vh",
    padding: "22px",
    fontFamily: "Arial, sans-serif",
    background: theme.pageBg,
    color: theme.text,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "14px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "900",
    color: theme.text,
  },
  subtitle: {
    marginTop: "5px",
    color: theme.subtext,
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  liveBadge: {
    background: `${statusColor}22`,
    color: statusColor,
    border: `1px solid ${statusColor}66`,
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
    background: statusColor,
    borderRadius: "50%",
  },
  logoutButton: {
    background: "rgba(239,68,68,0.15)",
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.4)",
    padding: "10px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr",
    gap: "16px",
    alignItems: "stretch",
  },
  card: {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.13)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    marginBottom: "14px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: theme.text,
  },
  cardSubtitle: {
    marginTop: "5px",
    color: theme.subtext,
    fontSize: "13px",
  },
  percentageBadge: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#38bdf8",
    background: "rgba(14,165,233,0.12)",
    border: "1px solid rgba(56,189,248,0.35)",
    padding: "9px 14px",
    borderRadius: "16px",
  },
  tankLayout: {
    display: "grid",
    gridTemplateColumns: "210px 1fr",
    gap: "16px",
    alignItems: "center",
  },
  bigTank: {
    width: "190px",
    height: "280px",
    borderRadius: "32px",
    border: `5px solid ${theme.border}`,
    background: theme.softBg,
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    boxShadow: "0 0 35px rgba(56,189,248,0.25)",
    animation: "pulseGlow 3s infinite ease-in-out",
  },
  waterContainer: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    background:
      "linear-gradient(to top, #0369a1 0%, #0284c7 45%, #0ea5e9 75%, #38bdf8 100%)",
    transition: "height 1.2s ease-in-out",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    animation: "waterFloat 3.5s infinite ease-in-out",
  },
  waveBack: {
    position: "absolute",
    top: "-68px",
    left: "-80px",
    width: "360px",
    height: "70px",
    background: "#0284c7",
    opacity: 0.75,
    borderRadius: "44% 56% 48% 52%",
    animation: "waveMoveSlow 4s infinite ease-in-out",
  },
 
  waterGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 15%, rgba(255,255,255,0.22), transparent 42%)",
    pointerEvents: "none",
  },
  waterShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "55%",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
    animation: "waterShine 4.5s infinite ease-in-out",
    pointerEvents: "none",
  },
  waterText: {
    position: "relative",
    zIndex: 3,
    color: "#ffffff",
    fontSize: "38px",
    fontWeight: "900",
    textShadow: "0 4px 18px rgba(0,0,0,0.3)",
  },
  tankInfo: {
    display: "grid",
    gap: "9px",
  },
  infoBox: {
    background: theme.softBg,
    border: `1px solid ${theme.border}`,
    padding: "11px 13px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    color: theme.text,
    fontSize: "14px",
  },
  infoLabel: {
    color: theme.subtext,
  },
  qualityCircle: {
    display: "flex",
    justifyContent: "center",
    margin: "18px 0",
  },
  qualityInner: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    border: "7px solid",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "900",
    fontSize: "16px",
    background: theme.softBg,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "11px 0",
    borderBottom: `1px solid ${theme.border}`,
    color: theme.text,
    fontSize: "14px",
  },
  targetButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "9px",
    margin: "14px 0",
  },
  targetButton: {
    background: theme.softBg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    padding: "11px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  targetButtonActive: {
    background: "#0ea5e9",
    color: "#ffffff",
    border: "1px solid #0ea5e9",
    padding: "11px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  pumpButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "16px",
  },
  startButton: {
    flex: 1,
    background: "#22c55e",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "13px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  stopButton: {
    flex: 1,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "13px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  note: {
    color: theme.subtext,
    fontSize: "13px",
    marginTop: "12px",
    lineHeight: "1.45",
  },
  navbar: {
    marginTop: "18px",
    borderRadius: "18px",
    padding: "14px",
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
export default Dashboard;