import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, ClipboardList, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { Brand } from "../ui/LegacyUI";
import { useAuthenticationController } from "../../hooks/useAuthenticationController";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/content", label: "Content", icon: BookOpen },
  { to: "/admin/tests", label: "Tests", icon: ClipboardList },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings }
];

export default function AdminLayout() {
  const { signOut, user } = useAuthenticationController();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = async () => { await signOut(); };

  return (
    <div className="adminx">
      <button className="adminx-burger" aria-label="Toggle menu" onClick={() => setMobileOpen((v) => !v)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`adminx-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="adminx-brand">
          <Brand admin />
        </div>
        <nav className="adminx-nav" aria-label="Admin sections">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `adminx-navitem ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="adminx-sidefoot">
          <div className="adminx-whoami">
            <span className="adminx-avatar">{(user?.name || "A").slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{user?.name || "Admin"}</strong>
              <small>Administrator</small>
            </div>
          </div>
          <button className="adminx-logout" onClick={onLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="adminx-scrim" onClick={() => setMobileOpen(false)} />}

      <main className="adminx-main">
        <Outlet />
      </main>
    </div>
  );
}
