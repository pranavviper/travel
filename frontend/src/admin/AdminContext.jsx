import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('adminUser')); } catch { return null; }
  });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken'));

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:5001/api/admin/auth/login', { email, password });
    localStorage.setItem('adminToken', res.data.token);
    localStorage.setItem('adminUser', JSON.stringify(res.data.user));
    setAdminToken(res.data.token);
    setAdminUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminToken(null);
    setAdminUser(null);
  };

  const api = axios.create({ baseURL: 'http://localhost:5001/api/admin' });
  api.interceptors.request.use(cfg => {
    if (adminToken) cfg.headers.Authorization = `Bearer ${adminToken}`;
    return cfg;
  });

  return (
    <AdminContext.Provider value={{ adminUser, adminToken, login, logout, api }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
