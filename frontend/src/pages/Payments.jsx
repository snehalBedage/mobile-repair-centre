
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getPayments, getJobCards } from "../services/dashboardApi";

const EMPTY_FORM = {
  job_card: "",
  payment_reference: "",
  amount: "",
  payment_method: "CASH",
  payment_date: "",
  payment_status: "PENDING",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getErrorMessage = (error) => {
  const data = error.response?.data;

  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);

        return `${field}: ${message}`;
      })
      .join("\n");
  }

  return error.message || "Something went wrong. Please try again.";
};

const formatAmount = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatPaymentId = (id) =>
  `PAY-${String(id).padStart(5, "0")}`;

const getJobId = (payment) => {
  if (payment.job_card && typeof payment.job_card === "object") {
    return payment.job_card.id;
  }

  return payment.job_card;
};

const getJobNumber = (jobId, jobCards) => {
  const job = jobCards.find(
    (item) => String(item.id) === String(jobId)
  );

  return job?.job_card_number || (job ? `Job Card ${job.id}` : "—");
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMethod = (method) => {
  const methods = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    OTHER: "Other",
  };

  return methods[method] || method || "—";
};

const statusClass = (status) => {
  const styles = {
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-800",
    FAILED: "bg-red-100 text-red-700",
  };

  return styles[status] || "bg-slate-100 text-slate-700";
};

function SummaryCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [billingSummaries, setBillingSummaries] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);



const completedJobCards = useMemo(
  () =>
    jobCards.filter((job) => {
      if (job.status !== "COMPLETED") {
        return false;
      }

      const summary = billingSummaries[job.id];

      if (!summary || summary.remaining_amount == null) {
        return false;
      }

      const remainingAmount = Number(summary.remaining_amount);

      if (!Number.isFinite(remainingAmount) || remainingAmount <= 0) {
        return false;
      }

      const jobPayments = payments.filter(
        (payment) =>
          Number(getJobId(payment)) === Number(job.id)
      );

      const hasPendingPayment = jobPayments.some(
        (payment) => payment.payment_status === "PENDING"
      );


      if (hasPendingPayment) {
        return false;
      }

      return true;
    }),
  [jobCards, payments, billingSummaries]
);


const loadData = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const [loadedPayments, loadedJobCards] = await Promise.all([
       getPayments(),
      getJobCards(),
    ])
    setPayments(loadedPayments);
    setJobCards(loadedJobCards);

    const completedJobs = loadedJobCards.filter(
      (job) => job.status === "COMPLETED"
    );

    const summaryResults = await Promise.all(
      completedJobs.map(async (job) => {
        try {
          const response = await api.get(
            `billing/job-cards/${job.id}/`
          );

      return [job.id, response.data];
} catch (err) {
  const message = err.response?.data?.detail;

  if (
    err.response?.status === 400 &&
    message ===
      "Approved estimate not found for this Job Card."
  ) {
    // Expected when a completed Job Card has no approved estimate.
    return [job.id, null];
  }

  console.error(
    `Billing summary failed for Job Card ${job.id}:`,
    err.response?.data || err.message
  );

  return [job.id, null];
}


      })
    );

    setBillingSummaries(
      Object.fromEntries(
        summaryResults.filter(([, summary]) => summary !== null)
      )
    );
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return payments;

    return payments.filter((payment) => {
      const jobNumber = getJobNumber(getJobId(payment), jobCards);
      const formattedId = formatPaymentId(payment.id).toLowerCase();

      return (
        String(payment.id).includes(term) ||
        formattedId.includes(term) ||
        String(payment.payment_reference || "")
          .toLowerCase()
          .includes(term) ||
        jobNumber.toLowerCase().includes(term) ||
        String(payment.payment_method || "")
          .toLowerCase()
          .includes(term) ||
        String(payment.payment_status || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [payments, jobCards, search]);

  const paidTotal = payments
    .filter((payment) => payment.payment_status === "PAID")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const paidCount = payments.filter(
    (payment) => payment.payment_status === "PAID"
  ).length;

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
  };

  const handleCreatePayment = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");


    if (
      !form.job_card ||
      (form.payment_method !== "CASH" &&
      !form.payment_reference.trim()) ||
      !form.amount ||
      !form.payment_method ||
      !form.payment_date
    ) {

      setError("Please fill in all required payment fields.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    const jobCardId = Number(form.job_card);

    const selectedJob = completedJobCards.find(
      (job) => Number(job.id) === jobCardId
    );

    if (!selectedJob) {
      setError(
        "Payment can only be recorded for a COMPLETED Job Card."
      );
      return;
    }

    const paymentDate = new Date(form.payment_date);

    if (Number.isNaN(paymentDate.getTime())) {
      setError("Please enter a valid payment date and time.");
      return;
    }

    setSaving(true);

    try {
      await api.post("billing/payments/", {
        job_card: jobCardId,
        payment_reference:
          form.payment_method === "CASH"
           ? null
            : form.payment_reference.trim(),
        amount: amount.toFixed(2),
        payment_method: form.payment_method,
        payment_date: paymentDate.toISOString(),
      });

      setSuccess(
        "Payment record created successfully. Please verify its status in Payment History."
      );

      setForm(EMPTY_FORM);
      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleReceiptDownload = async (payment) => {
    setError("");
    setSuccess("");
    setDownloadingId(payment.id);

    try {
      const response = await api.get(
        `billing/payments/${payment.id}/receipt/`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `payment-receipt-${payment.payment_reference || payment.id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setSuccess(
        `Receipt for ${payment.payment_reference || `payment #${payment.id}`} downloaded.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  };
const handleUpdatePaymentStatus = async (payment, newStatus) => {
  setError("");
  setSuccess("");

  if (payment.payment_status !== "PENDING") {
    setError("Only pending payments can be updated.");
    return;
  }

  const confirmed = window.confirm(
    newStatus === "PAID"
      ? "Have you verified that this payment was received?"
      : "Are you sure you want to mark this payment as failed?"
  );

  if (!confirmed) return;

  setUpdatingPaymentId(payment.id);

  try {
    await api.patch(`billing/payments/${payment.id}/`, {
      payment_status: newStatus,
    });

    setSuccess(
      newStatus === "PAID"
        ? "Payment confirmed successfully."
        : "Payment marked as failed."
    );

    await loadData();
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setUpdatingPaymentId(null);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Payments
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Record repair payments and manage payment receipts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm((previous) => !previous);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {showForm ? "Close Form" : "+ Record Payment"}
          </button>
        </header>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Payment Records"
            value={payments.length}
            description="Records returned by the payments API"
          />

          <SummaryCard
            title="Paid Transactions"
            value={paidCount}
            description="Payments with PAID status"
          />

          <SummaryCard
            title="Total Paid"
            value={formatAmount(paidTotal)}
            description="Sum of PAID records currently loaded"
          />
        </section>

        {/* Payment Form */}
        {showForm && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-800">
                Record New Payment
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the payment details for an approved repair estimate.
              </p>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label
                    htmlFor="job_card"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Job Card <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="job_card"
                    name="job_card"
                    value={form.job_card}
                    onChange={handleFormChange}
                    required
                    disabled={loading || completedJobCards.length === 0}
                    className={INPUT_CLASS}
                  >
                    <option value="">Select Job Card</option>

                    {completedJobCards.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.job_card_number || `Job Card ${job.id}`} — COMPLETED
                      </option>
                    ))}
                  </select>

                  {completedJobCards.length === 0 && !loading && (
                    <p className="mt-1 text-xs text-amber-700">
                      No completed Job Cards are available for payment.
                    </p>
                  )}
                </div>


                {form.payment_method !== "CASH" && (
                  <div>
                  <label
                    htmlFor="payment_reference"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Payment Reference <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="payment_reference"
                    name="payment_reference"
                    type="text"
                    maxLength={100}
                    minLength={12}
                    value={form.payment_reference}
                    onChange={handleFormChange}
                    placeholder="Enter unique transaction/reference ID"
                    required
                    className={INPUT_CLASS}
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    This reference must be unique.
                  </p>
                </div>
                  )}
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    required
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label
                    htmlFor="payment_method"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Payment Method <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="payment_method"
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleFormChange}
                    required
                    className={INPUT_CLASS}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="payment_date"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Payment Date &amp; Time{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="payment_date"
                    name="payment_date"
                    type="datetime-local"
                    value={form.payment_date}
                    onChange={handleFormChange}
                    required
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Status
                  </label>

                  <div className="flex min-h-[42px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      PENDING
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      Awaiting payment confirmation
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    loading ||
                    completedJobCards.length === 0
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving Payment..." : "Save Payment"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Payment History */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Payment History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View recorded transactions and download PDF receipts.
              </p>
            </div>

            <div className="w-full sm:max-w-sm">
              <label
                htmlFor="payment_search"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                Search Payments
              </label>

              <input
                id="payment_search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Payment ID, reference, Job Card, method or status..."
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading payments...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                No Payments Found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try another search term."
                  : "No payment records were returned by the API."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">
                      Payment ID
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">
                      Payment Reference
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">
                      Job Card
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">
                      Payment Date
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">
                      Method
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-white">
                      Amount
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-white">
                      Actions
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-white">
                      Receipt
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                        {formatPaymentId(payment.id)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-800">
                        {payment.payment_reference}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                        {getJobNumber(getJobId(payment), jobCards)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(payment.payment_date)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        {formatMethod(payment.payment_method)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-slate-800">
                        {formatAmount(payment.amount)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            payment.payment_status
                          )}`}
                        >
                          {payment.payment_status || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center">
  {payment.payment_status === "PENDING" ? (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handleUpdatePaymentStatus(payment, "PAID")}
        disabled={updatingPaymentId === payment.id}
        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {updatingPaymentId === payment.id
          ? "Updating..."
          : "Confirm Payment"}
      </button>

      <button
        type="button"
        onClick={() => handleUpdatePaymentStatus(payment, "FAILED")}
        disabled={updatingPaymentId === payment.id}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Mark Failed
      </button>
    </div>
  ) : (
    <span className="text-xs text-slate-400">No actions</span>
  )}
</td>

                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleReceiptDownload(payment)}
                          disabled={downloadingId === payment.id}
                          className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {downloadingId === payment.id
                            ? "Downloading..."
                            : "Download PDF"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredPayments.length > 0 && (
            <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
              Showing {filteredPayments.length} records from the currently
              loaded payment page.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
