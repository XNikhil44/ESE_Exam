// src/pages/ComplaintList.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

const CATEGORIES = ["All", "Water Supply", "Electricity", "Garbage", "Roads", "Sanitation", "Other"];

const priorityColor = { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" };

export default function ComplaintList() {
  const [complaints, setComplaints] = useState([]);
  const [category,   setCategory]   = useState("All");
  const [location,   setLocation]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const fetchComplaints = async () => {
    setLoading(true); setError("");
    try {
      let url = "/complaints";
      const params = [];
      if (category !== "All") params.push(`category=${encodeURIComponent(category)}`);
      if (params.length) url += "?" + params.join("&");
      const { data } = await API.get(url);
      setComplaints(data.complaints);
    } catch (_err) {
      setError("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const searchByLocation = async () => {
    if (!location.trim()) return fetchComplaints();
    setLoading(true); setError("");
    try {
      const { data } = await API.get(`/complaints/search?location=${encodeURIComponent(location)}`);
      setComplaints(data.complaints);
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [category]);

  const statusBadge = (s) => {
    const map = { Pending: "#6b7280", "In Progress": "#3b82f6", Resolved: "#22c55e", Rejected: "#ef4444" };
    return <span className="badge" style={{ background: map[s] || "#6b7280" }}>{s}</span>;
  };

  return (
    <div className="page-container">
      <h2>📋 All Complaints</h2>

      {/* Filters */}
      <div className="filter-bar">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input
          placeholder="Search by location…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchByLocation()}
        />
        <button onClick={searchByLocation}>Search</button>
        <button className="btn-secondary" onClick={() => { setLocation(""); setCategory("All"); }}>
          Clear
        </button>
      </div>

      {loading && <p className="loading">Loading…</p>}
      {error   && <p className="error-msg">{error}</p>}

      {!loading && complaints.length === 0 && <p>No complaints found.</p>}

      <div className="complaint-grid">
        {complaints.map((c) => (
          <div key={c._id} className="complaint-card">
            <div className="card-header">
              <h3>{c.title}</h3>
              {statusBadge(c.status)}
            </div>
            <p className="card-meta">📍 {c.location} &nbsp;|&nbsp; 🏷 {c.category}</p>
            <p className="card-meta">👤 {c.name} &nbsp;|&nbsp; {new Date(c.createdAt).toLocaleDateString()}</p>
            {c.aiPriority && (
              <span className="badge" style={{ background: priorityColor[c.aiPriority] || "#6b7280" }}>
                🤖 {c.aiPriority} Priority
              </span>
            )}
            <p className="card-desc">{c.description.slice(0, 100)}{c.description.length > 100 ? "…" : ""}</p>
            <div className="card-actions">
              <Link to={`/status/${c._id}`} className="btn-small">Update Status</Link>
              <Link to={`/ai/${c._id}`}     className="btn-small btn-ai">AI Analysis</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}