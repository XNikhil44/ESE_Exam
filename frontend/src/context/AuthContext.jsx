// src/context/AuthContext.jsx

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user,  setUser]  = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const login = (tok, userData) => {
    localStorage.setItem("token", tok);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}