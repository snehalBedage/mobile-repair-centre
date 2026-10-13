
import { useEffect, useState } from "react";

import {
  getMyProfile,
  updateMyProfile,
  getDevices,
  getJobCards,
  getEstimates,
  getPayments,
} from "../services/dashboardApi";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const STATUS_LABELS = {
  RECEIVED: "Received",
  DIAGNOSIS: "Diagnosis",
  ESTIMATE_PREPARED: "Estimate Prepared",
  WAITING_FOR_APPROVAL: "Waiting Approval",
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

const STATUS_COLORS = {
  RECEIVED: "bg-blue-500",
  DIAGNOSIS: "bg-purple-500",
  ESTIMATE_PREPARED: "bg-indigo-500",
  WAITING_FOR_APPROVAL: "bg-orange-500",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  REPAIR_IN_PROGRESS: "bg-yellow-500",
  QC: "bg-cyan-500",
  QC_FAILED: "bg-red-500",
  REPAIR_REQUIRED: "bg-orange-500",
  READY_FOR_DELIVERY: "bg-teal-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-slate-500",
};

function SummaryCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function CustomerDashboard() {
  const [data, setData] = useState({
    devices: [],
    jobs: [],
    estimates: [],
    payments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile: "",
    address: "",
  });

  const [profileSaving, setProfileSaving] = useState(false);

  // Existing dashboard data loading
  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [devices, jobs, estimates, payments] =
          await Promise.all([
            getDevices(),
            getJobCards(),
            getEstimates(),
            getPayments(),
          ]);

        if (active) {
          setData({ devices, jobs, estimates, payments });
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              "Unable to load dashboard data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  // Load profile when the My Profile section is opened
  useEffect(() => {
    if (!showProfile) return;

    let active = true;

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError("");
      setProfileSuccess("");

      try {
        const result = await getMyProfile();

        if (active) {
          setProfile(result);

          setProfileForm({
            name: result.name || "",
            mobile: result.mobile || "",
            address: result.address || "",
          });
        }
      } catch (err) {
        if (active) {
          setProfileError(
            err.response?.data?.detail ||
              err.response?.data?.message ||
              "Unable to load your profile."
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [showProfile]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const updatedProfile = await updateMyProfile({
        name: profileForm.name.trim(),
        mobile: profileForm.mobile.trim(),
        address: profileForm.address.trim(),
      });

      setProfile(updatedProfile);

      setProfileForm({
        name: updatedProfile.name || "",
        mobile: updatedProfile.mobile || "",
        address: updatedProfile.address || "",
      });

      setIsEditingProfile(false);
      setProfileSuccess("Profile updated successfully.");
    } catch (err) {
      const errorData = err.response?.data;

      let message =
        errorData?.detail ||
        errorData?.message ||
        "Unable to update your profile.";

      if (errorData && typeof errorData === "object") {
        const fieldErrors = Object.entries(errorData)
          .map(([field, errors]) => {
            const details = Array.isArray(errors)
              ? errors.join(" ")
              : typeof errors === "string"
                ? errors
                : "";

            return details ? `${field}: ${details}` : "";
          })
          .filter(Boolean);

        if (fieldErrors.length > 0) {
          message = fieldErrors.join(" ");
        }
      }

      setProfileError(message);
    } finally {
      setProfileSaving(false);
    }
  };

  const { devices, jobs, estimates, payments } = data;

  const activeRepairs = jobs.filter(
    (job) =>
      !["COMPLETED", "CANCELLED"].includes(job.status)
  ).length;

  const completedRepairs = jobs.filter(
    (job) => job.status === "COMPLETED"
  ).length;

  const pendingEstimates = estimates.filter(
    (estimate) => estimate.approval_status === "PENDING"
  ).length;

  const paidPayments = payments.filter(
    (payment) => payment.payment_status === "PAID"
  );

  const totalPaid = paidPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const statusCards = [
    ["RECEIVED", "Received"],
    ["DIAGNOSIS", "Diagnosis"],
    ["WAITING_FOR_APPROVAL", "Waiting Approval"],
    ["REPAIR_IN_PROGRESS", "Repair In Progress"],
    ["QC", "Ready for QC"],
    ["COMPLETED", "Completed"],
  ];

  const recentJobs = [...jobs]
    .sort(
      (a, b) =>
        new Date(b.intake_date || b.created_at || 0) -
        new Date(a.intake_date || a.created_at || 0)
    )
    .slice(0, 5);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="mt-1">{error}</p>
        <p className="mt-2">
          Please check your connection and login session.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* My Profile button */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setShowProfile((previous) => !previous);
            setIsEditingProfile(false);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showProfile ? "Hide Profile" : "My Profile"}
        </button>
      </div>

      {/* My Profile section */}
      {showProfile && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                My Profile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and manage your personal details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowProfile(false);
                setIsEditingProfile(false);
                setProfileError("");
                setProfileSuccess("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          {profileLoading && (
            <p className="mt-5 text-sm text-slate-500">
              Loading your profile...
            </p>
          )}

          {profileError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              {profileSuccess}
            </div>
          )}

          {!profileLoading && profile && (
            <form onSubmit={handleProfileSave} className="mt-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={false}
                    required
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label
                    htmlFor="profile-mobile"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Mobile Number
                  </label>

                  <input
                    id="profile-mobile"
                    name="mobile"
                    type="tel"
                    value={profileForm.mobile}
                    onChange={handleProfileChange}
                    disabled={false}
                    required
                    maxLength={20}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="profile-address"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Address
                  </label>

                  <textarea
                    id="profile-address"
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                    disabled={false}
                    rows={3}
                    maxLength={255}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={() => {
                      
                      setProfileError("");
                      setProfileSuccess("");
                      setIsEditingProfile(true);
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      disabled={profileSaving}
                      onClick={() => {
                        setProfileForm({
                          name: profile.name || "",
                          mobile: profile.mobile || "",
                          address: profile.address || "",
                        });
                        setProfileError("");
                        setProfileSuccess("");
                        setIsEditingProfile(false);
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </section>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your devices and repair activities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="My Devices"
          value={devices.length}
          description="Registered devices"
        />

        <SummaryCard
          title="Active Repairs"
          value={activeRepairs}
          description="Currently under repair"
        />

        <SummaryCard
          title="Pending Estimates"
          value={pendingEstimates}
          description="Awaiting your approval"
        />

        <SummaryCard
          title="Completed Repairs"
          value={completedRepairs}
          description="Successfully completed"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">
              Repair Status
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Current status of your repairs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            {statusCards.map(([status, title]) => {
              const count = jobs.filter(
                (job) => job.status === status
              ).length;

              return (
                <div
                  key={status}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500">
                      {title}
                    </p>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[status]}`}
                    />
                  </div>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">
              Payment Summary
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Your payment information
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-slate-500">
              Total Paid
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {money(totalPaid)}
            </p>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500">
                Transactions
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {paidPayments.length}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            My Recent Repairs
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Your latest repair activities
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                {["Job Card", "Device", "Status", "Date"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {recentJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No repair records available.
                  </td>
                </tr>
              ) : (
                recentJobs.map((job) => {
                  const device = devices.find(
                    (item) => item.id === job.device
                  );

                  const deviceName = device
                    ? `${device.brand} ${device.model}`
                    : "Device";

                  const date = job.intake_date || job.created_at;

                  return (
                    <tr
                      key={job.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                        {job.job_card_number}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {deviceName}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {STATUS_LABELS[job.status] || job.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {date
                          ? new Date(date).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default CustomerDashboard;
