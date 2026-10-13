import api from "./api";


const getResults = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};


export const getDashboardSummary = async () => {
  const response = await api.get("reports/dashboard-summary/");
  return response.data;
};

// Customers list
export const getCustomers = async () => {
  const response = await api.get("customers/");
  return getResults(response.data);
};

// Devices list
export const getDevices = async () => {
  const response = await api.get("customers/devices/");
  return getResults(response.data);
};

// Job Cards list
export const getJobCards = async () => {
  const response = await api.get("job-cards/");
  return getResults(response.data);
};

// Estimates list
export const getEstimates = async () => {
  const response = await api.get("estimates/");
  return getResults(response.data);
};

// Spare Parts list
export const getSpareParts = async () => {
  const response = await api.get("spare-parts/");
  return getResults(response.data);
};

// Payments list
export const getPayments = async () => {
  const response = await api.get("billing/payments/");
  return getResults(response.data);
};

// Technicians list
export const getTechnicians = async () => {
  const response = await api.get("technicians/");
  return getResults(response.data);
};


/* Customer Profile */

// Get logged-in customer's profile
export const getMyProfile = async () => {
  const response = await api.get("customers/my-profile/");
  return response.data;
};

// Update logged-in customer's profile
export const updateMyProfile = async (profileData) => {
  const response = await api.patch(
    "customers/my-profile/",
    profileData
  );
  return response.data;
};
