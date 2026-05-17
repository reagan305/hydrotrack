import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signupUser } from "../firebase/auth";
import { themeColors } from "../utils/theme";

function Signup() {
  const navigate = useNavigate();
  const theme = themeColors();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await signupUser(formData.fullName, formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Account already exists. Please login instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(theme);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoCircle}>💧</div>

        <h1 style={styles.title}>HydroTrack</h1>
        <p style={styles.subtitle}>
          Create an account to manage your smart water tank system.
        </p>

        <form style={styles.form} onSubmit={handleSignup}>
          <input
            type="text"
            name="fullName"
            placeholder="Full name"
            value={formData.fullName}
            onChange={handleChange}
            style={styles.input}
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
          />

          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={styles.passwordInput}
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eye}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div style={styles.passwordWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={styles.passwordInput}
            />

            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eye}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/" style={styles.link}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    background: theme.pageBg,
    color: theme.text,
  },

  card: {
    width: "100%",
    maxWidth: "430px",
    borderRadius: "28px",
    padding: "34px 26px",
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    boxShadow: "0 25px 70px rgba(0,0,0,0.18)",
    textAlign: "center",
  },

  logoCircle: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "rgba(14,165,233,0.15)",
    border: "1px solid rgba(56,189,248,0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 16px auto",
    fontSize: "34px",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "900",
    color: theme.text,
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: "26px",
    fontSize: "14px",
    lineHeight: "1.5",
    color: theme.subtext,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  input: {
    padding: "14px 16px",
    borderRadius: "14px",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: theme.softBg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
  },

  passwordWrapper: {
    display: "flex",
    alignItems: "center",
    borderRadius: "14px",
    overflow: "hidden",
    background: theme.softBg,
    border: `1px solid ${theme.border}`,
  },

  passwordInput: {
    flex: 1,
    padding: "14px 16px",
    border: "none",
    fontSize: "15px",
    outline: "none",
    background: "transparent",
    color: theme.text,
  },

  eye: {
    cursor: "pointer",
    padding: "0 14px",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    color: theme.subtext,
  },

  button: {
    background: "#0ea5e9",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  error: {
    padding: "11px",
    borderRadius: "12px",
    fontSize: "14px",
    margin: 0,
    color: "#ef4444",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.35)",
  },

  footerText: {
    marginTop: "18px",
    fontSize: "14px",
    color: theme.subtext,
  },

  link: {
    color: "#0ea5e9",
    fontWeight: "bold",
    textDecoration: "none",
  },
});

export default Signup;