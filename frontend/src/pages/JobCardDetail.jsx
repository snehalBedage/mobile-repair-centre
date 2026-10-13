
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../services/api";

const STATUSES = [
  { value: "RECEIVED", label: "Received" },
  { value: "DIAGNOSIS", label: "Diagnosis" },
  { value: "ESTIMATE_PREPARED", label: "Estimate Prepared" },
  { value: "WAITING_FOR_APPROVAL", label: "Waiting for Approval" },
  { value: "REPAIR_IN_PROGRESS", label: "Repair In Progress" },
  { value: "QC", label: "Quality Check" },
  { value: "QC_FAILED", label: "QC Failed" },
  { value: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const ALLOWED_NEXT_STATUSES = {
  RECEIVED: ["DIAGNOSIS", "CANCELLED"],
  DIAGNOSIS: ["ESTIMATE_PREPARED", "CANCELLED"],
  ESTIMATE_PREPARED: ["WAITING_FOR_APPROVAL", "CANCELLED"],
  WAITING_FOR_APPROVAL: ["CANCELLED"],
  APPROVED: ["REPAIR_IN_PROGRESS", "CANCELLED"],
  REPAIR_IN_PROGRESS: ["QC", "CANCELLED"],
  QC: ["QC_FAILED", "READY_FOR_DELIVERY"],
  QC_FAILED: ["REPAIR_IN_PROGRESS"],
  READY_FOR_DELIVERY: ["COMPLETED"],
  REPAIR_REQUIRED: [],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

const listOf = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

const errorText = (error) =>
  error.response?.data?.detail ||
  error.response?.data?.message ||
  Object.values(error.response?.data || {}).flat().join(" ") ||
  error.message ||
  "Something went wrong. Please try again.";

const valueText = (value) => {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "object") return value.name || value.model || "Not provided";
  return String(value);
};

const formatStatus = (value) => String(value || "N/A").replaceAll("_", " ");

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

function Info({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">{valueText(value)}</p>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export default function JobCardDetail() {
  const { id } = useParams();
  const qrRef = useRef(null);

  const [job, setJob] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [statusError, setStatusError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const loadDetails = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.get(`job-cards/${id}/`),
        api.get("customers/"),
        api.get("customers/devices/"),
        api.get("technicians/"),
        api.get(`job-cards/${id}/status-history/`),
      ]);

      if (results[0].status === "rejected") throw results[0].reason;

      const responseData = results[0].value.data;
      const jobData = responseData?.job_card || responseData?.data || responseData;

      setJob(jobData);
      setSelectedStatus(ALLOWED_NEXT_STATUSES[jobData.status]?.[0] || "");

      setCustomers(results[1].status === "fulfilled" ? listOf(results[1].value.data) : []);
      setDevices(results[2].status === "fulfilled" ? listOf(results[2].value.data) : []);
      setTechnicians(results[3].status === "fulfilled" ? listOf(results[3].value.data) : []);
      setHistory(results[4].status === "fulfilled" ? listOf(results[4].value.data) : []);
    } catch (err) {
      setError(errorText(err));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          api.get(`job-cards/${id}/`),
          api.get("customers/"),
          api.get("customers/devices/"),
          api.get("technicians/"),
          api.get(`job-cards/${id}/status-history/`),
        ]);

        if (results[0].status === "rejected") throw results[0].reason;
        if (!active) return;

        const responseData = results[0].value.data;
        const jobData = responseData?.job_card || responseData?.data || responseData;

        setJob(jobData);
        setSelectedStatus(ALLOWED_NEXT_STATUSES[jobData.status]?.[0] || "");
        setCustomers(results[1].status === "fulfilled" ? listOf(results[1].value.data) : []);
        setDevices(results[2].status === "fulfilled" ? listOf(results[2].value.data) : []);
        setTechnicians(results[3].status === "fulfilled" ? listOf(results[3].value.data) : []);
        setHistory(results[4].status === "fulfilled" ? listOf(results[4].value.data) : []);
      } catch (err) {
        if (active) setError(errorText(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [id]);

  const customer =
    typeof job?.customer === "object" && job.customer !== null
      ? job.customer
      : customers.find((item) => String(item.id) === String(job?.customer));

  const device =
    typeof job?.device === "object" && job.device !== null
      ? job.device
      : devices.find((item) => String(item.id) === String(job?.device));

  const technician =
    typeof job?.technician === "object" && job.technician !== null
      ? job.technician
      : technicians.find((item) => String(item.id) === String(job?.technician));

  const jobNumber = job?.job_card_number || job?.job_number || `JOB-${job?.id}`;
  const customerName =
    customer?.name || customer?.full_name || job?.customer_name ||
    `Customer #${job?.customer ?? "-"}`;

  const customerPhone =
    customer?.mobile || customer?.phone || customer?.phone_number ||
    job?.customer_mobile || job?.mobile || "";

  const customerEmail = customer?.email || job?.customer_email;

  const deviceName =
    [device?.brand, device?.model].filter(Boolean).join(" ") ||
    job?.device_name || `Device #${job?.device ?? "-"}`;

  const trackingToken =
    job?.tracking_token || job?.public_tracking_token || job?.tracking?.token || "";

  const trackingUrl = trackingToken
    ? `${window.location.origin}/track/${encodeURIComponent(trackingToken)}`
    : "";

  const allowedStatuses = ALLOWED_NEXT_STATUSES[job?.status] || [];
  console.log("Current status:", job?.status);
console.log("Selected status:", selectedStatus);
console.log("Allowed next statuses:", allowedStatuses);

  const statusClass =
    job?.status === "COMPLETED" || job?.status === "READY_FOR_DELIVERY"
      ? "bg-green-100 text-green-800"
      : job?.status === "QC"
        ? "bg-purple-100 text-purple-800"
        : job?.status === "REPAIR_IN_PROGRESS"
          ? "bg-blue-100 text-blue-800"
          : ["QC_FAILED", "REJECTED", "CANCELLED"].includes(job?.status)
            ? "bg-red-100 text-red-800"
            : "bg-amber-100 text-amber-800";

  const whatsappUrl = () => {
    const digits = String(customerPhone).replace(/\D/g, "");
    if (!digits) {
      setError("Customer phone number is not available.");
      return null;
    }

    const phone = digits.length === 10 ? `91${digits}` : digits;
    const trackingLine = trackingUrl ? `\nTrack your repair: ${trackingUrl}` : "";
    const text = [
      `Hello ${customerName},`,
      "",
      "Thank you for choosing Mobile Repair Centre.",
      `Your repair job number is ${jobNumber}.`,
      `Device: ${deviceName}.`,
      `Current repair status: ${formatStatus(job.status)}.`,
      trackingLine,
      "",
      "Please contact our service centre if you need any assistance.",
      "",
      "Regards,",
      "Mobile Repair Centre",
    ].filter((line) => line !== null).join("\n");

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleWhatsApp = () => {
    setError("");
    const url = whatsappUrl();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyText = async (text) => {
    if (!text) throw new Error("Nothing to copy");

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!success) throw new Error("Copy failed");
  };

  const handleCopyLink = async () => {
    try {
      if (!trackingUrl) throw new Error("Tracking link is not available for this job card.");
      await copyText(trackingUrl);
      setCopied(true);
      setMessage("Tracking link copied successfully.");
      setError("");
    } catch (err) {
      setError(err.message || "Unable to copy tracking link.");
    }
  };

  const handleShareLink = async () => {
    if (!trackingUrl) {
      setError("Tracking link is not available for this job card.");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Repair Tracking - ${jobNumber}`,
          text: `Track your repair at Mobile Repair Centre. Job: ${jobNumber}`,
          url: trackingUrl,
        });
      } else {
        await copyText(trackingUrl);
        setMessage("Sharing is not supported here. Link copied instead.");
      }
      setError("");
    } catch (err) {
      if (err.name !== "AbortError") setError("Unable to share the tracking link.");
    }
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) {
      setError("QR code is not available to download.");
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        setError("Could not generate the QR image.");
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 30, 30, 540, 540);
      URL.revokeObjectURL(objectUrl);

      const link = document.createElement("a");
      link.download = `${jobNumber}-tracking-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("Could not generate the QR image.");
    };

    image.src = objectUrl;
  };

  const handleStatusUpdate = async () => {
    setStatusError("");
    setError("");
    setMessage("");

    if (!job || !allowedStatuses.includes(selectedStatus)) {
      setStatusError("Please select a valid next status.");
      return;
    }

    const remarksRequired =
      selectedStatus === "COMPLETED" ||
      (job.status === "QC_FAILED" && selectedStatus === "REPAIR_IN_PROGRESS");

    if (remarksRequired && !statusRemarks.trim()) {
      setStatusError("Please enter remarks for this status update.");
      return;
    }

    setUpdating(true);

    try {
      await api.patch(`job-cards/${id}/status/`, {
        status: selectedStatus,
        remarks: statusRemarks.trim(),
      });

      setMessage("Repair status updated successfully.");
      setStatusRemarks("");
      await loadDetails(false);
    } catch (err) {
      setSelectedStatus(job.status);
      setStatusError(errorText(err));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-500">
        Loading job card details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="mb-4 text-red-600">{error || "Job card not found."}</p>
        <Link to="/job-cards" className="font-semibold text-blue-600 hover:underline">
          ← Back to Job Cards
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/job-cards" className="mb-5 inline-flex text-sm font-semibold text-blue-600 hover:underline">
          ← Back to Job Cards
        </Link>

        <header className="mb-6 rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-slate-300">MOBILE REPAIR CENTRE</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{jobNumber}</h1>
              <p className="mt-2 text-sm text-slate-300">Repair Job Card · Customer: {customerName}</p>
            </div>
            <div>
              <span className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${statusClass}`}>
                {formatStatus(job.status)}
              </span>
              <p className="mt-3 text-right text-sm text-slate-300">Priority: {valueText(job.priority)}</p>
            </div>
          </div>
        </header>

        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {message && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Customer Information" subtitle="Contact details for this repair">
            <Info label="Customer Name" value={customerName} />
            <Info label="Mobile Number" value={customerPhone} />
            <Info label="Email Address" value={customerEmail} />
            <Info label="Address" value={customer?.address} />
          </Section>

          <Section title="Device Information" subtitle="Device registered against this job card">
            <Info label="Device" value={deviceName} />
            <Info label="Brand" value={device?.brand} />
            <Info label="Model" value={device?.model} />
            <Info label="IMEI" value={device?.imei} />
            <Info label="Device Condition" value={device?.device_condition} />
          </Section>

          <Section title="Repair Information" subtitle="Problem description and technician assignment">
            <Info label="Assigned Technician" value={technician?.name || job.technician_name || (job.technician ? `Technician #${job.technician}` : "Unassigned")} />
            <Info label="Reported Problem" value={job.reported_problem} />
            <Info label="Diagnosis" value={job.diagnosis} />
            <Info label="Priority" value={job.priority} />
          </Section>

          <Section title="Repair Timeline" subtitle="Dates recorded for this job card">
            <Info label="Current Status" value={formatStatus(job.status)} />
            <Info label="Received Date" value={formatDate(job.intake_date)} />
            <Info label="Completed Date" value={formatDate(job.completed_date)} />
            <Info label="Created At" value={formatDate(job.created_at)} />
            <Info label="Last Updated" value={formatDate(job.updated_at)} />
          </Section>
        </div>

        <div className="mt-5">
          <Section title="Repair Tracking & QR Code" subtitle="Share the tracking link with the customer or download the QR code.">
            {trackingUrl ? (
              <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
                <div ref={qrRef} className="mx-auto rounded-xl border border-slate-200 bg-white p-4">
                  <QRCodeSVG value={trackingUrl} size={180} level="H" includeMargin />
                  <p className="mt-2 text-center text-xs font-semibold text-slate-600">{jobNumber}</p>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Customer Tracking Link</p>
                  <p className="mt-2 break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{trackingUrl}</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={handleCopyLink} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      {copied ? "Link Copied" : "Copy Link"}
                    </button>
                    <button type="button" onClick={handleShareLink} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Share Link</button>
                    <button type="button" onClick={handleDownloadQR} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download QR</button>
                    <button type="button" onClick={() => setShowQR(true)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Enlarge QR</button>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    The tracking URL must point to a working public tracking page. A localhost URL works only on the local machine.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                A tracking token was not found in this job card response. The QR and share link cannot be generated until the API provides a valid tracking token.
              </div>
            )}
          </Section>
        </div>

        <div className="mt-5">
          <Section title="Customer Communication" subtitle="Prepare a professional repair update for WhatsApp.">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-slate-800">Send repair status to {customerName}</p>
                <p className="mt-1 text-sm text-slate-500">The message includes the job number, device, current status and tracking link when available.</p>
                <p className="mt-2 text-sm text-slate-600">Mobile: {valueText(customerPhone)}</p>
              </div>
              <button type="button" onClick={handleWhatsApp} className="shrink-0 rounded-lg bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700">
                Open WhatsApp Message
              </button>
            </div>
          </Section>
        </div>

        <div className="mt-5">
          <Section title="Repair Status" subtitle="Select the next valid status and save it. Estimate approval/rejection must be done from the customer's estimate approval page.">
            {allowedStatuses.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                This job card has no further status changes available.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label htmlFor="repair-status" className="mb-2 block text-sm font-semibold text-slate-700">Next Status</label>
                    <select
                      id="repair-status"
                      value={selectedStatus}
                      onChange={(event) => {
                        setSelectedStatus(event.target.value);
                        setStatusError("");
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      {allowedStatuses.map((value) => {
                        const item = STATUSES.find((status) => status.value === value);
                        return <option key={value} value={value}>{item?.label || formatStatus(value)}</option>;
                      })}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={updating || !selectedStatus || !allowedStatuses.includes(selectedStatus)}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {updating ? "Saving..." : "Save Status"}
                  </button>
                </div>

                <div className="mt-4">
                  <label htmlFor="status-remarks" className="mb-2 block text-sm font-semibold text-slate-700">
                    Remarks {selectedStatus === "COMPLETED" || (job.status === "QC_FAILED" && selectedStatus === "REPAIR_IN_PROGRESS") ? "*" : "(optional)"}
                  </label>
                  <textarea
                    id="status-remarks"
                    rows={3}
                    maxLength={2000}
                    value={statusRemarks}
                    onChange={(event) => {
                      setStatusRemarks(event.target.value);
                      setStatusError("");
                    }}
                    placeholder="Add notes for this status change..."
                    aria-invalid={Boolean(statusError)}
                    className={`w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 ${statusError ? "border-red-500" : "border-slate-300"}`}
                  />
                  {statusError && <p role="alert" className="mt-1.5 text-xs text-red-600">{statusError}</p>}
                </div>
              </>
            )}
          </Section>
        </div>

        <div className="mt-5">
          <Section title="Status History" subtitle="Previously recorded repair status updates.">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No status history is available.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={item.id ?? index} className="flex gap-3 rounded-lg border border-slate-100 p-4">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        {formatStatus(item.new_status || item.status || item.current_status || item.previous_status || item.old_status)}
                      </p>
                      {(item.remarks || item.note) && <p className="mt-1 text-sm text-slate-600">{item.remarks || item.note}</p>}
                      <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at || item.changed_at || item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <footer className="py-8 text-center text-xs text-slate-400">
          © 2026 Mobile Repair Centre — Repair Management System
        </footer>

        {showQR && trackingUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setShowQR(false)}>
            <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Repair Tracking QR</h2>
                <button type="button" onClick={() => setShowQR(false)} aria-label="Close QR" className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100">×</button>
              </div>
              <div className="flex justify-center">
                <QRCodeSVG value={trackingUrl} size={240} level="H" includeMargin />
              </div>
              <p className="mt-4 font-semibold text-slate-800">{jobNumber}</p>
              <p className="mt-2 break-all text-xs text-slate-500">{trackingUrl}</p>
              <button type="button" onClick={handleDownloadQR} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
                Download QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
