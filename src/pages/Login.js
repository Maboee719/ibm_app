import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("sales");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const res = await axios.post("http://localhost:5000/login", { 
                email, 
                password, 
                role 
            });
            
            // Store authentication data
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("userRole", res.data.user.role);
            
            // Redirect based on user role
            const redirectPath = getRedirectPath(res.data.user.role);
            navigate(redirectPath);
            
        } catch (error) {
            console.error("Login Error:", error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || "Login failed!";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getRedirectPath = (userRole) => {
        switch(userRole.toLowerCase()) {
            case "finance":
                return "/income-statement";
            case "investor":
                return "/investor-dashboard";
            case "sales":
                return "/sales";
            case "developer":
                return "/developer-console";
            case "iwb_partner":
                return "/partner-dashboard";
            case "client":
                return "/client-portal";
            default:
                return "/";
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin} className="auth-form">
                {error && (
                    <div className="auth-error">
                        {error}
                        <button 
                            type="button" 
                            onClick={() => setError(null)}
                            className="dismiss-error"
                        >
                            ×
                        </button>
                    </div>
                )}
                
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="role-select"
                >
                    <option value="sales">Sales Personnel</option>
                    <option value="finance">Finance Personnel</option>
                    <option value="developer">Developer</option>
                    <option value="investor">Investor</option>
                    <option value="iwb_partner">IWB Partner</option>
                    <option value="client">Client</option>
                </select>
                <button 
                    type="submit" 
                    disabled={loading}
                    className={loading ? "loading" : ""}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
            <div className="auth-links">
                <p>Don't have an account? <Link to="/register">Register here</Link></p>
                <p><Link to="/">Back to Home</Link></p>
            </div>
        </div>
    );
};

export default Login;