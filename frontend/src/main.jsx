import { useAuthenticationController } from "./hooks/useAuthenticationController";

import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";
import { AdminRoute } from "./routes/AdminRoute";
import { RouteFallback } from "./routes/RouteFallback";
import { AppLayout } from "./components/layout/AppLayout";
import React, { useEffect, useMemo, useState, useRef, Suspense } from "react";
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
import StudentPortal from "./components/student/StudentPortal";
import ChapterView from "./components/student/ChapterView";
import { BatchModal } from "./components/student/StudentPortal";
import { Routes, Route, BrowserRouter } from "react-router-dom";

// Route-level code splitting — admin, test-taking and secondary pages load on
// demand so a student never downloads admin code (and vice versa).
const WhyIbisView = React.lazy(() => import("./components/common/WhyIbisView"));
const TestCenter = React.lazy(() => import("./components/test/TestCenter"));
const TestHistory = React.lazy(() => import("./components/test/TestHistory"));
const TestResultPage = React.lazy(() => import("./components/test/TestResultPage"));
const AdminPanel = React.lazy(() => import("./components/admin/AdminPanel"));
const AdminLayout = React.lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = React.lazy(() => import("./components/admin/AdminDashboard"));
const TestManager = React.lazy(() => import("./components/admin/TestManager"));
const AdminStudents = React.lazy(() => import("./components/admin/AdminStudents"));
const AdminSettings = React.lazy(() => import("./components/admin/AdminSettings"));
const AdminBatches = React.lazy(() => import("./components/admin/AdminBatches"));
const Signup = React.lazy(() => import("./components/auth/Signup"));
const Checkout = React.lazy(() => import("./components/auth/Checkout"));
const LegalInfoPage = React.lazy(() => import("./components/common/LegalInfoPage"));

const FaultyTerminal = React.lazy(() => import("./components/ui/FaultyTerminal"));

function App() {
  const { initializeSession, resyncSession, isSignedIn } = useAuthenticationController();

  useEffect(() => {
    initializeSession();
  }, []);

  // Keep tier/access in sync with the database: re-issue the session token when
  // the tab regains focus and periodically while active. So if an admin flips a
  // student Free→Paid in the DB, the student's access updates without a manual
  // re-login (and the admin dashboard picks up changes the same way).
  useEffect(() => {
    if (!isSignedIn) return;
    const onFocus = () => resyncSession();
    const onVisible = () => { if (document.visibilityState === "visible") resyncSession(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    const iv = setInterval(() => { if (document.visibilityState !== "hidden") resyncSession(); }, 60000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(iv);
    };
  }, [isSignedIn, resyncSession]);

  const { batchOpen, setBatchOpen } = useUI();
  
  return (
    <AppLayout>
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="/test-center" element={<TestCenter />} />
          <Route path="/test-history" element={<TestHistory />} />
          <Route path="/test-result/:id" element={<TestResultPage />} />
        </Route>

        {/* Admin Routes — routed dashboard inside a universal top-nav layout */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<AdminPanel />} />
            <Route path="/admin/tests" element={<TestManager />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/batches" element={<AdminBatches />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Unprotected Static Routes */}
        <Route path="/why-ibis" element={<WhyIbisView />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/legal/:page" element={<LegalInfoPage />} />
        <Route path="/legal" element={<LegalInfoPage />} />

        {/* Fallback */}
        <Route path="*" element={<RouteFallback />} />
      </Routes>
      </Suspense>
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
  // Reuse the root across HMR reloads instead of calling createRoot twice.
  if (!container._reactRoot) {
    container._reactRoot = createRoot(container);
  }
  container._reactRoot.render(<RootApp />);
}

