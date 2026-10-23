
import axios from "axios";


const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
});


// Add JWT token to protected requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Login
export const loginUser = async (email, password) => {
  try {
    const response = await api.post("auth/login/", {
      email: email.trim(),
      password,
    });

    return response.data;
  } catch (error) {
    const data = error.response?.data;

    throw new Error(
      data?.detail ||
      data?.non_field_errors?.[0] ||
      "Login failed. Please check your email and password."
    );
  }
};

// Forgot Password
export const forgotPassword = async (email) => {
  try {
    const response = await api.post("auth/forgot-password/", {
      email: email.trim(),
    });

    return response.data;
  } catch (error) {
    const data = error.response?.data;

    throw new Error(
      data?.email?.[0] ||
      data?.detail ||
      "Unable to process password reset request."
    );
  }
};

// Reset Password
export const resetPassword = async (
  uid,
  token,
  newPassword,
  confirmPassword
) => {
  try {
    const response = await api.post("auth/reset-password/", {
      uid,
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });

    return response.data;
  } catch (error) {
    const data = error.response?.data;

    throw new Error(
      data?.new_password?.[0] ||
      data?.confirm_password?.[0] ||
      data?.token?.[0] ||
      data?.detail ||
      "Unable to reset password."
    );
  }
};


 // Dashboard Summary
export const getDashboardSummary = async () => {
  try {
    const response = await api.get("reports/dashboard-summary/");
    return response.data;
  } catch (error) {
    const data = error.response?.data;

    throw new Error(
      data?.detail ||
      "Unable to load dashboard data. Please try again."
    );
  }
};

export default api;
