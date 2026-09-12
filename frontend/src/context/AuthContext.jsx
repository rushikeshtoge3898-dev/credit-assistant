import { createContext, useContext, useState, useEffect } from "react";
import api, { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          // Standardized endpoint: /api/auth/me with backward compatible fallback to /users/me
          let userData;
          try {
            userData = await authAPI.getMe();
          } catch (e) {
            const fallbackRes = await api.get("/users/me");
            userData = fallbackRes.data;
          }
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    }
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    // Standardized endpoint: /api/auth/login
    let data;
    try {
      data = await authAPI.login(email, password);
    } catch (err) {
      // Fallback to legacy endpoint if /api/auth/login was not reachable
      if (err.response?.status === 404) {
        const params = new URLSearchParams();
        params.append("username", email);
        params.append("password", password);
        const res = await api.post("/auth/login", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        data = res.data;
      } else {
        throw err;
      }
    }

    const { access_token, user: userData } = data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(userData));
    return data;
  };

  const register = async (name, email, password) => {
    // Standardized endpoint: /api/auth/register
    try {
      await authAPI.register(name, email, password);
    } catch (err) {
      if (err.response?.status === 404) {
        await api.post("/auth/register", { name, email, password });
      } else {
        throw err;
      }
    }
    // After successful registration, log in automatically
    return await login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
