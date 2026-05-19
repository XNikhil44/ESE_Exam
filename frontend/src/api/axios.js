// src/api/axios.js

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://ese-exam-z3t8.onrender.com/api",
});

// Attach JWT token automatically to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;