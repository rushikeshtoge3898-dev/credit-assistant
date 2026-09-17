import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ScoreHistory from "./pages/ScoreHistory";
import Accounts from "./pages/Accounts";
import Goals from "./pages/Goals";
import AIAssistant from "./pages/AIAssistant";
import Profile from "./pages/Profile";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes enclosed in Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/score-history" element={<ScoreHistory />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Fallback routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;