
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getErrorMessage = (error) => {
  const data = error.response?.data;

  if (data?.detail) return data.detail;

  return error.message || "Unable to load warranties. Please try again.";
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  const styles = {
    ACTIVE: "bg-green-100 text-green-700",
    EXPIRED: "bg-red-100 text-red-700",
    VOID: "bg-slate-100 text-slate-600",
  };

  return styles[status] || "bg-slate-100 text-slate-600";
};

export default function MyWarranties() {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadWarranties = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("warranties/");
      setWarranties(getList(response.data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarranties();
  }, [loadWarranties]);

  const filteredWarranties = warranties.filter((warranty) => {
    const term = search.trim().toLowerCase();

    if (!term) return true;

    return (
      String(warranty.warranty_number || "")
        .toLowerCase()
        .includes(term) ||
      String(warranty.job_card || "")
        .toLowerCase()
        .includes(term) ||
      String(warranty.status || "")
        .toLowerCase()
        .includes(term) ||
      String(warranty.warranty_terms || "")
        .toLowerCase()
        .includes(term)
    );
  });

  const activeCount = warranties.filter(
    (warranty) => warranty.status === "ACTIVE"
  ).length;

  const expiredCount = warranties.filter(
    (warranty) => warranty.status === "EXPIRED"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-800">
            My Warranties
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View warranty details for your completed repairs.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={loadWarranties}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Warranties
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-800">
              {warranties.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active Warranties
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Expired Warranties
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {expiredCount}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Warranty History
            </h2>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search warranty..."
              aria-label="Search warranties"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading warranties...
            </div>
          ) : filteredWarranties.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="font-semibold text-slate-700">
                No warranties found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Your available warranty records will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">
                      Warranty Number
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Job Card
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Start Date
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      End Date
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Warranty Terms
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredWarranties.map((warranty) => (
                    <tr key={warranty.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {warranty.warranty_number || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {typeof warranty.job_card === "object"
                          ? warranty.job_card?.job_card_number ||
                            `Job Card ${warranty.job_card?.id || ""}`
                          : `Job Card ${warranty.job_card ?? "—"}`}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(warranty.start_date)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(warranty.end_date)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            warranty.status
                          )}`}
                        >
                          {warranty.status || "UNKNOWN"}
                        </span>
                      </td>

                      <td className="max-w-xs whitespace-normal px-5 py-4 text-slate-600">
                        {warranty.warranty_terms || "—"}
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
