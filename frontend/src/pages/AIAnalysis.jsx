// src/pages/AIAnalysis.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";

const priorityColor = {
  Critical: { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c" },
  High:     { bg: "#fff7ed", border: "#f97316", text: "#c2410c" },
  Medium:   { bg: "#fefce8", border: "#eab308", text: "#854d0e" },
  Low:      { bg: "#f0fdf4", border: "#22c55e", text: "#15803d" },
};

export default function AIAnalysis() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [ai,        setAi]        = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // Load existing complaint data
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/complaints/${id}`);
        setComplaint(data);
        // If already analyzed, populate ai panel
        if (data.aiPriority) {
          setAi({
            priority:     data.aiPriority,
            department:   data.aiDepartment,
            summary:      data.aiSummary,
            autoResponse: data.aiResponse,
          });
        }
      } catch {
        setError("Complaint not found");
      }
    })();
  }, [id]);

  const runAnalysis = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await API.post("/ai/analyze", { complaintId: id });
      setAi({
        priority:     data.priority,
        department:   data.department,
        summary:      data.summary,
        autoResponse: data.autoResponse,
      });
    } catch (err) {
      setError(err.response?.data?.error || "AI analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const colors = ai ? (priorityColor[ai.priority] || priorityColor["Low"]) : null;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <h2>🤖 AI Complaint Analysis</h2>
      {error && <p className="error-msg">{error}</p>}

      {complaint && (
        <div className="detail-block">
          <h3>{complaint.title}</h3>
          <p><strong>Category:</strong> {complaint.category} &nbsp;|&nbsp; <strong>Location:</strong> {complaint.location}</p>
          <p>{complaint.description}</p>
        </div>
      )}

      {!ai && (
        <button onClick={runAnalysis} disabled={loading} className="btn-ai-run">
          {loading ? "🔄 Analyzing with AI…" : "⚡ Run AI Analysis"}
        </button>
      )}

      {loading && <p className="loading">AI is analyzing your complaint…</p>}

      {ai && colors && (
        <div className="ai-result-panel" style={{ borderColor: colors.border, background: colors.bg }}>
          <h3 style={{ color: colors.text }}>AI Analysis Result</h3>

          <div className="ai-grid">
            <div className="ai-metric">
              <span className="ai-label">🚨 Priority</span>
              <span className="ai-value" style={{ color: colors.text }}>{ai.priority}</span>
            </div>
            <div className="ai-metric">
              <span className="ai-label">🏢 Department</span>
              <span className="ai-value">{ai.department}</span>
            </div>
          </div>

          <div className="ai-section">
            <h4>📝 Summary</h4>
            <p>{ai.summary}</p>
          </div>

          <div className="ai-section">
            <h4>📨 Auto-Response to Citizen</h4>
            <blockquote className="auto-response">{ai.autoResponse}</blockquote>
          </div>

          <button className="btn-secondary" onClick={() => setAi(null)}>Re-analyze</button>
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <Link to="/complaints" className="btn-small">← Back to Complaints</Link>
      </div>
    </div>
  );
}