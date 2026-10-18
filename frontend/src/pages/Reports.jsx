
import { useEffect, useState } from "react";
import api from "../services/api";

const summaryCards = [
  { key: "total_customers", label: "Total Customers" },
  { key: "total_devices", label: "Total Devices" },
  { key: "total_job_cards", label: "Total Job Cards" },
  { key: "completed_repairs", label: "Completed Repairs" },
  { key: "pending_repairs", label: "Pending Repairs" },
  { key: "cancelled_repairs", label: "Cancelled Repairs" },
  { key: "low_stock_parts", label: "Low Stock Parts" },
];

const chartColors = [
  "#2563EB",
  "#16A34A",
  "#F59E0B",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#EA580C",
  "#64748B",
  "#DB2777",
  "#65A30D",
  "#4F46E5",
  "#0D9488",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatLabel = (value) =>
  String(value ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function ReportCard({ title, subtitle, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ message = "No data available." }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function StatusDonutChart({ data }) {
  const entries = Object.entries(data || {}).map(([label, value]) => ({
    label,
    value: Math.max(0, Number(value) || 0),
  }));

  const total = entries.reduce((sum, item) => sum + item.value, 0);

  if (!entries.length || total === 0) {
    return <EmptyState message="No job card status data available." />;
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = entries.map((item, index) => {
    const length = (item.value / total) * circumference;

    const segment = {
      ...item,
      color: chartColors[index % chartColors.length],
      length,
      offset,
      percentage: (item.value / total) * 100,
    };

    offset += length;
    return segment;
  });

  return (
    <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
      <div className="flex justify-center">
        <svg
          viewBox="0 0 200 200"
          className="h-52 w-52 max-w-full"
          role="img"
          aria-label={`Job card status distribution. Total ${total}`}
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="24"
          />

          {segments.map((segment) => (
            <circle
              key={segment.label}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="24"
              strokeDasharray={`${segment.length} ${
                circumference - segment.length
              }`}
              strokeDashoffset={-segment.offset}
              transform="rotate(-90 100 100)"
            >
              <title>
                {formatLabel(segment.label)}: {segment.value}
              </title>
            </circle>
          ))}

          <text
            x="100"
            y="94"
            textAnchor="middle"
            fontSize="12"
            fill="#64748B"
          >
            Total Jobs
          </text>
          <text
            x="100"
            y="120"
            textAnchor="middle"
            fontSize="25"
            fontWeight="700"
            fill="#0F172A"
          >
            {total}
          </text>
        </svg>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <div className="flex min-w-0 items-start gap-2">
              <span
                className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="break-words text-slate-600">
                {formatLabel(segment.label)}
              </span>
            </div>

            <div className="shrink-0 text-right">
              <span className="font-semibold text-slate-900">
                {segment.value}
              </span>
              <span className="ml-2 text-xs text-slate-500">
                {segment.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarGraph({
  data,
  valueFormatter = (value) => String(value),
  emptyMessage = "No graph data available.",
}) {
  const items = data.map((item) => ({
    ...item,
    value: Math.max(0, Number(item.value) || 0),
  }));

  const maximum = Math.max(0, ...items.map((item) => item.value));

  if (!items.length || maximum === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-5">
      {items.map((item, index) => {
        const percentage = (item.value / maximum) * 100;
        const color = item.color || chartColors[index % chartColors.length];

        return (
          <div key={item.label}>
            <div className="mb-2 flex items-start justify-between gap-3">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="break-words text-right text-sm font-semibold text-slate-900">
                {valueFormatter(item.value)}
              </span>
            </div>

            <div
              className="h-4 overflow-hidden rounded-full bg-slate-100"
              role="img"
              aria-label={`${item.label}: ${valueFormatter(item.value)}`}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InventoryTable({ inventory }) {
  const rows = [
    {
      label: "Total Parts",
      value: inventory?.total_parts ?? 0,
    },
    {
      label: "Available Stock Units",
      value: inventory?.total_available_stock ?? 0,
    },
    {
      label: "Low Stock Parts",
      value: inventory?.low_stock_parts ?? 0,
      className: "text-amber-700",
    },
    {
      label: "Out of Stock Parts",
      value: inventory?.out_of_stock_parts ?? 0,
      className: "text-red-700",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="px-3 py-3 font-medium">Inventory Metric</th>
            <th className="px-3 py-3 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="px-3 py-4 text-slate-600">{row.label}</td>
              <td
                className={`px-3 py-4 text-right font-semibold ${
                  row.className || "text-slate-900"
                }`}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [jobStatuses, setJobStatuses] = useState({});
  const [revenue, setRevenue] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchReports() {
      setLoading(true);
      setError("");

      try {
        // Existing API calls preserved.
        const results = await Promise.all([
          api.get("reports/dashboard-summary/"),
          api.get("reports/job-card-status/"),
          api.get("reports/revenue/"),
          api.get("reports/inventory/"),
          api.get("reports/repair-performance/"),
        ]);

        if (!isMounted) return;

        setSummary(results[0].data);
        setJobStatuses(results[1].data);
        setRevenue(results[2].data);
        setInventory(results[3].data);
        setPerformance(results[4].data);
      } catch (err) {
        if (!isMounted) return;

        setError(
          err.response?.data?.detail ||
            "Reports load झाले नाहीत. कृपया API आणि login तपासा."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const downloadCSV = () => {
    const rows = [
      ["Mobile Repair Centre - Reports"],
      [],
      ["Dashboard Summary", "Value"],
      ...summaryCards.map((card) => [
        card.label,
        summary?.[card.key] ?? 0,
      ]),
      ["Total Revenue", summary?.total_revenue ?? 0],
      [],
      ["Job Card Status", "Count"],
      ...Object.entries(jobStatuses),
      [],
      ["Payment Summary", "Value"],
      ["Total Payments", revenue?.total_payments ?? 0],
      ["Paid Amount", revenue?.total_paid_amount ?? 0],
      ["Pending Amount", revenue?.total_pending_amount ?? 0],
      ["Failed Amount", revenue?.total_failed_amount ?? 0],
      [],
      ["Paid Amount by Payment Method", "Amount"],
      ...Object.entries(revenue?.payment_method_wise ?? {}),
      [],
      ["Inventory Summary", "Value"],
      ["Total Parts", inventory?.total_parts ?? 0],
      ["Available Stock Units", inventory?.total_available_stock ?? 0],
      ["Low Stock Parts", inventory?.low_stock_parts ?? 0],
      ["Out of Stock Parts", inventory?.out_of_stock_parts ?? 0],
      [],
      ["Repair Performance", "Count"],
      ["Total Repairs", performance?.total_repairs ?? 0],
      ["Completed Repairs", performance?.completed_repairs ?? 0],
      ["Pending Repairs", performance?.pending_repairs ?? 0],
      ["Repair In Progress", performance?.repair_in_progress ?? 0],
      ["Cancelled Repairs", performance?.cancelled_repairs ?? 0],
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "mobile-repair-centre-reports.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600">
        Loading reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-700">Reports Load Error</h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const revenueGraphData = [
    {
      label: "Paid Amount",
      value: revenue?.total_paid_amount,
      color: "#16A34A",
    },
    {
      label: "Pending Amount",
      value: revenue?.total_pending_amount,
      color: "#F59E0B",
    },
    {
      label: "Failed Amount",
      value: revenue?.total_failed_amount,
      color: "#DC2626",
    },
  ];

  const performanceGraphData = [
    {
      label: "Completed Repairs",
      value: performance?.completed_repairs,
      color: "#16A34A",
    },
    {
      label: "Pending Repairs",
      value: performance?.pending_repairs,
      color: "#F59E0B",
    },
    {
      label: "Repairs In Progress",
      value: performance?.repair_in_progress,
      color: "#2563EB",
    },
    {
      label: "Cancelled Repairs",
      value: performance?.cancelled_repairs,
      color: "#DC2626",
    },
  ];

  const paymentMethods = Object.entries(
    revenue?.payment_method_wise ?? {}
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              ADMINISTRATION
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Reports
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Repair centre business overview and performance.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadCSV}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download CSV
          </button>
        </div>

        {/* Summary cards: shown only once */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Dashboard Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Key numbers from your repair centre.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.key}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-3 break-words text-3xl font-bold text-slate-900">
                  {summary?.[card.key] ?? 0}
                </p>
              </div>
            ))}

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="mt-3 break-words text-2xl font-bold text-emerald-700">
                {formatCurrency(summary?.total_revenue)}
              </p>
            </div>
          </div>
        </section>

        {/* Charts and graphs */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Visual Reports
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Visual comparison of job statuses, payments and repair performance.
            </p>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <ReportCard
              title="Job Card Status Distribution"
              subtitle="Doughnut chart showing job counts and percentages."
            >
              <StatusDonutChart data={jobStatuses} />
            </ReportCard>

            <ReportCard
              title="Revenue & Payments"
              subtitle="Bar graph comparing paid, pending and failed amounts."
            >
              <BarGraph
                data={revenueGraphData}
                valueFormatter={formatCurrency}
                emptyMessage="No payment amount data available."
              />

              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">
                    Total Payments
                  </span>
                  <span className="font-semibold text-slate-900">
                    {revenue?.total_payments ?? 0}
                  </span>
                </div>
              </div>
            </ReportCard>

            <ReportCard
              title="Repair Performance"
              subtitle="Bar graph comparing completed, pending, in-progress and cancelled repairs."
            >
              <BarGraph
                data={performanceGraphData}
                emptyMessage="No repair performance data available."
              />
            </ReportCard>

            <ReportCard
              title="Inventory Summary"
              subtitle="Stock details in a table instead of another chart."
            >
              <InventoryTable inventory={inventory} />
            </ReportCard>
          </div>
        </section>

        {/* Additional details only; no repeated status or performance cards */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Additional Payment Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Paid amounts grouped by payment method.
            </p>
          </div>

          <ReportCard title="Paid Amount by Payment Method">
            {paymentMethods.length === 0 ? (
              <EmptyState message="No payment method data available." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-3 font-medium">
                        Payment Method
                      </th>
                      <th className="px-3 py-3 text-right font-medium">
                        Paid Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethods.map(([method, amount]) => (
                      <tr
                        key={method}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-4 text-slate-600">
                          {formatLabel(method)}
                        </td>
                        <td className="px-3 py-4 text-right font-semibold text-slate-900">
                          {formatCurrency(amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ReportCard>
        </section>
      </div>
    </div>
  );
}
