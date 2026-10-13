
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

import Customers from "./pages/Customers";
import Devices from "./pages/Devices";
import Technicians from "./pages/Technicians";
import JobCards from "./pages/JobCards";
import JobCardDetail from "./pages/JobCardDetail";
import TrackRepair from "./pages/TrackRepair";
import Estimates from "./pages/Estimates";
import SpareParts from "./pages/SpareParts";
import JobParts from "./pages/JobParts";
import Payments from "./pages/Payments";
import Warranties from "./pages/Warranties";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import MyDevices from "./pages/MyDevices";
import MyRepairs from "./pages/MyRepairs";
import MyEstimates from "./pages/MyEstimates";
import MyPayments from "./pages/MyPayments";
import MyWarranties from "./pages/MyWarranties";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleLayout from "./layouts/RoleLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC PAGES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:uid/:token/"
          element={<ResetPassword />}
        />

        {/* PUBLIC REPAIR TRACKING */}
        <Route
          path="/track/:trackingToken"
          element={<TrackRepair />}
        />

        {/* ADMIN AND STAFF LAYOUT */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
              <RoleLayout />
            </ProtectedRoute>
          }
        >
          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* STAFF DASHBOARD */}
          <Route
            path="/staff-dashboard"
            element={
              <ProtectedRoute allowedRoles={["STAFF"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* SHARED ADMIN AND STAFF PAGES */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/job-cards" element={<JobCards />} />
          <Route path="/job-cards/:id" element={<JobCardDetail />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/job-parts" element={<JobParts />} />
          <Route path="/payments" element={<Payments />} />

          {/* ADMIN AND STAFF WARRANTIES */}
          <Route
            path="/warranties"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
                <Warranties />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ONLY REPORTS */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ONLY USERS AND ROLES */}
          <Route
            path="/users-roles"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ONLY AUDIT LOGS */}
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* CUSTOMER LAYOUT */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <RoleLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/customer-dashboard"
            element={<CustomerDashboard />}
          />
          <Route path="/my-estimates" element={<MyEstimates />} />
          <Route path="/my-payments" element={<MyPayments />} />
          <Route path="/my-warranties" element={<MyWarranties />} />
          <Route
  path="/my-devices"
  element={<MyDevices />}
/>

          <Route
  path="/my-repairs"
  element={<MyRepairs />}
/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
