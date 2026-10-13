
import { useEffect, useState } from "react";
import api from "../services/api";

function MyDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDevices() {
      try {
        setLoading(true);
        setError("");

        // Backend automatically filters devices for the logged-in customer.
        const response = await api.get("customers/devices/");
        const data = response.data;

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        if (active) {
          setDevices(results);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load your devices. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDevices();

    return () => {
      active = false;
    };
  }, []);

  function formatCondition(condition) {
    if (!condition) return "—";

    return String(condition)
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function conditionStyle(condition) {
    const value = String(condition || "").toUpperCase();

    if (value === "GOOD") {
      return "bg-green-50 text-green-700";
    }

    if (["DAMAGED", "NOT_WORKING"].includes(value)) {
      return "bg-red-50 text-red-700";
    }

    return "bg-amber-50 text-amber-700";
  }

  const filteredDevices = devices.filter((device) => {
    const searchableText = [
      device.brand,
      device.model,
      device.imei,
      device.device_condition,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          My Devices
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View your registered devices and their details.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Total Registered Devices
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? "—" : devices.length}
            </p>
          </div>

          <div className="w-full sm:max-w-sm">
            <label
              htmlFor="device-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search Devices
            </label>
            <input
              id="device-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search brand, model or IMEI"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            Loading your devices...
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            Device information is unavailable.
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-3xl">📱</div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {devices.length === 0
                ? "No devices registered yet"
                : "No matching devices found"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {devices.length === 0
                ? "Your registered devices will appear here."
                : "Try searching with another keyword."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                    No.
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                    Device
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                    IMEI
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                    Condition
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide">
                    Registered On
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((device, index) => (
                  <tr
                    key={device.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {device.brand || "Unknown Brand"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {device.model || "Model not available"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {device.imei || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${conditionStyle(
                          device.device_condition
                        )}`}
                      >
                        {formatCondition(device.device_condition)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {device.created_at
                        ? new Date(device.created_at).toLocaleDateString(
                            "en-IN"
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredDevices.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Showing {filteredDevices.length} of {devices.length} devices
          </div>
        )}
      </section>
    </div>
  );
}

export default MyDevices;
