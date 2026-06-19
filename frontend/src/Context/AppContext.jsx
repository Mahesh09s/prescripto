import { createContext, useState, useEffect, useCallback } from "react";
import { doctors as staticDoctors } from "../assets/assets";
import api from "../utils/api";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const currencySymbol = '₹';

  // ── Auth state — restored from localStorage on page reload ──────────────
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem("userRole") || null);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("userProfile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ── Doctors — start with static data, replace with live API data ─────────
  const [doctors, setDoctors] = useState(staticDoctors);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const isAuthenticated = !!token;

  // ── Sync auth state → localStorage ───────────────────────────────────────
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userProfile");
    }
  }, [token]);

  useEffect(() => {
    if (userRole) localStorage.setItem("userRole", userRole);
  }, [userRole]);

  useEffect(() => {
    if (userProfile) localStorage.setItem("userProfile", JSON.stringify(userProfile));
  }, [userProfile]);

  // ── Fetch live doctors from API ───────────────────────────────────────────
  // Falls back to static data if the API is unavailable (offline / cold start)
  const fetchDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const { data } = await api.get("/doctors");
      if (data.success && Array.isArray(data.doctors) && data.doctors.length > 0) {
        setDoctors(data.doctors);
      }
      // If API returns empty array, keep static data so UI isn't blank
    } catch (err) {
      console.warn("Could not fetch doctors from API, using static data:", err.message);
      // Keep staticDoctors — already set as initial state
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const login = useCallback(({ token, role, patient, doctor }) => {
    setToken(token);
    setUserRole(role);
    setUserProfile(patient || doctor || null);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserRole(null);
    setUserProfile(null);
  }, []);

  // ── Refresh user profile from server ─────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!token || !userRole) return;
    try {
      // doctors → GET /api/doctors/profile   (added in Fix 3)
      // patients → GET /api/patients/profile
      const endpoint = userRole === "doctor" ? "/doctors/profile" : "/patients/profile";
      const { data } = await api.get(endpoint);
      if (data.success) {
        setUserProfile(data.doctor || data.patient || null);
      }
    } catch (err) {
      // Silently ignore — user stays logged in with cached profile
      console.warn("Could not refresh profile:", err.message);
    }
  }, [token, userRole]);

  const value = {
    doctors,          // live API doctors (falls back to static)
    doctorsLoading,
    fetchDoctors,
    currencySymbol,
    token,
    userRole,
    isAuthenticated,
    userProfile,
    setUserProfile,
    login,
    logout,
    refreshProfile,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;