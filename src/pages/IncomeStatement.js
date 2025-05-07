import React, { useState, useEffect } from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import "./IncomeStatement.css";

const IncomeStatement = () => {
    const [incomeStatements, setIncomeStatements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check authentication and fetch data when component mounts
        const checkAuthAndFetch = async () => {
            const role = localStorage.getItem('userRole');
            const token = localStorage.getItem('token');
            
            if (!role || !token) {
                setError("Authentication required. Please login again.");
                setTimeout(() => navigate('/login'), 2000);
                return;
            }
            
            setUserRole(role);
            await fetchIncomeData(role, token);
        };

        checkAuthAndFetch();
    }, [navigate]);

    const fetchIncomeData = async (role, token) => {
        setLoading(true);
        setError(null);
        try {
            // Validate user role
            const allowedRoles = ['finance', 'investor'];
            if (!allowedRoles.includes(role.toLowerCase())) {
                throw new Error(`Access denied. User with role '${role}' cannot access this data.`);
            }

            // Make API request with authorization token
            const response = await api.get("/income-statements", {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Format and sort the data by year and month
            const formattedData = response.data.map(statement => ({
                ...statement,
                monthIndex: new Date(`${statement.month} 1, 2000`).getMonth()
            })).sort((a, b) => {
                return b.year - a.year || b.monthIndex - a.monthIndex;
            });
            
            setIncomeStatements(formattedData);
        } catch (err) {
            console.error("Error fetching income statements:", err);
            const errorMessage = err.response?.data?.message || 
                               err.response?.data?.error || 
                               err.message || 
                               "Failed to load income statements";
            setError(errorMessage);
            
            // Handle unauthorized/forbidden errors
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                setTimeout(() => navigate('/login'), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (token && role) {
            fetchIncomeData(role, token);
        } else {
            setError("Session expired. Please login again.");
            setTimeout(() => navigate('/login'), 2000);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this income statement?")) return;
        
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/income-statements/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Refresh the data after successful deletion
            handleRefresh();
        } catch (err) {
            console.error("Error deleting income statement:", err);
            setError(err.response?.data?.message || "Failed to delete income statement");
        }
    };

    const handleEdit = (statement) => {
        // You can implement edit functionality here
        // For now, we'll just show an alert
        alert(`Edit functionality for ${statement.month} ${statement.year} would go here`);
    };

    return (
        <div className="income-statement-container">
            <div className="header-section">
                <h2>Income Statements</h2>
                <div className="user-info">
                    <span>Logged in as: {userRole}</span>
                    <button onClick={handleRefresh} className="refresh-button">
                        Refresh Data
                    </button>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)} className="dismiss-button">
                        Dismiss
                    </button>
                </div>
            )}

            {loading ? (
                <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Loading income statements...</p>
                </div>
            ) : (
                <div className="statements-table-container">
                    <table className="statements-table">
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Year</th>
                                <th>Total Income</th>
                                <th>Total Expenses</th>
                                <th>Net Profit</th>
                                {userRole?.toLowerCase() === "finance" && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {incomeStatements.length > 0 ? (
                                incomeStatements.map((statement) => (
                                    <tr key={statement.id}>
                                        <td>{statement.month}</td>
                                        <td>{statement.year}</td>
                                        <td>${parseFloat(statement.total_income || 0).toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</td>
                                        <td>${parseFloat(statement.total_expenses || 0).toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</td>
                                        <td className={
                                            (statement.total_income - statement.total_expenses) >= 0 
                                                ? "profit-positive" 
                                                : "profit-negative"
                                        }>
                                            ${((statement.total_income || 0) - (statement.total_expenses || 0)).toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </td>
                                        {userRole?.toLowerCase() === "finance" && (
                                            <td className="actions-cell">
                                                <button 
                                                    onClick={() => handleEdit(statement)}
                                                    className="edit-button"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(statement.id)}
                                                    className="delete-button"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={userRole?.toLowerCase() === "finance" ? 6 : 5} className="no-data">
                                        {!error && "No income statements found"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default IncomeStatement;