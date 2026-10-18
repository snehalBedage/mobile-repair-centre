
import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  password: "",
  confirm_password: "",
  address: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-1.5 block text-sm font-medium text-slate-700";

function RequiredLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children} <span className="font-bold text-red-500">*</span>
    </label>
  );
}

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [previousPageUrl, setPreviousPageUrl] = useState(null);

  const [formData, setFormData] = useState({ ...emptyForm });
  const [editData, setEditData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    status: "ACTIVE",
  });

  // LOAD CUSTOMERS
  async function fetchCustomers(searchValue = "") {
    try {
      setLoading(true);
      setError("");

     const response = await api.get("/customers/", {
  params: {
    ...(searchValue ? { search: searchValue } : {}),
    page: currentPage,
  },
});

      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data.results || []);
      if (Array.isArray(data)) {
  setCustomers(data);
  setTotalCustomers(data.length);
  setNextPageUrl(null);
  setPreviousPageUrl(null);
} else {
  setCustomers(data.results || []);
  setTotalCustomers(data.count || 0);
  setNextPageUrl(data.next || null);
  setPreviousPageUrl(data.previous || null);
}
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to load customers."
      );
      setCustomers([]);
    } finally {
      setLoading(false);
    }
}
useEffect(() =>
   {
  const timer = setTimeout(() => {
    fetchCustomers(search.trim());
  }, 400);

  return () => clearTimeout(timer);
}, [search, currentPage]);


  // FORM INPUT HANDLERS
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "mobile" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditData((previous) => ({
      ...previous,
      [name]:
        name === "mobile"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value,
    }));
  }

  // ADD CUSTOMER
  function openAddForm() {
    setError("");
    setSuccess("");
    setFormData({ ...emptyForm });
    setShowAddForm(true);
  }

  function closeAddForm() {
    if (saving) return;
    setShowAddForm(false);
    setFormData({ ...emptyForm });
    setError("");
  }

  async function handleCreateCustomer(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.mobile.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirm_password
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (formData.mobile.length !== 10) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/auth/register/", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        mobile: formData.mobile.trim(),
        address: formData.address.trim(),
      });

      setShowAddForm(false);
      setFormData({ ...emptyForm });
      setSuccess("Customer created successfully.");

      await fetchCustomers(search.trim());
    } catch (err) {
      const data = err.response?.data;
      const firstError = data && Object.values(data).flat()[0];

      setError(
        typeof firstError === "string"
          ? firstError
          : "Unable to create customer. Please check the entered details."
      );
    } finally {
      setSaving(false);
    }
  }

  // EDIT CUSTOMER
  function openEditForm(customer) {
    setError("");
    setSuccess("");
    setSelectedCustomer(customer);

    setEditData({
      name: customer.name || "",
      mobile: customer.mobile || "",
      email: customer.email || "",
      address: customer.address || "",
      status: customer.status || "ACTIVE",
    });

    setShowEditForm(true);
  }

  function closeEditForm() {
    if (saving) return;
    setShowEditForm(false);
    setSelectedCustomer(null);
    setError("");
  }

  async function handleUpdateCustomer(event) {
    event.preventDefault();

    if (!selectedCustomer) return;

    setError("");
    setSuccess("");

    if (
      !editData.name.trim() ||
      !editData.mobile.trim() ||
      !editData.email.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (editData.mobile.length !== 10) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    try {
      setSaving(true);

      await api.patch(`/customers/${selectedCustomer.id}/`, {
        name: editData.name.trim(),
        mobile: editData.mobile.trim(),
        email: editData.email.trim(),
        address: editData.address.trim(),
        status: editData.status,
      });

      setShowEditForm(false);
      setSelectedCustomer(null);
      setSuccess("Customer details updated successfully.");

      await fetchCustomers(search.trim());
    } catch (err) {
      const data = err.response?.data;
      const firstError = data && Object.values(data).flat()[0];

      setError(
        typeof firstError === "string"
          ? firstError
          : "Unable to update customer. Please check the entered details."
      );
    } finally {
      setSaving(false);
    }
  }

  function statusStyle(status) {
    return status === "ACTIVE"
      ? "bg-green-50 text-green-700"
      : "bg-slate-100 text-slate-600";
  }

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Customer Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer profiles and their information.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <span className="text-lg leading-none">+</span>
          Add Customer
        </button>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && !showAddForm && !showEditForm && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* SEARCH CARD — SAME STYLE AS DEVICES */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Search Customers
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Search by customer name, customer code, mobile or email.
          </p>
        </div>

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers..."
            aria-label="Search customers"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-11 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Showing {customers.length} customer
          {customers.length !== 1 ? "s" : ""}
      </p>
  </div>

      {/* CUSTOMER TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                {[
                  "Customer Code",
                  "Customer",
                  "Mobile",
                  "Email",
                  "Address",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-xs font-semibold uppercase tracking-wider"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      No customers found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try another search or add a customer.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                      {customer.customer_code || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {customer.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        ID: {customer.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {customer.mobile || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {customer.email || "—"}
                    </td>

                    <td className="max-w-[220px] px-5 py-4 text-sm text-slate-600">
                      <span className="line-clamp-2">
                        {customer.address || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                          customer.status
                        )}`}
                      >
                        {customer.status || "ACTIVE"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openEditForm(customer)}
                        className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
        </table>
    </div>
<div className="border-t border-slate-200 px-5 py-3">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-xs text-slate-500">
      Showing {customers.length} of {totalCustomers} customers
    </p>

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setCurrentPage((page) => page - 1)}
        disabled={!previousPageUrl || loading}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      <span className="text-sm text-slate-600">
        Page {currentPage}
      </span>

      <button
        type="button"
        onClick={() => setCurrentPage((page) => page + 1)}
        disabled={!nextPageUrl || loading}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
</div>
</div>


      {/* ADD CUSTOMER MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <form onSubmit={handleCreateCustomer}>
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Add Customer
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the customer's details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeAddForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <div>
                  <RequiredLabel htmlFor="add-name">
                    Customer Name
                  </RequiredLabel>
                  <input
                    id="add-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="Enter customer name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="add-mobile">
                    Mobile Number
                  </RequiredLabel>
                  <input
                    id="add-mobile"
                    type="tel"
                    name="mobile"
                    inputMode="numeric"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    minLength={10}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <RequiredLabel htmlFor="add-email">
                    Email Address
                  </RequiredLabel>
                  <input
                    id="add-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    placeholder="Enter email address"
                    className={inputClass}
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="add-password">
                    Password
                  </RequiredLabel>
                  <input
                    id="add-password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder="Create password"
                    className={inputClass}
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="add-confirm-password">
                    Confirm Password
                  </RequiredLabel>
                  <input
                    id="add-confirm-password"
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="add-address"
                    className={labelClass}
                  >
                    Address
                  </label>
                  <textarea
                    id="add-address"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter customer address (optional)"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeAddForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditForm && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <form onSubmit={handleUpdateCustomer}>
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Edit Customer
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Customer Code: {selectedCustomer.customer_code || "—"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <div>
                  <RequiredLabel htmlFor="edit-name">
                    Customer Name
                  </RequiredLabel>
                  <input
                    id="edit-name"
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    required
                    maxLength={100}
                    className={inputClass}
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="edit-mobile">
                    Mobile Number
                  </RequiredLabel>
                  <input
                    id="edit-mobile"
                    type="tel"
                    name="mobile"
                    inputMode="numeric"
                    value={editData.mobile}
                    onChange={handleEditChange}
                    required
                    minLength={10}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <RequiredLabel htmlFor="edit-email">
                    Email Address
                  </RequiredLabel>
                  <input
                    id="edit-email"
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleEditChange}
                    required
                    maxLength={150}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="edit-address"
                    className={labelClass}
                  >
                    Address
                  </label>
                  <textarea
                    id="edit-address"
                    rows={3}
                    name="address"
                    value={editData.address}
                    onChange={handleEditChange}
                    placeholder="Enter customer address (optional)"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="edit-status"
                    className={labelClass}
                  >
                    Customer Status
                  </label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editData.status}
                    onChange={handleEditChange}
                    className={inputClass}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Select whether this customer profile is active or inactive.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeEditForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

}
export default Customers;