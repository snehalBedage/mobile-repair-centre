
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function MyPayments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("billing/payments/");
      const data = response.data;

      const paymentList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setPayments(paymentList);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to load payment records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return payments;

    return payments.filter((payment) => {
      const jobCard =
        typeof payment.job_card === "object"
          ? payment.job_card?.job_card_number
          : payment.job_card;

      const searchableText = [
        payment.payment_reference,
        jobCard,
        payment.payment_method,
        payment.payment_status,
        payment.amount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [payments, search]);

  
const totalPaid = payments
  .filter(
    (payment) =>
      String(payment.payment_status || "").toUpperCase() === "PAID"
  )
  .reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );


  const downloadReceipt = async (paymentId) => {
    try {
      const response = await api.get(
        `billing/payments/${paymentId}/receipt/`,
        { responseType: "blob" }
      );

      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `payment-receipt-${paymentId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Unable to download the payment receipt.");
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN");
  };

  const getJobCardNumber = (jobCard) => {
    if (!jobCard) return "—";

    if (typeof jobCard === "object") {
      return jobCard.job_card_number || jobCard.id || "—";
    }

    return jobCard;
  };

  const getStatusClass = (status) => {
    const normalizedStatus = String(status || "").toUpperCase();

    if (["COMPLETED", "SUCCESS", "PAID"].includes(normalizedStatus)) {
      return "bg-green-100 text-green-700";
    }

    if (
      ["PENDING", "PROCESSING", "PARTIAL"].includes(normalizedStatus)
    ) {
      return "bg-amber-100 text-amber-700";
    }

    if (["FAILED", "CANCELLED", "REJECTED"].includes(normalizedStatus)) {
      return "bg-red-100 text-red-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          My Payments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View your payment history and download receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Payments</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {payments.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Paid</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Payment History
          </h2>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search payments..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
          />
        </div>

        {error && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchPayments}
              className="font-semibold underline"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium text-slate-700">
              No payments found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your payment records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Job Card</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Receipt</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-medium text-slate-800">
                      {payment.payment_reference || payment.id || "—"}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {getJobCardNumber(payment.job_card)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(payment.payment_date)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {payment.payment_method || "—"}
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {formatCurrency(payment.amount)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          payment.payment_status
                        )}`}
                      >
                        {payment.payment_status || "Unknown"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => downloadReceipt(payment.id)}
                        disabled={!payment.id}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
