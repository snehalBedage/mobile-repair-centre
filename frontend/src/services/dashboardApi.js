
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

// Fetch all pages when the API uses pagination
const getAllResults = async (url) => {
  let allResults = [];
   let nextUrl = `${url}${url.includes("?") ? "&" : "?"}page_size=500`;

  while (nextUrl) {
    const response = await api.get(nextUrl);
    const data = response.data;

    allResults = [...allResults, ...getResults(data)];

    nextUrl =
      !Array.isArray(data) && data?.next
        ? data.next
        : null;
  }

  return allResults;
};

export const getDashboardSummary = async () => {
  const response = await api.get("reports/dashboard-summary/");
  return response.data;
};

// Customers list
export const getCustomers = async () => {
  return getAllResults("customers/");
};

// Devices list
export const getDevices = async () => {
  return getAllResults("customers/devices/");
};

// Job Cards list
export const getJobCards = async () => {
  return getAllResults("job-cards/");
};

// Estimates list
export const getEstimates = async () => {
  return getAllResults("estimates/");
};

// Spare Parts list
export const getSpareParts = async () => {
  return getAllResults("spare-parts/");
};

// Payments list
export const getPayments = async () => {
  return getAllResults("billing/payments/");
};

// Technicians list
export const getTechnicians = async () => {
  return getAllResults("technicians/");
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
