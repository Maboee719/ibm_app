import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import "./FinancialDashboard.css";

const FinancialDashboard = () => {
    const [financialData, setFinancialData] = useState({
        statements: [],
        graphData: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const role = localStorage.getItem('userRole');
            const token = localStorage.getItem('token');
            
            if (!role || !token) {
                setError("Authentication required. Please login again.");
                setTimeout(() => navigate('/login'), 2000);
                return;
            }
            
            setUserRole(role);
            await fetchFinancialData(role, token);
        };

        checkAuthAndFetch();
    }, [navigate]);

    const fetchFinancialData = async (role, token) => {
        setLoading(true);
        setError(null);
        try {
            const [statementsRes, graphRes] = await Promise.all([
                api.get("/income-statements", {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                api.get("/financial-graph-data", {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            
            // Transform data for better visualization
            const transformedGraphData = graphRes.data.map(item => ({
                ...item,
                monthShort: item.month.slice(0, 3),
                netProfit: item.total_income - item.total_expenses
            }));

            setFinancialData({
                statements: statementsRes.data,
                graphData: transformedGraphData
            });
        } catch (err) {
            console.error("Error fetching financial data:", {
                message: err.message,
                response: err.response?.data
            });
            setError(err.response?.data?.error || "Failed to load financial data");
            
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                setTimeout(() => navigate('/login'), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    const renderFinancialChart = () => {
        if (!financialData.graphData || financialData.graphData.length === 0) {
            return <div className="no-data-message">No chart data available</div>;
        }

        // Calculate max value for scaling
        const maxValue = Math.max(
            ...financialData.graphData.map(d => Math.max(d.total_income, d.total_expenses))
        ) * 1.2;

        return (
            <div className="financial-chart">
                <h3>12-Month Financial Overview</h3>
                <div className="chart-container">
                    {financialData.graphData.map((data, index) => (
                        <div key={index} className="chart-column-group">
                            <div className="period-label">
                                {data.monthShort} '{data.year.toString().slice(-2)}
                            </div>
                            <div className="bars-container">
                                <div 
                                    className="bar income-bar"
                                    style={{ height: `${(data.total_income / maxValue) * 100}%` }}
                                    title={`Income: $${data.total_income.toLocaleString()}`}
                                ></div>
                                <div 
                                    className="bar expense-bar"
                                    style={{ height: `${(data.total_expenses / maxValue) * 100}%` }}
                                    title={`Expenses: $${data.total_expenses.toLocaleString()}`}
                                ></div>
                            </div>
                            <div className={`net-profit ${data.netProfit >= 0 ? 'positive' : 'negative'}`}>
                                ${Math.abs(data.netProfit).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="chart-legend">
                    <div className="legend-item">
                        <div className="legend-color income"></div>
                        <span>Income</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color expense"></div>
                        <span>Expenses</span>
                    </div>
                </div>
            </div>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const handleRefresh = () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (token && role) {
            fetchFinancialData(role, token);
        } else {
            setError("Session expired. Please login again.");
            setTimeout(() => navigate('/login'), 2000);
        }
    };

    return (
        <div className="financial-dashboard-container">
            <div className="dashboard-header">
                <h2>Financial Dashboard</h2>
                <div className="header-controls">
                    <span className="user-role">Role: {userRole}</span>
                    <button 
                        onClick={handleRefresh}
                        className="refresh-btn"
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-alert">
                    {error}
                    <button onClick={() => setError(null)} className="dismiss-btn">
                        &times;
                    </button>
                </div>
            )}

            {loading ? (
                <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Loading financial data...</p>
                </div>
            ) : (
                <>
                    <div className="visualization-section">
                        {renderFinancialChart()}
                    </div>

                    <div className="statements-section">
                        <h3>Detailed Income Statements</h3>
                        {financialData.statements.length > 0 ? (
                            <div className="table-responsive">
                                <table className="statements-table">
                                    <thead>
                                        <tr>
                                            <th>Period</th>
                                            <th>Income</th>
                                            <th>Expenses</th>
                                            <th>Net Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financialData.statements.map((statement) => {
                                            const netProfit = statement.total_income - statement.total_expenses;
                                            return (
                                                <tr key={`${statement.month}-${statement.year}`}>
                                                    <td>{statement.month} {statement.year}</td>
                                                    <td>{formatCurrency(statement.total_income)}</td>
                                                    <td>{formatCurrency(statement.total_expenses)}</td>
                                                    <td className={netProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
                                                        {formatCurrency(netProfit)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-data-message">
                                No income statements found
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default FinancialDashboard;