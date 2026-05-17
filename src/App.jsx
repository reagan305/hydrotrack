import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Alerts from "./pages/Alerts.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import { getSettings } from "./utils/storage";

function App() {
  useEffect(() => {
    const settings = getSettings();
    document.body.classList.remove("light-mode", "dark-mode");
    document.body.classList.add(
      settings.theme === "dark" ? "dark-mode" : "light-mode"
    );
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;