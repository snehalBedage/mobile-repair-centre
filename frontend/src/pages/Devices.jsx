
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const devicesPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    customer: "",
    brand: "",
    model: "",
    imei: "",
    device_condition: "GOOD",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");

    try {
        let allDevices = [];
        let deviceUrl = "customers/devices/";

while (deviceUrl) {
  const deviceResponse = await api.get(deviceUrl);
  const deviceData = deviceResponse.data;

  if (Array.isArray(deviceData)) {
    allDevices = deviceData;
    deviceUrl = null;
  } else {
    allDevices = [
      ...allDevices,
      ...(deviceData.results || []),
    ];

    deviceUrl = deviceData.next || null;
  }
}
let allCustomers = [];
let customerUrl = "customers/";

while (customerUrl) {
  const customerResponse = await api.get(customerUrl);
  const customerData = customerResponse.data;

  if (Array.isArray(customerData)) {
    allCustomers = customerData;
    customerUrl = null;
  } else {
    allCustomers = [
      ...allCustomers,
      ...(customerData.results || []),
    ];

    customerUrl = customerData.next || null;
  }
}     setDevices(allDevices);

      setCustomers(allCustomers);
  } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load devices. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  function getCustomerName(device) {
    if (device.customer_name) {
      return device.customer_name;
    }

    if (
      typeof device.customer === "object" &&
      device.customer !== null
    ) {
      return device.customer.name || "Unknown Customer";
    }

    const customer = customers.find(
      (item) => String(item.id) === String(device.customer)
    );

    return customer?.name || "Unknown Customer";
  }

  function openAddModal() {
    setEditingDevice(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(device) {
    setEditingDevice(device);

    setForm({
      customer:
        typeof device.customer === "object"
          ? String(device.customer.id || "")
          : String(device.customer || ""),
      brand: device.brand || "",
      model: device.model || "",
      imei: device.imei || "",
      device_condition: device.device_condition || "GOOD",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingDevice(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "imei"
          ? value.replace(/\D/g, "").slice(0, 15)
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.customer) {
      setError("Please select a customer.");
      return;
    }

    if (
      !form.brand.trim() ||
      !form.model.trim()
    ) {
      setError("Please enter the device brand and model.");
      return;
    }

    if (form.imei.length !== 15) {
      setError("IMEI must contain exactly 15 digits.");
      return;
    }

    const payload = {
      customer: Number(form.customer),
      brand: form.brand.trim(),
      model: form.model.trim(),
      imei: form.imei.trim(),
      device_condition: form.device_condition,
    };

    setSaving(true);

    try {
      if (editingDevice) {
        await api.patch(
          `customers/devices/${editingDevice.id}/`,
          payload
        );

        setSuccess("Device updated successfully.");
      } else {
        await api.post("customers/devices/", payload);
        setSuccess("Device added successfully.");
      }

      setShowModal(false);
      setEditingDevice(null);
      setForm(emptyForm);

      await fetchData();
    } catch (err) {
      const responseData = err.response?.data;

      if (responseData && typeof responseData === "object") {
        const firstError = Object.values(responseData).flat()[0];

        setError(
          typeof firstError === "string"
            ? firstError
            : "Unable to save device. Please check the entered details."
        );
      } else {
        setError("Unable to save device. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const filteredDevices = devices.filter((device) => {
    const customerName = getCustomerName(device);

    const searchableText = [
      device.id,
      device.brand,
      device.model,
      device.imei,
      device.device_condition,
      customerName,
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.trim().toLowerCase());
  });
  const totalPages = Math.ceil(
  filteredDevices.length / devicesPerPage
);

const startIndex = (currentPage - 1) * devicesPerPage;

const paginatedDevices = filteredDevices.slice(
  startIndex,
  startIndex + devicesPerPage
);

  function formatCondition(condition) {
    if (!condition) return "—";

    return condition
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function conditionStyle(condition) {
    const value = (condition || "").toUpperCase();

    if (value === "GOOD") {
      return "bg-green-50 text-green-700";
    }

    if (value === "DAMAGED" || value === "NOT_WORKING") {
      return "bg-red-50 text-red-700";
    }

    return "bg-amber-50 text-amber-700";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Devices
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer devices and their details.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <span className="text-lg leading-none">+</span>
          Add Device
        </button>
      </div>

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {error && !showModal && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Search Devices
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Search by ID, brand, model, IMEI, condition or customer name.
          </p>
        </div>

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>

          <input
            type="text"
            value={search}
            onChange={(event) => {
                setSearch(event.target.value);
                 setCurrentPage(1);
                  }}
            placeholder="Search by ID, brand, model, IMEI..."
            aria-label="Search devices"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-11 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
                }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {filteredDevices.length} device
          {filteredDevices.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            Loading devices...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                      IMEI
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDevices.length > 0 ? (
                    paginatedDevices.map((device) => (
                      <tr
                        key={device.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                          {device.id}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {device.brand} {device.model}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            {getCustomerName(device)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="font-mono text-sm text-slate-600">
                            {device.imei || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${conditionStyle(
                              device.device_condition
                            )}`}
                          >
                            {formatCondition(device.device_condition)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEditModal(device)}
                            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center"
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          No devices found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try another search or add a new device.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
  <p className="text-xs text-slate-500">
    Showing{" "}
    {filteredDevices.length === 0 ? 0 : startIndex + 1}
    {" - "}
    {Math.min(startIndex + devicesPerPage, filteredDevices.length)}
    {" of "}
    {filteredDevices.length} devices
  </p>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() =>
        setCurrentPage((page) => Math.max(1, page - 1))
      }
      disabled={currentPage === 1}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Previous
    </button>

    <span className="text-sm text-slate-600">
      Page {currentPage} of {Math.max(totalPages, 1)}
    </span>

    <button
      type="button"
      onClick={() =>
        setCurrentPage((page) =>
          Math.min(Math.max(totalPages, 1), page + 1)
        )
      }
      disabled={currentPage >= totalPages || totalPages === 0}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Next
    </button>
  </div>
</div>
          </>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="device-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="device-modal-title"
                  className="text-lg font-bold text-slate-800"
                >
                  {editingDevice ? "Edit Device" : "Add Device"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the device information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
                className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="customer"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Customer <span className="text-red-500">*</span>
                </label>

                <select
                  id="customer"
                  name="customer"
                  value={form.customer}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select customer</option>

                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.customer_code
                        ? ` (${customer.customer_code})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="brand"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Brand <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="e.g. Samsung"
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="model"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Model <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="model"
                    name="model"
                    type="text"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="e.g. Galaxy S24"
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="imei"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  IMEI Number <span className="text-red-500">*</span>
                </label>

                <input
                  id="imei"
                  name="imei"
                  type="text"
                  inputMode="numeric"
                  value={form.imei}
                  onChange={handleChange}
                  placeholder="Enter 15-digit IMEI"
                  minLength={15}
                  maxLength={15}
                  pattern="[0-9]{15}"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Enter exactly 15 digits.
                </p>
              </div>

              <div>
                <label
                  htmlFor="device_condition"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Device Condition <span className="text-red-500">*</span>
                </label>

                <select
                  id="device_condition"
                  name="device_condition"
                  value={form.device_condition}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="GOOD">Good</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="SCRATCHED">Scratched</option>
                  <option value="NOT_WORKING">Not Working</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingDevice
                    ? "Update Device"
                    : "Save Device"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

