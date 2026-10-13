import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function DashboardLayout({ children, role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const name = localStorage.getItem("user_name") || "User";

  // =====================================================
  // LOGOUT
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
  // ROLE-WISE MENUS
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
  // MENU ROUTES
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
  // PAGE TITLE
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
  // ICONS
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
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-64 flex-col bg-slate-900 text-white">

        {/* ================= LOGO ================= */}

        <div className="flex h-20 shrink-0 items-center border-b border-slate-800 px-5">

          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">

            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <rect
                x="7"
                y="3"
                width="10"
                height="18"
                rx="2"
              />

              <path
                strokeLinecap="round"
                d="M10 6h4"
              />

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

        </div>

        {/* ================= MENU ================= */}

        <nav className="flex-1 overflow-y-auto px-3 py-3">

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
                    }
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >

                  <span className="mr-2.5 flex h-7 w-7 items-center justify-center text-sm">
                    {getIcon(item)}
                  </span>

                  <span className="truncate">
                    {item}
                  </span>

                </button>
              );

            })}

          </div>

        </nav>

        {/* ================= LOGOUT ================= */}

        <div className="shrink-0 border-t border-slate-800 px-3 py-3">

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors duration-150 hover:bg-red-600 hover:text-white"
          >

            <span className="mr-2.5 flex h-7 w-7 items-center justify-center">
              ⇥
            </span>

            Logout

          </button>

        </div>

      </aside>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className="ml-64 flex min-h-screen flex-col">

        {/* ================= HEADER ================= */}

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">

          {/* PAGE TITLE */}

          <h1 className="text-xl font-bold text-slate-900">
            {getPageTitle()}
          </h1>

          <div className="flex items-center gap-4">

            {/* ================= NOTIFICATION ================= */}

            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
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

                <path
                  strokeLinecap="round"
                  d="M10 21h4"
                />

              </svg>

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>

            </button>

            {/* ================= USER ================= */}

            <div className="flex items-center gap-3 border-l border-slate-200 pl-3">

              <div className="text-right">

                <p className="text-sm font-semibold text-slate-800">
                  {name}
                </p>

                <p className="text-[11px] text-slate-500">
                  {role}
                </p>

              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">

                <span className="text-sm font-bold text-blue-700">
                  {name.charAt(0).toUpperCase()}
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* ================= MAIN CONTENT ================= */}

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* ================= FOOTER ================= */}

        <footer className="flex h-12 shrink-0 items-center justify-center border-t border-slate-200 bg-white">

          <p className="text-xs text-slate-500">
            © 2026 Mobile Repair Centre — Repair Management System
          </p>

        </footer>

      </div>

      {/* =====================================================
          LOGOUT CONFIRMATION
      ===================================================== */}

      {showLogoutConfirm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">

          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl">

            <div className="h-1 rounded-t-xl bg-blue-700"></div>

            <div className="p-6">

              <h2 className="text-lg font-bold text-slate-900">
                Confirm Logout
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to logout from your account?
              </p>

              <div className="mt-6 flex justify-end gap-3">

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