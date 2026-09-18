import { createContext, useContext, useState, useEffect } from "react";
import api, { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Purge any stale legacy guest data from localStorage on initialization
  try {
    localStorage.removeItem("isGuest");
    localStorage.removeItem("guest_demo_profile");
    localStorage.removeItem("guest_demo_accounts");
    localStorage.removeItem("guest_demo_payments");
    localStorage.removeItem("guest_demo_score_history");
    localStorage.removeItem("guest_demo_goals");
    localStorage.removeItem("guest_demo_recs");
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.isGuest || parsed?.id === "guest") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  } catch (e) {
    // Ignore storage errors
  }

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed?.isGuest ? null : parsed;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [loading, setLoading] = useState(() => {
    // If token exists, verify asynchronously; otherwise immediately ready
    return !!localStorage.getItem("token");
  });

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
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
    let data;
    try {
      data = await authAPI.login(email, password);
    } catch (err) {
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

  const register = async (name, email, password, phoneNumber = null) => {
    try {
      await authAPI.register(name, email, password, phoneNumber);
    } catch (err) {
      if (err.response?.status === 404) {
        await api.post("/auth/register", {
          name,
          email,
          password,
          phone_number: phoneNumber,
        });
      } else {
        throw err;
      }
    }
    return await login(email, password);
  };

  /**
   * Set user authenticated via Firebase (Google Sign-In)
   */
  const loginWithFirebaseUser = (fbUser, authToken = null) => {
    const sessionUser = {
      id: fbUser.id || fbUser.uid || Date.now(),
      name: fbUser.displayName || fbUser.name || "Authenticated Member",
      email: fbUser.email || (fbUser.phoneNumber ? `${fbUser.phoneNumber}@phone.auth` : "member@creditassistant.local"),
      isFirebase: true,
    };

    if (authToken) {
      setToken(authToken);
      localStorage.setItem("token", authToken);
    }

    setUser(sessionUser);
    localStorage.setItem("user", JSON.stringify(sessionUser));
    return sessionUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        loginWithFirebaseUser,
        logout,
      }}
    >
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
