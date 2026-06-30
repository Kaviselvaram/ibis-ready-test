import { useAuthenticationController } from "./hooks/useAuthenticationController";

import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { RouteFallback } from "./routes/RouteFallback";
import { AppLayout } from "./components/layout/AppLayout";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { ShamayimToggleSwitch } from "./components/ui/switch";
import { TimelineContent } from "./components/ui/timeline-animation";
import { AwardBadge } from "./components/ui/award-badge";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  CalendarDays,
  Clipboard,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Layers3,
  Lock,
  LogOut,
  Mail,
  Menu,
  Play,
  Plus,
  ReceiptIndianRupee,
  Save,
  Trash2,
  Trophy,
  Upload,
  Users,
  Video,
  WandSparkles,
  X,
  ZoomIn,
  ZoomOut,
  Zap
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import "./styles.css";

import { UIProvider, useUI } from "./contexts/UIContext";
import { AdminProvider } from "./contexts/AdminContext";
import { CourseProvider } from "./contexts/CourseContext";
import { AccessProvider } from "./contexts/AccessContext";

import HomeSession from "./components/common/HomeSession";
import Landing from "./components/common/Landing";
import WhyIbisView from "./components/common/WhyIbisView";
import StudentPortal from "./components/student/StudentPortal";
import ChapterView from "./components/student/ChapterView";
import AdminPanel from "./components/admin/AdminPanel";
import BatchControl from "./components/admin/BatchControl";
import Signup from "./components/auth/Signup";
import Checkout from "./components/auth/Checkout";
import LegalInfoPage from "./components/common/LegalInfoPage";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { BatchModal } from "./components/student/StudentPortal";

const FaultyTerminal = React.lazy(() => import("./components/ui/FaultyTerminal"));

function App() {
  const { initializeSession } = useAuthenticationController();
  
  useEffect(() => {
    initializeSession();
  }, []);

  const { batchOpen, setBatchOpen } = useUI();
  
  return (
    <AppLayout>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<HomeSession />} />
          <Route path="/signup" element={<Signup initialMode="signup" />} />
          <Route path="/login" element={<Signup initialMode="login" />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/student" element={<StudentPortal />} />
          <Route path="/chapter" element={<ChapterView />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/batches" element={<BatchControl />} />
        </Route>

        {/* Unprotected Static Routes */}
        <Route path="/why-ibis" element={<WhyIbisView />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/legal/:page" element={<LegalInfoPage />} />
        <Route path="/legal" element={<LegalInfoPage />} />

        {/* Fallback */}
        <Route path="*" element={<RouteFallback />} />
      </Routes>
      {batchOpen && <BatchModal onClose={() => setBatchOpen(false)} />}
    </AppLayout>
  );
}

const RootApp = () => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <UIProvider>
            <AdminProvider>
              <AccessProvider>
                <CourseProvider>
                  <App />
                </CourseProvider>
              </AccessProvider>
            </AdminProvider>
          </UIProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<RootApp />);
}

