// src/pages/ComplaintStatus.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];

export default function ComplaintStatus() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [status,    setStatus]    = useState("Pending");
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState("");
  const [error,     setError]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/complaints/${id}`);
        setComplaint(data);
        setStatus(data.status);
      } catch {
        setError("Complaint not found");
      }
    })();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(""); setError("");
    try {
      const { data } = await API.put(`/complaints/${id}`, { status });
      setMsg(`✅ Status updated to "${data.complaint.status}"`);
      setComplaint(data.complaint);
    } catch (err) {
      setError(err.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this complaint?")) return;
    try {
      await API.delete(`/complaints/${id}`);
      navigate("/complaints");
    } catch {
      setError("Delete failed");
    }
  };

  if (!complaint && !error) return <p className="loading">Loading…</p>;

  return (
    <div className="form-container">
      <h2>🔄 Update Complaint Status</h2>
      {error && <p className="error-msg">{error}</p>}
      {msg   && <p className="success-msg">{msg}</p>}

      {complaint && (
        <>
          <div className="detail-block">
            <h3>{complaint.title}</h3>
            <p><strong>Category:</strong> {complaint.category}</p>
            <p><strong>Location:</strong> {complaint.location}</p>
            <p><strong>Submitted by:</strong> {complaint.name} ({complaint.email})</p>
            <p><strong>Description:</strong> {complaint.description}</p>
            <p><strong>Current Status:</strong> {complaint.status}</p>
          </div>

          <form onSubmit={handleUpdate}>
            <label>New Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button type="submit" disabled={loading}>
              {loading ? "Updating…" : "Update Status"}
            </button>
          </form>

          <button className="btn-danger" onClick={handleDelete} style={{ marginTop: "1rem" }}>
            🗑 Delete Complaint
          </button>
        </>
      )}
    </div>
  );
}