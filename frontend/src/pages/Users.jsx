
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const value = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);

        return `${field}: ${value}`;
      })
      .join(" | ");
  }

  return error?.message || "Something went wrong. Please try again.";
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      if (status) params.active = status;

      const response = await api.get("/auth/users/", { params });

      // Supports both paginated and non-paginated API responses.
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results;

      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, role, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers]);

  function showMessage(message) {
    setSuccess(message);
    setError("");
  }

  async function handleCreateStaff(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/users/", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setForm(emptyForm);
      setShowCreateForm(false);
      showMessage("Staff account created successfully.");
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(user) {
    const action = user.is_active ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${user.name}'s account?`
      )
    ) {
      return;
    }

    setActionId(user.id);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/auth/users/${user.id}/status/`, {
        is_active: !user.is_active,
      });

      showMessage(
        `${user.name}'s account ${user.is_active ? "deactivated" : "activated"} successfully.`
      );

      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(user) {
    const confirmed = window.confirm(
      `Delete ${user.name} (${user.email}) permanently? This action may not be reversible.`
    );

    if (!confirmed) return;

    setActionId(user.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/auth/users/${user.id}/`);

      showMessage("User deleted successfully.");
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.is_active).length;
  const staffUsers = users.filter((user) => user.role === "STAFF").length;
  const customerUsers = users.filter(
    (user) => user.role === "CUSTOMER"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Administration
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Users &amp; Roles
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage accounts, staff access and user status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current);
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {showCreateForm ? "Cancel" : "+ Add Staff"}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Loaded Users",
              value: totalUsers,
              color: "text-slate-900",
            },
            {
              label: "Active Users",
              value: activeUsers,
              color: "text-green-700",
            },
            {
              label: "Staff Accounts",
              value: staffUsers,
              color: "text-blue-700",
            },
            {
              label: "Customer Accounts",
              value: customerUsers,
              color: "text-violet-700",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {item.label}
              </p>
              <p className={`mt-2 text-3xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Create staff form */}
        {showCreateForm && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Create Staff Account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The new account will be assigned the STAFF role.
            </p>

            <form
              onSubmit={handleCreateStaff}
              className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="staff-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="staff-name"
                  type="text"
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Enter staff name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="staff-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="staff-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="staff@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="staff-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Temporary Password
                </label>
                <input
                  id="staff-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Share the temporary password securely with the staff member.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Staff"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setForm(emptyForm);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Filters */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label
                htmlFor="user-search"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search Users
              </label>
              <input
                id="user-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="role-filter"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Role
              </label>
              <select
                id="role-filter"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
                <option value="CUSTOMER">Customer</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Account Status
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        {/* Users table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                User Accounts
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Accounts returned by the current filters
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading user accounts...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium text-slate-700">
                No users found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                     
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                       {user.name}
                    </p>
                  </td>

                    <td className="px-5 py-4 text-slate-600">
                      {user.email || "—"}
                  </td>


                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.is_active
                                ? "bg-green-600"
                                : "bg-red-600"
                            }`}
                          />
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => handleStatusChange(user)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                              user.is_active
                                ? "border border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => handleDelete(user)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        
      </div>
    </div>
  );
}
