import { createContext, useContext, useState, useEffect } from "react";
import api, { authAPI } from "../services/api";
import { guestData } from "../services/guestData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem("isGuest") === "true";
  });

  const [user, setUser] = useState(() => {
    if (localStorage.getItem("isGuest") === "true") {
      return {
        id: "guest",
        name: "Guest User",
        email: "guest@creditassistant.local",
        isGuest: true,
      };
    }
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    if (localStorage.getItem("isGuest") === "true") {
      return null;
    }
    return localStorage.getItem("token") || null;
  });

  const [loading, setLoading] = useState(() => {
    const guestStored = localStorage.getItem("isGuest") === "true";
    const tokenStored = !!localStorage.getItem("token");
    // If guest stored, we are ready immediately; if real token stored, verify asynchronously
    return !guestStored && tokenStored;
  });

  useEffect(() => {
    async function verifyUser() {
      // If currently in guest mode, ensure guest user is populated and skip server verification
      if (isGuest) {
        if (!user || !user.isGuest) {
          const guestUser = {
            id: "guest",
            name: "Guest User",
            email: "guest@creditassistant.local",
            isGuest: true,
          };
          setUser(guestUser);
          localStorage.setItem("user", JSON.stringify(guestUser));
        }
        setLoading(false);
        return;
      }

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
  }, [token, isGuest]);

  const login = async (email, password) => {
    setIsGuest(false);
    localStorage.removeItem("isGuest");

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
    setIsGuest(false);
    localStorage.removeItem("isGuest");

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
   * Enter Guest Mode - zero backend account or token generated.
   * Completely isolated and uses local demo datasets.
   */
  const loginAsGuest = () => {
    const guestUser = {
      id: "guest",
      name: "Guest User",
      email: "guest@creditassistant.local",
      isGuest: true,
    };
    setToken(null);
    setUser(guestUser);
    setIsGuest(true);
    localStorage.removeItem("token");
    localStorage.setItem("isGuest", "true");
    localStorage.setItem("user", JSON.stringify(guestUser));
    return guestUser;
  };

  /**
   * Set user authenticated via Firebase (Google Sign-In)
   */
  const loginWithFirebaseUser = (fbUser, authToken = null) => {
    setIsGuest(false);
    localStorage.removeItem("isGuest");

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
    setIsGuest(false);
    setToken(null);
    setUser(null);
    localStorage.removeItem("isGuest");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    guestData.resetGuestData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isGuest,
        loading,
        login,
        register,
        loginAsGuest,
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
