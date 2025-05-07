import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    
    if (!token) {
        return <Navigate to="/login" />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" />;
    }
    
    return children;
};

export default PrivateRoute;