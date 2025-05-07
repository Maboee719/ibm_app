import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        window.location.href = "/login";
    };

    return (
        <div></div>
    );
};

export default Navbar;