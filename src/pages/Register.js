import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("sales");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post("http://localhost:5000/register", { 
                name, 
                email, 
                password, 
                role 
            });
            
            alert("Registration successful! Please login.");
            navigate("/login");
        } catch (error) {
            console.error("Registration Error:", error.response?.data || error.message);
            setError(error.response?.data?.message || "Registration failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Register</h2>
            <form onSubmit={handleRegister} className="auth-form">
                {error && (
                    <div className="auth-error">
                        {error}
                        <button onClick={() => setError(null)} className="dismiss-error">
                            ×
                        </button>
                    </div>
                )}
                
                <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                />
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
                    minLength="8"
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
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
            <div className="auth-links">
                <p>Already have an account? <Link to="/login">Login here</Link></p>
                <p><Link to="/">Back to Home</Link></p>
            </div>
        </div>
    );
};

export default Register;