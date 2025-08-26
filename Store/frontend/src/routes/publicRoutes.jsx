import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import SelectGroup from "../pages/SelectGroup";
import ForgotPassword from "../pages/forgotPassword";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

const PublicRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/select-group" element={<SelectGroup />} />
    <Route path="/logout" element={<Logout />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
  </Routes>
);

export default PublicRoutes;
