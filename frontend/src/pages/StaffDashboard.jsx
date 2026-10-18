
import { useEffect, useMemo, useState } from "react";

import {
  getCustomers,
  getJobCards,
  getEstimates,
  getSpareParts,
  getPayments,
  getDevices,
  getTechnicians,
} from "../services/dashboardApi";

const STATUS_CARDS = [
  { title: "Received", keys: ["RECEIVED"], color: "bg-blue-500" },
  { title: "Diagnosis", keys: ["DIAGNOSIS"], color: "bg-purple-500" },
  {
    title: "Estimate / Approval",
    keys: [
      "ESTIMATE_PREPARED",
      "WAITING_FOR_APPROVAL",
      "APPROVED",
      "REJECTED",
    ],
    color: "bg-orange-500",
  },
  {
    title: "Repair In Progress",
    keys: ["REPAIR_IN_PROGRESS"],
    color: "bg-yellow-500",
  },
  {
    title: "Quality Check",
    keys: ["QC", "QC_FAILED"],
    color: "bg-cyan-500",
  },
  {
    title: "Repair Required",
    keys: ["REPAIR_REQUIRED"],
    color: "bg-rose-500",
  },
  {
    title: "Ready for Delivery",
    keys: ["READY_FOR_DELIVERY"],
    color: "bg-indigo-500",
  },
  { title: "Completed", keys: ["COMPLETED"], color: "bg-emerald-500" },
  { title: "Cancelled", keys: ["CANCELLED"], color: "bg-red-500" },
];

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const getId = (value) =>
  value && typeof value === "object" ? value.id : value;

const getName = (value) => {
  if (!value) return "—";

  if (typeof value === "object") {
    return (
      value.name ||
      value.full_name ||
      value.customer_name ||
      value.email ||
      "—"
    );
  }

  return "—";
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const isToday = (value) => {
  if (!value) return false;

  const date = new Date(value);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toDateString() === new Date().toDateString()
  );
};

const isPaid = (payment) =>
  normalizeStatus(payment.payment_status || payment.status) === "PAID";

const isPendingEstimate = (estimate) =>
  [
    "PENDING",
    "PENDING_APPROVAL",
    "WAITING_APPROVAL",
    "WAITING_FOR_APPROVAL",
  ].includes(
    normalizeStatus(estimate.approval_status || estimate.status)
  );

const getStatusClasses = (status) => {
  const value = normalizeStatus(status);

  if (value === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (["CANCELLED", "REJECTED"].includes(value))
    return "bg-red-50 text-red-700";
  if (value === "READY_FOR_DELIVERY")
    return "bg-indigo-50 text-indigo-700";
  if (value.includes("APPROVAL") || value.includes("PENDING"))
    return "bg-orange-50 text-orange-700";
  if (value.includes("QC")) return "bg-cyan-50 text-cyan-700";
  if (value.includes("PROGRESS"))
    return "bg-yellow-50 text-yellow-700";
  if (value === "REPAIR_REQUIRED")
    return "bg-rose-50 text-rose-700";

  return "bg-blue-50 text-blue-700";
};

const getLowStock = (part) => {
  const quantity = Number(
    part.quantity ??
      part.stock_quantity ??
      part.available_quantity ??
      0
  );

  const threshold = Number(
    part.reorder_level ??
      part.minimum_stock ??
      part.min_stock ??
      0
  );

  return quantity <= threshold;
};

const getJobDate = (job) =>
  job.created_at || job.intake_date || job.updated_at || null;

function StaffDashboard() {
  const [customers, setCustomers] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let active = true;

    const requests = [
      ["customers", getCustomers, setCustomers],
      ["job cards", getJobCards, setJobCards],
      ["estimates", getEstimates, setEstimates],
      ["spare parts", getSpareParts, setSpareParts],
      ["payments", getPayments, setPayments],
      ["devices", getDevices, setDevices],
      ["technicians", getTechnicians, setTechnicians],
    ];

    const loadData = async () => {
      setLoading(true);
      setErrors([]);

      const results = await Promise.allSettled(
        requests.map(([, request]) => request())
      );

      if (!active) return;

      const failed = [];

      results.forEach((result, index) => {
        const [name, , setter] = requests[index];

        if (result.status === "fulfilled") {
          if (Array.isArray(result.value)) {
            setter(result.value);
          } else {
            setter([]);
            failed.push(`${name} (unexpected API response)`);
          }
        } else {
          setter([]);
          failed.push(name);
          console.error(`Unable to load ${name}:`, result.reason);
        }
      });

      setErrors(failed);
      setLoading(false);
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const customerMap = useMemo(
    () => new Map(customers.map((item) => [String(item.id), item])),
    [customers]
  );

  const deviceMap = useMemo(
    () => new Map(devices.map((item) => [String(item.id), item])),
    [devices]
  );

  const technicianMap = useMemo(
    () => new Map(technicians.map((item) => [String(item.id), item])),
    [technicians]
  );

  const getCustomerName = (job) => {
    if (job.customer && typeof job.customer === "object") {
      return getName(job.customer);
    }

    return (
      customerMap.get(String(getId(job.customer)))?.name ||
      job.customer_name ||
      "—"
    );
  };

  const getDeviceName = (job) => {
    const device =
      job.device && typeof job.device === "object"
        ? job.device
        : deviceMap.get(String(getId(job.device)));

    if (device) {
      return (
        [device.brand, device.model].filter(Boolean).join(" ") || "—"
      );
    }

    return job.device_name || "—";
  };

  const getTechnicianName = (job) => {
    if (
      job.technician === null ||
      job.technician === undefined ||
      job.technician === ""
    ) {
      return "Not Assigned";
    }

    const technician =
      typeof job.technician === "object"
        ? job.technician
        : technicianMap.get(String(getId(job.technician)));

    return technician
      ? getName(technician)
      : job.technician_name || "Not Assigned";
  };

  const activeJobCards = jobCards.filter(
    (job) =>
      !["COMPLETED", "CANCELLED"].includes(
        normalizeStatus(job.status)
      )
  ).length;

  const pendingEstimates = estimates.filter(isPendingEstimate).length;
  const lowStockCount = spareParts.filter(getLowStock).length;

  const todaysPayments = payments.filter(
    (payment) =>
      isPaid(payment) &&
      isToday(
        payment.payment_date ||
          payment.paid_at ||
          payment.created_at
      )
  );

  const todaysTotal = todaysPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const repairStatusData = STATUS_CARDS.map((card) => ({
    ...card,
    count: jobCards.filter((job) =>
      card.keys.includes(normalizeStatus(job.status))
    ).length,
  }));

  const summaryCards = [
    {
      title: "Total Customers",
      value: customers.length,
      subtitle: "Registered customers",
      icon: "👥",
      color: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Job Cards",
      value: activeJobCards,
      subtitle: "Currently active repairs",
      icon: "🔧",
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Pending Estimates",
      value: pendingEstimates,
      subtitle: "Awaiting customer approval",
      icon: "▤",
      color: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      title: "Low Stock Parts",
      value: lowStockCount,
      subtitle: "Parts needing attention",
      icon: "⚠",
      color: "bg-red-50",
      iconColor: "text-red-500",
    },
  ];

  const sortedJobCards = useMemo(
    () =>
      [...jobCards].sort((a, b) => {
        const dateA = new Date(getJobDate(a) || 0).getTime();
        const dateB = new Date(getJobDate(b) || 0).getTime();
        return dateB - dateA;
      }),
    [jobCards]
  );

  const filteredJobCards = sortedJobCards.filter((job) => {
    const search = searchTerm.trim().toLowerCase();

    const searchableValues = [
      job.job_card_number,
      getCustomerName(job),
      getDeviceName(job),
      getTechnicianName(job),
      job.status,
      job.priority,
    ];

    const matchesSearch =
      !search ||
      searchableValues.some((value) =>
        String(value || "").toLowerCase().includes(search)
      );

    const matchesStatus =
      statusFilter === "ALL" ||
      normalizeStatus(job.status) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const hasActiveFilter =
    searchTerm.trim().length > 0 || statusFilter !== "ALL";

  const displayedJobCards = hasActiveFilter
    ? filteredJobCards
    : filteredJobCards.slice(0, 5);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of today's repair centre activities.
        </p>
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700"
        >
          <p className="font-semibold">
            Some dashboard data could not be loaded.
          </p>
          <p className="mt-1">
            Check these API requests: {errors.join(", ")}.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="h-1 bg-blue-600" />

            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "..." : card.value}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {card.subtitle}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
              >
                <span className={`text-xl ${card.iconColor}`}>
                  {card.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Repair Status Cards and Today's Payments; no graph */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900">
              Repair Status Overview
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Current repair workflow summary
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {repairStatusData.map((card) => (
              <div
                key={card.title}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500">
                    {card.title}
                  </p>
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${card.color}`}
                  />
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {loading ? "..." : card.count}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900">
              Today's Payments
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Payment summary
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">
              Total Collected
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : formatCurrency(todaysTotal)}
            </p>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500">
                Paid Transactions Today
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {loading ? "..." : todaysPayments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Independent Search and Filter Card */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Search Job Cards
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Find repairs by job card number, customer, device or technician.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label
              htmlFor="staff-job-search"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Search
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </span>

              <input
                id="staff-job-search"
                name="jobSearch"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Enter job card, customer, device..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="staff-status-filter"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              Filter by Status
            </label>

            <select
              id="staff-status-filter"
              name="jobStatus"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All statuses</option>
              {STATUS_CARDS.map((card) =>
                card.keys.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            {loading
              ? "Loading records..."
              : `${filteredJobCards.length} matching job card(s)`}
          </p>

          <button
            type="button"
            disabled={!hasActiveFilter}
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Recent Job Cards — separate card */}
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            Recent Job Cards
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Latest repair job records
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                {[
                  "Job Card",
                  "Customer",
                  "Device",
                  "Technician",
                  "Status",
                  "Priority",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-white"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Loading job cards...
                  </td>
                </tr>
              ) : displayedJobCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No matching job cards found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try another search term or status.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedJobCards.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {job.job_card_number || `#${job.id}`}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {getCustomerName(job)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {getDeviceName(job)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {getTechnicianName(job)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(job.status)}`}
                      >
                        {String(job.status || "Unknown").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {job.priority || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading &&
          !hasActiveFilter &&
          filteredJobCards.length > 5 && (
            <p className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-500">
              Showing the 5 most recent job cards. Use the Search Job Cards
              card above to find other records.
            </p>
          )}
      </div>
    </>
  );
}

export default StaffDashboard;
