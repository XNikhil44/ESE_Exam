// src/pages/RegisterComplaint.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const CATEGORIES = ["Water Supply", "Electricity", "Garbage", "Roads", "Sanitation", "Other"];

export default function RegisterComplaint() {
  const [form, setForm] = useState({
    name: "", email: "", title: "", description: "",
    category: "Water Supply", location: "",
  });
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const { data } = await API.post("/complaints", form);
      setSuccess("✅ Complaint submitted successfully!");
      // Navigate to AI analysis after 1 second
      setTimeout(() => navigate(`/ai/${data.complaint._id}`), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>📝 Register a Complaint</h2>
      {success && <p className="success-msg">{success}</p>}
      {error   && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input name="name" placeholder="Rahul Kumar" value={form.name} onChange={handleChange} required />

        <label>Email</label>
        <input name="email" type="email" placeholder="rahul@gmail.com" value={form.email} onChange={handleChange} required />

        <label>Complaint Title</label>
        <input name="title" placeholder="Water Leakage Issue" value={form.title} onChange={handleChange} required />

        <label>Category</label>
        <select name="category" value={form.category} onChange={handleChange}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <label>Location</label>
        <input name="location" placeholder="Ghaziabad" value={form.location} onChange={handleChange} required />

        <label>Description</label>
        <textarea
          name="description" rows={4}
          placeholder="Describe your complaint in detail…"
          value={form.description} onChange={handleChange} required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}