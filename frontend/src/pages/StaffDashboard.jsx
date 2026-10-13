
import { useEffect, useState } from "react";

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
  {
    title: "Diagnosis",
    keys: ["DIAGNOSIS", "UNDER_DIAGNOSIS"],
    color: "bg-purple-500",
  },
  {
    title: "Waiting Approval",
    keys: ["WAITING_APPROVAL", "PENDING_APPROVAL", "ESTIMATE_PENDING"],
    color: "bg-orange-500",
  },
  {
    title: "Repair In Progress",
    keys: ["REPAIR_IN_PROGRESS", "IN_PROGRESS", "REPAIRING"],
    color: "bg-yellow-500",
  },
  {
    title: "Ready for QC",
    keys: ["READY_FOR_QC", "QC", "QUALITY_CHECK", "QUALITY_CONTROL"],
    color: "bg-cyan-500",
  },
  { title: "Completed", keys: ["COMPLETED"], color: "bg-emerald-500" },
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
  ["PENDING", "PENDING_APPROVAL", "WAITING_APPROVAL"].includes(
    normalizeStatus(estimate.approval_status)
  );

const getStatusClasses = (status) => {
  const value = normalizeStatus(status);

  if (value === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (value === "CANCELLED") return "bg-red-50 text-red-700";

  if (value.includes("APPROVAL") || value.includes("PENDING")) {
    return "bg-orange-50 text-orange-700";
  }

  if (value.includes("QC") || value.includes("QUALITY")) {
    return "bg-cyan-50 text-cyan-700";
  }

  if (value.includes("PROGRESS") || value === "REPAIRING") {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-blue-50 text-blue-700";
};

const getLowStock = (part) => {
  const quantity = Number(
    part.quantity ?? part.stock_quantity ?? part.available_quantity ?? 0
  );

  const threshold = Number(
    part.reorder_level ?? part.minimum_stock ?? part.min_stock ?? 0
  );

  return quantity <= threshold;
};

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
          setter(Array.isArray(result.value) ? result.value : []);
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

  const customerMap = new Map(
    customers.map((item) => [String(item.id), item])
  );

  const deviceMap = new Map(
    devices.map((item) => [String(item.id), item])
  );

  const technicianMap = new Map(
    technicians.map((item) => [String(item.id), item])
  );

  const getCustomerName = (job) => {
    if (job.customer && typeof job.customer === "object") {
      return getName(job.customer);
    }

    return (
      customerMap.get(String(getId(job.customer)))?.name || "—"
    );
  };

  const getDeviceName = (job) => {
    const device =
      job.device && typeof job.device === "object"
        ? job.device
        : deviceMap.get(String(getId(job.device)));

    return device
      ? [device.brand, device.model].filter(Boolean).join(" ") || "—"
      : "—";
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

    return technician ? getName(technician) : "Not Assigned";
  };

  const activeJobCards = jobCards.filter(
    (job) =>
      !["COMPLETED", "CANCELLED"].includes(normalizeStatus(job.status))
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

  const recentJobCards = [...jobCards]
    .sort((a, b) => {
      const dateA = new Date(
        a.created_at || a.intake_date || 0
      ).getTime();

      const dateB = new Date(
        b.created_at || b.intake_date || 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

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
        <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          Unable to load: {errors.join(", ")}. Check the API permissions and endpoints.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
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

          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            {STATUS_CARDS.map((card) => {
              const count = jobCards.filter((job) =>
                card.keys.includes(normalizeStatus(job.status))
              ).length;

              return (
                <div
                  key={card.title}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500">
                      {card.title}
                    </p>
                    <span className={`h-2 w-2 rounded-full ${card.color}`} />
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {loading ? "..." : count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900">
              Today&apos;s Payments
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
              <p className="text-xs text-slate-500">Transactions</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {loading ? "..." : todaysPayments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            Recent Job Cards
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Latest repair jobs
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
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Loading job cards...
                  </td>
                </tr>
              ) : recentJobCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No job cards available
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      New repair jobs will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                recentJobCards.map((job) => (
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
      </div>
    </>
  );
}

export default StaffDashboard;
