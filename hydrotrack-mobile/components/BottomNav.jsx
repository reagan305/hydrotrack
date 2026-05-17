import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { goToScreen } from "../utils/pagerNav";
import { getAppTheme } from "../utils/appTheme";

export default function BottomNav({
  currentScreen,
  themeMode = "dark",
}) {
  const theme = getAppTheme(themeMode);
  const styles = getStyles(theme);

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => goToScreen("dashboard")}>
        <Text
          style={
            currentScreen === "dashboard"
              ? styles.navActive
              : styles.navText
          }
        >
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => goToScreen("history")}>
        <Text
          style={
            currentScreen === "history"
              ? styles.navActive
              : styles.navText
          }
        >
          History
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => goToScreen("alerts")}>
        <Text
          style={
            currentScreen === "alerts"
              ? styles.navActive
              : styles.navText
          }
        >
          Alerts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => goToScreen("settings")}>
        <Text
          style={
            currentScreen === "settings"
              ? styles.navActive
              : styles.navText
          }
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    navbar: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginTop: 25,
      backgroundColor: theme.nav,
      paddingVertical: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },

    navText: {
      color: theme.subtext,
      fontWeight: "700",
      fontSize: 13,
    },

    navActive: {
      color: "#38bdf8",
      fontWeight: "900",
      fontSize: 13,
    },
  });