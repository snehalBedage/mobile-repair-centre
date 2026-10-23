
import { useEffect, useState } from "react";

import {
  getDashboardSummary,
  getCustomers,
  getDevices,
  getJobCards,
  getEstimates,
  getSpareParts,
  getPayments,
  getTechnicians,
} from "../services/dashboardApi";

// Backend JobCard status values
const STATUS_CHART_ITEMS = [
  {
    title: "Received",
    statuses: ["RECEIVED"],
    color: "#2563EB",
  },
  {
    title: "Diagnosis",
    statuses: ["DIAGNOSIS"],
    color: "#8B5CF6",
  },
  {
    title: "Estimate Prepared",
    statuses: ["ESTIMATE_PREPARED"],
    color: "#A855F7",
  },
  {
    title: "Waiting for Approval",
    statuses: ["WAITING_FOR_APPROVAL"],
    color: "#F59E0B",
  },
  {
    title: "Approved",
    statuses: ["APPROVED"],
    color: "#0D9488",
  },
  {
    title: "Repair In Progress",
    statuses: ["REPAIR_IN_PROGRESS"],
    color: "#EAB308",
  },
  {
    title: "Quality Check",
    statuses: ["QC"],
    color: "#06B6D4",
  },
  {
    title: "QC Failed",
    statuses: ["QC_FAILED"],
    color: "#F97316",
  },
  {
    title: "Repair Required",
    statuses: ["REPAIR_REQUIRED"],
    color: "#64748B",
  },
  {
    title: "Ready for Delivery",
    statuses: ["READY_FOR_DELIVERY"],
    color: "#6366F1",
  },
  {
    title: "Completed",
    statuses: ["COMPLETED"],
    color: "#16A34A",
  },
  {
    title: "Rejected",
    statuses: ["REJECTED"],
    color: "#DC2626",
  },
  {
    title: "Cancelled",
    statuses: ["CANCELLED"],
    color: "#991B1B",
  },
];

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const getId = (value) => {
  if (value && typeof value === "object") {
    return value.id;
  }

  return value;
};

const getName = (value, fallback = "—") => {
  if (value && typeof value === "object") {
    return (
      value.name ||
      value.full_name ||
      value.customer_name ||
      value.part_name ||
      fallback
    );
  }

  return fallback;
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const isToday = (dateValue) => {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return false;

  return date.toDateString() === new Date().toDateString();
};

const isPaid = (payment) =>
  normalizeStatus(payment.payment_status || payment.status) === "PAID";

const isPendingEstimate = (estimate) =>
  ["PENDING", "PENDING_APPROVAL", "WAITING_APPROVAL"].includes(
    normalizeStatus(estimate.approval_status)
  );

const getStatusClasses = (status) => {
  const value = normalizeStatus(status);

  if (value === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (value === "CANCELLED" || value === "REJECTED") {
    return "bg-red-50 text-red-700";
  }

  if (value.includes("APPROVAL") || value.includes("PENDING")) {
    return "bg-orange-50 text-orange-700";
  }

  if (value.includes("QC")) {
    return "bg-cyan-50 text-cyan-700";
  }

  if (value.includes("PROGRESS")) {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-blue-50 text-blue-700";
};

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [jobCards, setJobCards] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partialError, setPartialError] = useState("");

  useEffect(() => {
  let isMounted = true;

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    setPartialError("");

    const requests = [
      ["job cards", getJobCards, setJobCards],
      ["estimates", getEstimates, setEstimates],
      ["payments", getPayments, setPayments],
      ["customers", getCustomers, setCustomers],
      ["devices", getDevices, setDevices],
      ["technicians", getTechnicians, setTechnicians],
    ];

    try {
      // Start summary and all dashboard requests together.
      const allPromises = [
        getDashboardSummary(),
        ...requests.map(([, request]) => request()),
      ];

      const results = await Promise.allSettled(allPromises);

      if (!isMounted) return;

      // Handle dashboard summary.
      const summaryResult = results[0];

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      } else {
        setError(
          summaryResult.reason?.message ||
            "Unable to load dashboard summary."
        );
      }

      // Handle the remaining dashboard sections.
      const failedSections = [];

      requests.forEach(([sectionName, , setter], index) => {
        const result = results[index + 1];

        if (result.status === "fulfilled") {
          setter(
            Array.isArray(result.value) ? result.value : []
          );
        } else {
          setter([]);
          failedSections.push(sectionName);

          console.error(
            `Unable to load ${sectionName}:`,
            result.reason
          );
        }
      });

      if (failedSections.length > 0) {
        setPartialError(
          `Unable to load: ${failedSections.join(
            ", "
          )}. Please check those API endpoints.`
        );
      }
    } catch (err) {
      if (isMounted) {
        setError(
          err.message || "Unable to load dashboard."
        );
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  fetchDashboardData();

  return () => {
    isMounted = false;
  };
}, []);

  // Maps used to display related names in recent job cards
  const customerMap = new Map(
    customers.map((customer) => [
      String(customer.id),
      customer,
    ])
  );

  const deviceMap = new Map(
    devices.map((device) => [
      String(device.id),
      device,
    ])
  );

  const technicianMap = new Map(
    technicians.map((technician) => [
      String(technician.id),
      technician,
    ])
  );

  const getCustomerName = (job) => {
    const customer = job.customer;

    if (customer && typeof customer === "object") {
      return getName(customer);
    }

    const record = customerMap.get(String(getId(customer)));

    return record?.name || "—";
  };

  const getDeviceName = (job) => {
    const device = job.device;

    if (device && typeof device === "object") {
      return (
        [device.brand, device.model].filter(Boolean).join(" ") || "—"
      );
    }

    const record = deviceMap.get(String(getId(device)));

    return record
      ? [record.brand, record.model].filter(Boolean).join(" ") || "—"
      : "—";
  };

  const getTechnicianName = (job) => {
    const technician = job.technician;

    if (
      technician === null ||
      technician === undefined ||
      technician === ""
    ) {
      return "Not Assigned";
    }

    if (typeof technician === "object") {
      return getName(technician, "Not Assigned");
    }

    const record = technicianMap.get(String(technician));

    return record?.name || "Not Assigned";
  };

  // Dashboard summary calculations
  const activeJobCards = jobCards.filter(
    (job) =>
      !["COMPLETED", "CANCELLED"].includes(
        normalizeStatus(job.status)
      )
  ).length;

  const pendingEstimates = estimates.filter(
    isPendingEstimate
  ).length;

  const lowStockCount = summary?.low_stock_parts ?? 0;

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
    (total, payment) =>
      total + Number(payment.amount || 0),
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

  // Count actual job cards for each backend status
  const repairStatusData = STATUS_CHART_ITEMS.map((item) => ({
    ...item,
    count: jobCards.filter((job) =>
      item.statuses.includes(normalizeStatus(job.status))
    ).length,
  }));

  const repairStatusTotal = repairStatusData.reduce(
    (total, item) => total + item.count,
    0
  );

  // Build the doughnut chart from actual status counts
  let currentPercentage = 0;

  const statusGradient =
    repairStatusTotal === 0
      ? "#E2E8F0 0% 100%"
      : repairStatusData
          .filter((item) => item.count > 0)
          .map((item) => {
            const start = currentPercentage;

            currentPercentage +=
              (item.count / repairStatusTotal) * 100;

            return `${item.color} ${start}% ${currentPercentage}%`;
          })
          .join(", ");

  const displayValue = (value) => {
    if (loading) return "...";
    return value ?? 0;
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-slate-500">
          Overview of your repair centre.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {partialError && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {partialError}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            title: "Total Customers",
            value: summary?.total_customers,
            subtitle: "Registered customers",
            icon: "👥",
            color: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            title: "Active Job Cards",
            value: summary ? activeJobCards : undefined,
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
        ].map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <h3 className="text-3xl font-bold text-slate-900 mt-2">
                  {displayValue(card.value)}
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  {card.subtitle}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}
              >
                <span
                  className={`text-xl ${card.iconColor}`}
                  aria-hidden="true"
                >
                  {card.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REPAIR STATUS CHART + TODAY'S PAYMENTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
        {/* DOUGHNUT CHART */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Repair Status Overview
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Current repair workflow summary
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <div className="min-h-52 flex items-center justify-center text-sm text-slate-500">
                Loading repair status chart...
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Doughnut */}
                <div className="relative shrink-0">
                  <div
                    className="w-48 h-48 sm:w-52 sm:h-52 rounded-full"
                    style={{
                      background: `conic-gradient(from -90deg, ${statusGradient})`,
                    }}
                    role="img"
                    aria-label={`Repair status chart with ${repairStatusTotal} job cards`}
                  />

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
                      <span className="text-3xl font-bold text-slate-900">
                        {repairStatusTotal}
                      </span>

                      <span className="text-xs text-slate-500 mt-1">
                        Total Jobs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status legend */}
                <div className="w-full flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                    {repairStatusData.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                              backgroundColor: item.color,
                            }}
                          />

                          <span className="text-sm text-slate-600">
                            {item.title}
                          </span>
                        </div>

                        <span className="text-sm font-semibold text-slate-900">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>

                  {repairStatusTotal === 0 && (
                    <p className="text-xs text-slate-500 mt-5">
                      No repair job data available yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TODAY'S PAYMENTS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Today&apos;s Payments
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Payment summary
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Collected
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {loading ? "..." : formatCurrency(todaysTotal)}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-600">
                  ₹
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Transactions
                </p>

                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  Today
                </span>
              </div>

              <p className="text-lg font-semibold text-slate-900 mt-2">
                {displayValue(todaysPayments.length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT JOB CARDS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Recent Job Cards
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Latest repair jobs
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                {[
                  "Job Card",
                  "Customer",
                  "Device",
                  "Technician",
                  "Status",
                  "Priority",
                ].map((item) => (
                  <th
                    key={item}
                    className="text-left px-5 py-3 text-xs font-semibold text-white"
                  >
                    {item}
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
              ) : recentJobCards.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center"
                  >
                    <p className="text-sm font-medium text-slate-500">
                      No job cards available
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
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
                    <td className="px-5 py-4 font-semibold text-slate-800 whitespace-nowrap">
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

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(job.status)}`}
                      >
                        {String(job.status || "Unknown").replace(
                          /_/g,
                          " "
                        )}
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

export default AdminDashboard;
