import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, ClipboardList, Users, Boxes, Settings, LogOut, ChevronDown } from "lucide-react";
import { Brand } from "../ui/LegacyUI";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/content", label: "Content", icon: BookOpen },
  { to: "/admin/tests", label: "Tests", icon: ClipboardList },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/batches", label: "Batches", icon: Boxes },
  { to: "/admin/settings", label: "Settings", icon: Settings }
];

export default function AdminLayout() {
  const { signOut, user } = useAuthenticationController();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const onLogout = async () => { await signOut(); };

  // Close the account menu on outside click or route change.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const initial = (user?.name || "A").slice(0, 1).toUpperCase();

  return (
    <div className="adminx">
      <header className="adminx-topbar">
        <div className="adminx-topbar-brand">
          <Brand admin />
        </div>

        <nav className="adminx-topnav" aria-label="Admin sections">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `adminx-navitem ${isActive ? "active" : ""}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="adminx-account" ref={menuRef}>
          <button className="adminx-account-btn" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>
            <span className="adminx-avatar">{initial}</span>
            <span className="adminx-account-name">{user?.name || "Admin"}</span>
            <ChevronDown size={15} className={`adminx-account-caret ${menuOpen ? "up" : ""}`} />
          </button>
          {menuOpen && (
            <div className="adminx-account-menu" role="menu">
              <div className="adminx-account-head">
                <strong>{user?.name || "Admin"}</strong>
                <small>Administrator</small>
              </div>
              <button className="adminx-account-item" onClick={onLogout} role="menuitem">
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="adminx-main">
        <Outlet />
      </main>
    </div>
  );
}
