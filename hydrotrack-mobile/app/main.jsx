import { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";

import DashboardScreen from "../components/screens/DashboardScreen";
import HistoryScreen from "../components/screens/HistoryScreen";
import AlertsScreen from "../components/screens/AlertsScreen";
import SettingsScreen from "../components/screens/SettingsScreen";
import { setPagerController } from "../utils/pagerNav";

export default function MainScreen() {
  const pagerRef = useRef(null);

  useEffect(() => {
    setPagerController({
      setPage: (page) => {
        pagerRef.current?.setPage(page);
      },
    });
  }, []);

  return (
    <View style={styles.container}>
      <PagerView ref={pagerRef} style={styles.pager} initialPage={0}>
        <View key="dashboard" style={styles.page}>
          <DashboardScreen />
        </View>

        <View key="history" style={styles.page}>
          <HistoryScreen />
        </View>

        <View key="alerts" style={styles.page}>
          <AlertsScreen />
        </View>

        <View key="settings" style={styles.page}>
          <SettingsScreen />
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  pager: {
    flex: 1,
  },

  page: {
    flex: 1,
  },
});