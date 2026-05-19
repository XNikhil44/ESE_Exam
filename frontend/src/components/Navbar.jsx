// src/components/Navbar.jsx

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/complaints">🛠 ComplaintAI</Link>
      </div>
      <div className="nav-links">
        <Link to="/complaints">All Complaints</Link>
        <Link to="/register">Submit Complaint</Link>
        {token ? (
          <>
            <span className="nav-user">👤 {user?.name}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}