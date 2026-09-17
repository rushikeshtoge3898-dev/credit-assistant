import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "mr", label: "Marathi", nativeName: "मराठी" },
  { code: "hi", label: "Hindi", nativeName: "हिंदी" },
];

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem("credit_assistant_lang") || "en";
  });

  const setLanguage = (langCode) => {
    if (["en", "mr", "hi"].includes(langCode)) {
      setCurrentLanguage(langCode);
      localStorage.setItem("credit_assistant_lang", langCode);
    }
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  /**
   * Helper function to retrieve nested translated string.
   * e.g. t("nav.dashboard", "Dashboard")
   */
  const t = (keyPath, fallback = "") => {
    const keys = keyPath.split(".");
    
    // Try current language first
    let currentVal = translations[currentLanguage];
    for (const k of keys) {
      if (currentVal && typeof currentVal === "object" && k in currentVal) {
        currentVal = currentVal[k];
      } else {
        currentVal = undefined;
        break;
      }
    }

    if (currentVal !== undefined && currentVal !== null) {
      return currentVal;
    }

    // Fallback to English
    let englishVal = translations.en;
    for (const k of keys) {
      if (englishVal && typeof englishVal === "object" && k in englishVal) {
        englishVal = englishVal[k];
      } else {
        englishVal = undefined;
        break;
      }
    }

    if (englishVal !== undefined && englishVal !== null) {
      return englishVal;
    }

    return fallback || keyPath;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
