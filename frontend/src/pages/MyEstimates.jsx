
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const formatAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const statusStyles = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const getErrorMessage = (error) => {
  const data = error.response?.data;

  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;

  for (const value of Object.values(data || {})) {
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]);
    }
  }

  if (error.response?.status === 401) {
    return "Session expired. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  return "Something went wrong. Please try again.";
};

export default function MyEstimates() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadEstimates = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setRefreshing(true);
    }

    try {
      setError("");

      const response = await api.get("estimates/");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setEstimates(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEstimates();
  }, [loadEstimates]);

  const handleDecision = async (estimate, approvalStatus) => {
    if (processingId !== null) return;

    const action =
      approvalStatus === "APPROVED" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} estimate ${
        estimate.job_card_number || `#${estimate.id}`
      } for ${formatAmount(estimate.total_amount)}?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(estimate.id);
      setError("");
      setMessage("");

      const response = await api.patch(
        `estimates/${estimate.id}/approval/`,
        {
          approval_status: approvalStatus,
          remarks:
            approvalStatus === "APPROVED"
              ? "Customer approved the estimate."
              : "Customer rejected the estimate.",
        }
      );

      const returnedStatus = response.data?.job_card_status;
      const statusMessage =
        approvalStatus === "APPROVED"
          ? "Estimate approved successfully."
          : "Estimate rejected successfully.";

      setMessage(
        `${response.data?.message || statusMessage}${
          returnedStatus
            ? ` Job Card status: ${returnedStatus.replaceAll("_", " ")}.`
            : ""
        }`
      );

      await loadEstimates();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-slate-600" role="status">
        Loading estimates...
      </div>
    );
  }

  const pendingCount = estimates.filter(
    (estimate) => estimate.approval_status === "PENDING"
  ).length;

  const approvedCount = estimates.filter(
    (estimate) => estimate.approval_status === "APPROVED"
  ).length;

  const rejectedCount = estimates.filter(
    (estimate) => estimate.approval_status === "REJECTED"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            My Estimates
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review your repair costs and approve or reject pending estimates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadEstimates(true)}
          disabled={refreshing || processingId !== null}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Estimates</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {estimates.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Approved</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Rejected</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {rejectedCount}
          </p>
        </div>
      </div>

      {estimates.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-700">
            No estimates available
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your repair estimates will appear here when the repair centre
            creates them.
          </p>

          <button
            type="button"
            onClick={() => loadEstimates(true)}
            disabled={refreshing}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {refreshing ? "Checking..." : "Check Again"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {estimates.map((estimate) => {
            const status = estimate.approval_status || "PENDING";
            const isPending = status === "PENDING";
            const isProcessing = processingId === estimate.id;

            return (
              <div
                key={estimate.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-800">
                      {estimate.job_card_number ||
                        `Estimate #${estimate.id}`}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {estimate.device_name ||
                        "Device details unavailable"}
                    </p>

                    {estimate.customer_name && (
                      <p className="mt-1 text-xs text-slate-500">
                        Customer: {estimate.customer_name}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[status] ||
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="my-5 space-y-3 border-y border-slate-100 py-4">
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-500">Service Cost</span>
                    <span className="font-medium text-slate-700">
                      {formatAmount(estimate.service_cost)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-slate-500">Parts Cost</span>
                    <span className="font-medium text-slate-700">
                      {formatAmount(estimate.parts_cost)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                    <span className="font-semibold text-slate-700">
                      Total Amount
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      {formatAmount(estimate.total_amount)}
                    </span>
                  </div>
                </div>

                {isPending ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={processingId !== null}
                      onClick={() =>
                        handleDecision(estimate, "APPROVED")
                      }
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? "Saving..." : "Approve Estimate"}
                    </button>

                    <button
                      type="button"
                      disabled={processingId !== null}
                      onClick={() =>
                        handleDecision(estimate, "REJECTED")
                      }
                      className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? "Saving..." : "Reject Estimate"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    You have already responded to this estimate.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
