
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const STATUSES = [
  ["RECEIVED", "Received"],
  ["DIAGNOSIS", "Diagnosis"],
  ["ESTIMATE_PREPARED", "Estimate Prepared"],
  ["WAITING_FOR_APPROVAL", "Waiting for Approval"],
  ["APPROVED", "Approved"],
  ["REJECTED", "Rejected"],
  ["REPAIR_IN_PROGRESS", "Repair In Progress"],
  ["QC", "Quality Check"],
  ["QC_FAILED", "QC Failed"],
  ["READY_FOR_DELIVERY", "Ready for Delivery"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

const getList = (data) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

const getErrorMessage = (error) =>
  error.response?.data?.detail ||
  error.response?.data?.message ||
  Object.values(error.response?.data || {}).flat().join(" ") ||
  error.message ||
  "Something went wrong. Please try again.";

const getCustomerName = (job, customers) => {
  if (job.customer && typeof job.customer === "object") {
    return job.customer.name || job.customer.full_name || "Customer";
  }

  const customer = customers.find(
    (item) => String(item.id) === String(job.customer)
  );

  return (
    customer?.name ||
    customer?.full_name ||
    job.customer_name ||
    `Customer #${job.customer ?? "-"}`
  );
};

const getDeviceName = (job, devices) => {
  if (job.device && typeof job.device === "object") {
    return (
      [job.device.brand, job.device.model].filter(Boolean).join(" ") ||
      "Device"
    );
  }

  const device = devices.find(
    (item) => String(item.id) === String(job.device)
  );

  return (
    [device?.brand, device?.model].filter(Boolean).join(" ") ||
    job.device_name ||
    `Device #${job.device ?? "-"}`
  );
};

const getTechnicianName = (job, technicians) => {
  if (job.technician && typeof job.technician === "object") {
    return job.technician.name || "Unassigned";
  }

  const technician = technicians.find(
    (item) => String(item.id) === String(job.technician)
  );

  return (
    technician?.name ||
    job.technician_name ||
    (job.technician ? `Technician #${job.technician}` : "Unassigned")
  );
};

const getJobNumber = (job) =>
  job.job_card_number || job.job_number || `JOB-${job.id}`;

const initialForm = {
  customer: "",
  device: "",
  technician: "",
  reported_problem: "",
  priority: "MEDIUM",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const fieldErrorClass = "mt-1.5 text-xs text-red-600";

function getFieldErrors(data) {
  const fields = [
    "customer",
    "device",
    "technician",
    "priority",
    "reported_problem",
  ];

  const errors = {};

  fields.forEach((field) => {
    if (data?.[field]) {
      errors[field] = Array.isArray(data[field])
        ? data[field].join(" ")
        : String(data[field]);
    }
  });

  return errors;
}

export default function JobCards() {
  const [jobs, setJobs] = useState([]);

  // Pagination
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

const totalPages = Math.max(
  1,
  Math.ceil(totalJobs / PAGE_SIZE)
);

  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load job cards and dropdown data
  const loadData = useCallback(async (pageUrl = null, page = 1) => {
    setLoading(true);
    setError("");

    try {
const results = await Promise.all([
  pageUrl ? api.get(pageUrl) : api.get("job-cards/"),
  api.get("customers/devices/"),
  api.get("technicians/"),
]);

      const jobData = results[0].data;
      const pageJobs = getList(jobData);

      setJobs(pageJobs);
      setNextPage(jobData?.next || null);
      setPreviousPage(jobData?.previous || null);

      setTotalJobs(
        typeof jobData?.count === "number"
          ? jobData.count
          : pageJobs.length
      );

      setCurrentPage(page);

     let allCustomers = [];
let customerUrl = "customers/";

while (customerUrl) {
  const customerResponse = await api.get(customerUrl);
  const customerData = customerResponse.data;

  if (Array.isArray(customerData)) {
    allCustomers = customerData;
    customerUrl = null;
  } else {
    allCustomers = [
      ...allCustomers,
      ...(customerData.results || []),
    ];

    customerUrl = customerData.next || null;
  }
}
setCustomers(allCustomers);
let allDevices = getList(results[1].data);
let deviceUrl = results[1].data?.next || null;

while (deviceUrl) {
  const deviceResponse = await api.get(deviceUrl);
  const deviceData = deviceResponse.data;

  allDevices = [
    ...allDevices,
    ...getList(deviceData),
  ];

  deviceUrl = deviceData?.next || null;
}

setDevices(allDevices);
setTechnicians(getList(results[2].data));

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Devices belonging to the selected customer
  const availableDevices = useMemo(() => {
    if (!form.customer) return [];

    return devices.filter((device) => {
      const ownerId =
        typeof device.customer === "object"
          ? device.customer?.id
          : device.customer;

      return String(ownerId) === String(form.customer);
    });
  }, [devices, form.customer]);

  // Search and status filter for the current page
  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const customer = getCustomerName(job, customers);
      const device = getDeviceName(job, devices);
      const number = getJobNumber(job);

      const matchesSearch =
        !term ||
        number.toLowerCase().includes(term) ||
        customer.toLowerCase().includes(term) ||
        device.toLowerCase().includes(term) ||
        String(job.reported_problem || "")
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "ALL" || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, customers, devices, search, statusFilter]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "customer" ? { device: "" } : {}),
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
      ...(name === "customer" ? { device: "" } : {}),
    }));

    setError("");
  };

  const openForm = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setForm(initialForm);
    setFieldErrors({});
    setError("");
  };

  // Create job card
  const handleCreate = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const errors = {};

    if (!form.customer) {
      errors.customer = "Please select a customer.";
    }

    if (!form.device) {
      errors.device = "Please select a device.";
    }

    if (!form.reported_problem.trim()) {
      errors.reported_problem =
        "Please describe the reported problem.";
    } else if (form.reported_problem.trim().length < 3) {
      errors.reported_problem =
        "Problem description must contain at least 3 characters.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    try {
      const payload = {
        customer: Number(form.customer),
        device: Number(form.device),
        technician: form.technician
          ? Number(form.technician)
          : null,
        reported_problem: form.reported_problem.trim(),
        priority: form.priority,
      };

      const response = await api.post("job-cards/", payload);

      setMessage(
        `Job Card ${getJobNumber(response.data)} created successfully.`
      );

      setForm(initialForm);
      setFieldErrors({});
      setShowForm(false);

      // Reload the first page after creation
      await loadData();
    } catch (err) {
      const data = err.response?.data || {};
      const apiFieldErrors = getFieldErrors(data);

      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const statusClass = (status) => {
    if (status === "COMPLETED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "QC") {
      return "bg-purple-100 text-purple-700";
    }

    if (status === "REPAIR_IN_PROGRESS") {
      return "bg-blue-100 text-blue-700";
    }

    if (["CANCELLED", "QC_FAILED", "REJECTED"].includes(status)) {
      return "bg-red-100 text-red-700";
    }

    if (["APPROVED", "READY_FOR_DELIVERY"].includes(status)) {
      return "bg-green-100 text-green-700";
    }

    return "bg-amber-100 text-amber-800";
  };

  const formatStatus = (status) =>
    String(status || "N/A").replaceAll("_", " ");

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Job Cards
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage mobile repair jobs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm text-slate-500">
                Total Job Cards
              </span>
              <p className="text-xl font-bold text-slate-800">
                {totalJobs}
              </p>
            </div>

            <button
              type="button"
              onClick={openForm}
              className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Create Job Card
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {message}
          </div>
        )}

        {showForm && (
          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Create New Job Card
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the customer, device and repair details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="customer"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Customer *
                  </label>

                  <select
                    id="customer"
                    name="customer"
                    value={form.customer}
                    onChange={updateField}
                    aria-invalid={Boolean(fieldErrors.customer)}
                    aria-describedby={
                      fieldErrors.customer ? "customer-error" : undefined
                    }
                    className={`${inputClass} ${
                      fieldErrors.customer ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select customer</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name ||
                          customer.full_name ||
                          `Customer #${customer.id}`}
                      </option>
                    ))}
                  </select>

                  {fieldErrors.customer && (
                    <p id="customer-error" className={fieldErrorClass}>
                      {fieldErrors.customer}
                    </p>
                  )}

                  {customers.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      No customers available. Add a customer first.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="device"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Device *
                  </label>

                  <select
                    id="device"
                    name="device"
                    value={form.device}
                    onChange={updateField}
                    disabled={!form.customer}
                    aria-invalid={Boolean(fieldErrors.device)}
                    aria-describedby={
                      fieldErrors.device ? "device-error" : undefined
                    }
                    className={`${inputClass} ${
                      fieldErrors.device ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select device</option>

                    {availableDevices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {[device.brand, device.model]
                          .filter(Boolean)
                          .join(" ")}
                        {device.imei ? ` — ${device.imei}` : ""}
                      </option>
                    ))}
                  </select>

                  {fieldErrors.device && (
                    <p id="device-error" className={fieldErrorClass}>
                      {fieldErrors.device}
                    </p>
                  )}

                  {form.customer && availableDevices.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      No device found for this customer. Register a device
                      first.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="technician"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Technician
                  </label>

                  <select
                    id="technician"
                    name="technician"
                    value={form.technician}
                    onChange={updateField}
                    className={inputClass}
                  >
                    <option value="">Unassigned</option>

                    {technicians
                      .filter(
                        (technician) => technician.status === "ACTIVE"
                      )
                      .map((technician) => (
                        <option key={technician.id} value={technician.id}>
                          {technician.name}
                        </option>
                      ))}
                  </select>

                  {fieldErrors.technician && (
                    <p className={fieldErrorClass}>
                      {fieldErrors.technician}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Priority *
                  </label>

                  <select
                    id="priority"
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                    aria-invalid={Boolean(fieldErrors.priority)}
                    className={`${inputClass} ${
                      fieldErrors.priority ? "border-red-500" : ""
                    }`}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>

                  {fieldErrors.priority && (
                    <p className={fieldErrorClass}>
                      {fieldErrors.priority}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="reported_problem"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Reported Problem *
                </label>

                <textarea
                  id="reported_problem"
                  name="reported_problem"
                  value={form.reported_problem}
                  onChange={updateField}
                  minLength={3}
                  rows={4}
                  maxLength={5000}
                  placeholder="Describe the issue reported by the customer..."
                  aria-invalid={Boolean(fieldErrors.reported_problem)}
                  aria-describedby={
                    fieldErrors.reported_problem
                      ? "problem-error"
                      : undefined
                  }
                  className={`${inputClass} ${
                    fieldErrors.reported_problem ? "border-red-500" : ""
                  }`}
                />

                {fieldErrors.reported_problem && (
                  <p id="problem-error" className={fieldErrorClass}>
                    {fieldErrors.reported_problem}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    customers.length === 0 ||
                    !form.customer ||
                    !form.device
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? "Creating..." : "Create Job Card"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Search and Status Filter */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search job number, customer, device..."
            className={`${inputClass} min-w-0 sm:col-span-6`}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputClass} min-w-0 sm:col-span-6`}
          >
            <option value="ALL">All Statuses</option>

            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Job Cards Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading job cards...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <p>No job cards found.</p>

              <button
                type="button"
                onClick={openForm}
                className="mt-3 font-semibold text-blue-600 hover:underline"
              >
                Create your first job card
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Job Number</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Device</th>
                    <th className="px-5 py-4">Technician</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        {getJobNumber(job)}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {getCustomerName(job, customers)}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {getDeviceName(job, devices)}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {getTechnicianName(job, technicians)}
                      </td>

                      <td className="px-5 py-4">
                        {job.priority || "MEDIUM"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            job.status
                          )}`}
                        >
                          {formatStatus(job.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <Link
                          to={`/job-cards/${job.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {filteredJobs.length} record(s) on this page.
            {" "}Total job cards: {totalJobs}.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (previousPage) {
                  loadData(previousPage, Math.max(1, currentPage - 1));
                }
              }}
              disabled={!previousPage || loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="whitespace-nowrap px-2 text-sm font-medium text-slate-600">
  Page {currentPage} of {totalPages}
</span>

            <button
              type="button"
              onClick={() => {
                if (nextPage) {
                  loadData(nextPage, currentPage + 1);
                }
              }}
              disabled={!nextPage || loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
