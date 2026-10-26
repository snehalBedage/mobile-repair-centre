
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function DashboardLayout({ children, role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const name = localStorage.getItem("user_name") || "User";

  // =====================================================
  // LOGOUT — EXISTING FUNCTIONALITY PRESERVED
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");

    navigate("/login");
  };

  // =====================================================
  // ROLE-WISE MENUS — EXISTING ITEMS PRESERVED
  // =====================================================

  const adminMenu = [
    "Dashboard",
    "Customers",
    "Devices",
    "Technicians",
    "Job Cards",
    "Estimates",
    "Spare Parts",
    "Job Parts",
    "Payments",
    "Warranties",
    "Reports",
    "Users & Roles",
    "Audit Logs",
  ];

  const staffMenu = [
    "Dashboard",
    "Customers",
    "Devices",
    "Technicians",
    "Job Cards",
    "Estimates",
    "Spare Parts",
    "Job Parts",
    "Payments",
    "Warranties",
  ];

  const customerMenu = [
    "Dashboard",
    "My Devices",
    "My Repairs",
    "My Estimates",
    "My Payments",
    "My Warranties",
  ];

  const menu =
    role === "ADMIN"
      ? adminMenu
      : role === "STAFF"
      ? staffMenu
      : customerMenu;

  // =====================================================
  // MENU ROUTES — EXISTING ROUTES PRESERVED
  // =====================================================

  const menuRoutes = {
    Dashboard: {
      ADMIN: "/admin-dashboard",
      STAFF: "/staff-dashboard",
      CUSTOMER: "/customer-dashboard",
    },

    Customers: "/customers",
    Devices: "/devices",
    Technicians: "/technicians",
    "Job Cards": "/job-cards",
    Estimates: "/estimates",
    "Spare Parts": "/spare-parts",
    "Job Parts": "/job-parts",
    Payments: "/payments",
    Warranties: "/warranties",
    Reports: "/reports",
    "Users & Roles": "/users-roles",
    "Audit Logs": "/audit-logs",

    "My Devices": "/my-devices",
    "My Repairs": "/my-repairs",
    "My Estimates": "/my-estimates",
    "My Payments": "/my-payments",
    "My Warranties": "/my-warranties",
  };

  // =====================================================
  // GET ROUTE FOR MENU ITEM
  // =====================================================

  const getMenuRoute = (item) => {
    if (item === "Dashboard") {
      return menuRoutes.Dashboard[role];
    }

    return menuRoutes[item];
  };

  // =====================================================
  // PAGE TITLE — EXISTING BEHAVIOUR PRESERVED
  // =====================================================

  const getPageTitle = () => {
    const currentPath = location.pathname;

    if (
      currentPath === "/admin-dashboard" ||
      currentPath === "/staff-dashboard" ||
      currentPath === "/customer-dashboard"
    ) {
      return "Dashboard";
    }

    const pageTitles = {
      "/customers": "Customers",
      "/devices": "Devices",
      "/technicians": "Technicians",
      "/job-cards": "Job Cards",
      "/estimates": "Estimates",
      "/spare-parts": "Spare Parts",
      "/job-parts": "Job Parts",
      "/payments": "Payments",
      "/warranties": "Warranties",
      "/reports": "Reports",
      "/users-roles": "Users & Roles",
      "/audit-logs": "Audit Logs",

      "/my-devices": "My Devices",
      "/my-repairs": "My Repairs",
      "/my-estimates": "My Estimates",
      "/my-payments": "My Payments",
      "/my-warranties": "My Warranties",
    };

    return pageTitles[currentPath] || "Dashboard";
  };

  // =====================================================
  // ACTIVE MENU
  // =====================================================

  const isActive = (item) => {
    const route = getMenuRoute(item);
    return route === location.pathname;
  };

  // =====================================================
  // ICONS — EXISTING ICONS PRESERVED
  // =====================================================

  const getIcon = (item) => {
    const icons = {
      Dashboard: "▦",
      Customers: "♙",
      Devices: "▯",
      Technicians: "⚒",
      "Job Cards": "▤",
      Estimates: "▥",
      "Spare Parts": "◇",
      "Job Parts": "◈",
      Payments: "▭",
      Warranties: "✓",
      Reports: "▥",
      "Users & Roles": "♙",
      "Audit Logs": "☷",

      "My Devices": "▯",
      "My Repairs": "⚒",
      "My Estimates": "▥",
      "My Payments": "▭",
      "My Warranties": "✓",
    };

    return icons[item] || "•";
  };

  // =====================================================
  // SIDEBAR — SHARED DESKTOP AND MOBILE MENU
  // =====================================================

  const sidebarContent = (
    <>
      {/* LOGO */}
      <div className="flex h-20 shrink-0 items-center border-b border-slate-800 px-5">
        <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <svg
            className="h-5 w-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <rect x="7" y="3" width="10" height="18" rx="2" />
            <path strokeLinecap="round" d="M10 6h4" />
            <circle
              cx="12"
              cy="18"
              r="0.7"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-white">
            Mobile Repair Centre
          </h1>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Repair Management System
          </p>
        </div>

        {/* CLOSE BUTTON — MOBILE ONLY */}
        <button
          type="button"
          onClick={() => setShowMobileMenu(false)}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-300 hover:bg-slate-800 md:hidden"
          aria-label="Close navigation menu"
        >
          ×
        </button>
      </div>

      {/* MENU */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        <div className="space-y-0.5">
          {menu.map((item) => {
            const active = isActive(item);

            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  const route = getMenuRoute(item);

                  if (route) {
                    navigate(route);
                    setShowMobileMenu(false);
                  }
                }}
                className={`flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="mr-2.5 flex h-7 w-7 shrink-0 items-center justify-center text-sm">
                  {getIcon(item)}
                </span>

                <span className="truncate">{item}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* LOGOUT */}
      <div className="shrink-0 border-t border-slate-800 px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setShowMobileMenu(false);
            setShowLogoutConfirm(true);
          }}
          className="flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors duration-150 hover:bg-red-600 hover:text-white"
        >
          <span className="mr-2.5 flex h-7 w-7 shrink-0 items-center justify-center">
            ⇥
          </span>
          Logout
        </button>
      </div>
    </>
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100">
      {/* DESKTOP SIDEBAR — SAME WIDTH AND POSITION */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col bg-slate-900 text-white md:flex">
        {sidebarContent}
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setShowMobileMenu(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/50"
          />

          <aside className="absolute bottom-0 left-0 top-0 flex w-[min(18rem,85vw)] flex-col bg-slate-900 text-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* RIGHT SIDE */}
      <div className="flex min-h-screen min-w-0 flex-col md:ml-64">
        {/* HEADER */}
        <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {/* HAMBURGER — MOBILE ONLY */}
            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={showMobileMenu}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* PAGE TITLE */}
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {/* NOTIFICATION — EXISTING DISPLAY PRESERVED */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                />
                <path strokeLinecap="round" d="M10 21h4" />
              </svg>

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* USER DETAILS */}
            <div className="flex min-w-0 items-center gap-2 border-l border-slate-200 pl-2 sm:gap-3 sm:pl-3">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-36 truncate text-sm font-semibold text-slate-800">
                  {name}
                </p>
                <p className="text-[11px] text-slate-500">{role}</p>
              </div>

              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100"
                title={`${name} (${role})`}
              >
                <span className="text-sm font-bold text-blue-700">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 p-3 sm:p-4 md:overflow-y-auto md:p-6">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="flex min-h-12 shrink-0 items-center justify-center border-t border-slate-200 bg-white px-3 py-3 text-center">
          <p className="text-xs text-slate-500">
            Mobile Repair Centre — Repair Management System
          </p>
        </footer>
      </div>

      {/* LOGOUT CONFIRMATION — EXISTING ACTIONS PRESERVED */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="h-1 rounded-t-xl bg-blue-700" />

            <div className="p-5 sm:p-6">
              <h2
                id="logout-dialog-title"
                className="text-lg font-bold text-slate-900"
              >
                Confirm Logout
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to logout from your account?
              </p>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
