
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const STATUS_LABELS = {
  RECEIVED: "Received",
  DIAGNOSIS: "Diagnosis",
  ESTIMATE_PREPARED: "Estimate Prepared",
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REPAIR_IN_PROGRESS: "Repair In Progress",
  QC: "Quality Check",
  QC_FAILED: "QC Failed",
  REPAIR_REQUIRED: "Repair Required",
  READY_FOR_DELIVERY: "Ready for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function getList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN");
}

function getStatusClass(status) {
  if (status === "COMPLETED") {
    return "bg-green-100 text-green-700";
  }

  if (["CANCELLED", "REJECTED", "QC_FAILED"].includes(status)) {
    return "bg-red-100 text-red-700";
  }

  if (status === "REPAIR_IN_PROGRESS") {
    return "bg-blue-100 text-blue-700";
  }

  if (["QC", "READY_FOR_DELIVERY"].includes(status)) {
    return "bg-purple-100 text-purple-700";
  }

  return "bg-amber-100 text-amber-800";
}

function getDeviceDetails(job, devices) {
  const deviceValue = job.device;

  // Some APIs return a nested device object.
  if (deviceValue && typeof deviceValue === "object") {
    const matchingDevice = devices.find(
      (device) =>
        String(device.id) === String(deviceValue.id)
    );

    return matchingDevice || deviceValue;
  }

  // Other APIs return only the device ID.
  if (deviceValue !== null && deviceValue !== undefined) {
    return (
      devices.find(
        (device) => String(device.id) === String(deviceValue)
      ) || null
    );
  }

  return null;
}

function getDeviceName(job, devices) {
  const device = getDeviceDetails(job, devices);

  if (!device) {
    return "Device details unavailable";
  }

  const brand = device.brand || "";
  const model = device.model || "";
  const name = `${brand} ${model}`.trim();

  return name || "Device name unavailable";
}

export default function MyRepairs() {
  const [jobs, setJobs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRepairs() {
      try {
        setLoading(true);
        setError("");

        const [jobsResponse, devicesResponse] = await Promise.all([
          api.get("job-cards/"),
          api.get("customers/devices/"),
        ]);

        if (active) {
          setJobs(getList(jobsResponse.data));
          setDevices(getList(devicesResponse.data));
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load your repair records. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRepairs();

    return () => {
      active = false;
    };
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const deviceName = getDeviceName(job, devices);

    const searchableText = [
      job.job_card_number,
      deviceName,
      job.reported_problem,
      STATUS_LABELS[job.status] || job.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.trim().toLowerCase());
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          My Repairs
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View your repair jobs and follow their current status.
        </p>
      </header>

      {/* Summary and Search */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">
            Total Repair Jobs
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {loading ? "—" : jobs.length}
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="repair-search"
            className="block text-sm font-medium text-slate-700"
          >
            Search repairs
          </label>

          <input
            id="repair-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search job number, device or status"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Repair Jobs Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading your repairs...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Repair records are currently unavailable.
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl">🔧</div>

            <p className="mt-3 font-semibold text-slate-800">
              {jobs.length === 0
                ? "No repair jobs found"
                : "No matching repairs"}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {jobs.length === 0
                ? "Your repair jobs will appear here when available."
                : "Try searching with another keyword."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Job Card
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Device
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Reported Problem
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Received Date
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Tracking
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {job.job_card_number || `JOB-${job.id}`}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {getDeviceName(job, devices)}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {job.reported_problem || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          job.status
                        )}`}
                      >
                        {STATUS_LABELS[job.status] ||
                          job.status ||
                          "Unknown"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(job.intake_date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {job.tracking_token ? (
                        <Link
                          to={`/track/${encodeURIComponent(
                            job.tracking_token
                          )}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          Track Repair
                        </Link>
                      ) : (
                        <span className="text-slate-400">
                          Unavailable
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Showing {filteredJobs.length} of {jobs.length} repair jobs
          </div>
        )}
      </section>
    </div>
  );
}
