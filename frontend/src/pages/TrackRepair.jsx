
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const statusStyles = {
  RECEIVED: "bg-yellow-100 text-yellow-700",
  DIAGNOSIS: "bg-orange-100 text-orange-700",
  ESTIMATE_PREPARED: "bg-indigo-100 text-indigo-700",
  WAITING_FOR_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  REPAIR_IN_PROGRESS: "bg-blue-100 text-blue-700",
  QC: "bg-purple-100 text-purple-700",
  QC_FAILED: "bg-red-100 text-red-700",
  REPAIR_REQUIRED: "bg-orange-100 text-orange-700",
  READY_FOR_DELIVERY: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-slate-200 text-slate-700",
};

const repairStages = [
  "RECEIVED",
  "DIAGNOSIS",
  "ESTIMATE_PREPARED",
  "WAITING_FOR_APPROVAL",
  "APPROVED",
  "REPAIR_IN_PROGRESS",
  "QC",
  "READY_FOR_DELIVERY",
  "COMPLETED",
];

const formatStatus = (value) =>
  (value || "UNKNOWN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function TrackRepair() {
  const { trackingToken } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchTrackingDetails() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `track/${encodeURIComponent(trackingToken)}/`
        );

        if (active) {
          setJob(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Tracking information could not be loaded. Please check the link."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchTrackingDetails();

    return () => {
      active = false;
    };
  }, [trackingToken]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-slate-600">
          Loading repair status...
        </p>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">
            Repair Tracking
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error || "Tracking details not found."}
          </p>

          <p className="mt-3 text-sm text-slate-500">
            Please verify the tracking link or contact the repair centre.
          </p>
        </div>
      </main>
    );
  }

  const currentStatus = job.status;

  const statusLabel =
    job.status_display || formatStatus(currentStatus);

  const statusClass =
    statusStyles[currentStatus] ||
    "bg-slate-100 text-slate-700";

  const statusHistory = Array.isArray(job.status_history)
    ? job.status_history
    : [];

  const currentStageIndex = repairStages.indexOf(currentStatus);

  const exceptionStatuses = [
    "REJECTED",
    "QC_FAILED",
    "REPAIR_REQUIRED",
    "CANCELLED",
  ];

  const isExceptionStatus =
    exceptionStatuses.includes(currentStatus);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">

        {/* Page Header */}
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
            📱
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
            Mobile Repair Centre
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track your device repair status
          </p>
        </header>

        {/* Job Card */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          {/* Job Card Number and Status */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-sm text-slate-500">
                Job Card Number
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {job.job_card_number}
              </h2>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>

          {/* Device Information */}
          <div className="py-6">
            <p className="text-sm font-medium text-slate-500">
              Device Information
            </p>

            <h3 className="mt-2 text-lg font-semibold text-slate-800">
              {job.device?.brand || "Unknown brand"}{" "}
              {job.device?.model || ""}
            </h3>
          </div>

          {/* Current Status */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">
              Current Repair Status
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {statusLabel}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Your repair progress is shown below. The timeline reflects
              status updates recorded by the repair centre.
            </p>
          </div>

          {/* Repair Progress Timeline */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-lg font-bold text-slate-900">
              Repair Progress Timeline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Follow the progress of your device repair.
            </p>

            <div className="mt-6 space-y-1">
              {repairStages.map((stage, index) => {
                const historyItem = statusHistory.find(
                  (item) => item.status === stage
                );

                const isCurrent = currentStatus === stage;

                const isCompleted =
                  currentStageIndex !== -1 &&
                  index < currentStageIndex;

                const isReached = isCurrent || isCompleted;

                return (
                  <div key={stage} className="flex gap-4">
                    <div className="flex w-8 shrink-0 flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                          isReached
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>

                      {index < repairStages.length - 1 && (
                        <div
                          className={`my-1 min-h-8 w-0.5 flex-1 ${
                            isCompleted
                              ? "bg-blue-600"
                              : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 pb-5">
                      <p
                        className={`font-semibold ${
                          isCurrent
                            ? "text-blue-700"
                            : isReached
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {formatStatus(stage)}

                        {isCurrent && (
                          <span className="ml-2 text-xs font-medium">
                            (Current)
                          </span>
                        )}
                      </p>

                      {historyItem?.changed_at && (
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(historyItem.changed_at)}
                        </p>
                      )}

                      {historyItem?.remarks && (
                        <p className="mt-1 text-sm text-slate-600">
                          {historyItem.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exceptional Status */}
            {isExceptionStatus && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-700">
                  {formatStatus(currentStatus)}
                </p>

                <p className="mt-1 text-sm text-red-600">
                  Please contact the repair centre for further information
                  about your repair.
                </p>
              </div>
            )}
          </div>

          {/* Actual Status History */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-lg font-bold text-slate-900">
              Status Update History
            </h3>

            {statusHistory.length === 0 ? (
              <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                No status history is available yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {[...statusHistory]
                  .reverse()
                  .map((item, index) => (
                    <div
                      key={item.id ?? `${item.status}-${index}`}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">
                          {formatStatus(item.status)}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatDate(item.changed_at)}
                        </p>
                      </div>

                      {item.remarks && (
                        <p className="mt-2 text-sm text-slate-600">
                          {item.remarks}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-sm text-slate-500">
              Last Updated
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {formatDate(job.last_updated)}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-slate-500">
          For assistance, please contact your repair centre.
        </footer>

      </div>
    </main>
  );
}
