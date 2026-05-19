// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar          from "./components/Navbar";
import Login           from "./pages/Login";
import Signup          from "./pages/Signup";
import RegisterComplaint from "./pages/RegisterComplaint";
import ComplaintList   from "./pages/ComplaintList";
import ComplaintStatus from "./pages/ComplaintStatus";
import AIAnalysis      from "./pages/AIAnalysis";
import { useAuth }     from "./context/AuthContext";

// Guard: redirect to /login if not authenticated
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/"          element={<Navigate to="/complaints" replace />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/signup"    element={<Signup />} />
          <Route path="/complaints"element={<ComplaintList />} />
          <Route path="/register"  element={<RegisterComplaint />} />
          <Route path="/status/:id"element={<PrivateRoute><ComplaintStatus /></PrivateRoute>} />
          <Route path="/ai/:id"    element={<AIAnalysis />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}