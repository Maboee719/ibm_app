import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Product from "./pages/Product";
import Sales from "./pages/Sales";
import IncomeStatement from "./pages/IncomeStatement";
import FinancialDashboard from "./pages/FinancialDashboard";


const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const InvestorDashboard = lazy(() => import("./pages/InvestorDashboard"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const DeveloperConsole = lazy(() => import("./pages/DeveloperConsole.js"));
const CustomerQueries = lazy(() => import("./pages/CustomerQueries"));

function App() {
    return (
        <Router>
            <Navbar />
            <Suspense fallback={<div className="loading-screen">Loading...</div>}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Client Portal */}
                    <Route 
                        path="/client-portal" 
                        element={
                            <PrivateRoute allowedRoles={["client"]}>
                                <ClientPortal />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Investor Dashboard */}
                    <Route 
                        path="/investor-dashboard" 
                        element={
                            <PrivateRoute allowedRoles={["investor"]}>
                                <InvestorDashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route 
    path="/customer-queries" 
    element={
        <PrivateRoute allowedRoles={["sales"]}>
            <CustomerQueries />
        </PrivateRoute>
    } 
/>
                    
                    {/* IWB Partner Dashboard */}
                    <Route 
                        path="/partner-dashboard" 
                        element={
                            <PrivateRoute allowedRoles={["iwb_partner"]}>
                                <PartnerDashboard />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Developer Console */}
                    <Route 
                        path="/developer-console" 
                        element={
                            <PrivateRoute allowedRoles={["developer"]}>
                                <DeveloperConsole />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Sales Dashboard */}
                    <Route 
                        path="/sales" 
                        element={
                            <PrivateRoute allowedRoles={["sales"]} maxUsers={3}>
                                <Sales />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Financial Dashboard */}
                    <Route 
                        path="/income-statement" 
                        element={
                            <PrivateRoute allowedRoles={["finance"]} maxUsers={3}>
                                <FinancialDashboard />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Products Management */}
                    <Route 
                        path="/products" 
                        element={
                            <PrivateRoute allowedRoles={["sales", "developer", "iwb_partner"]}>
                                <Product />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* General Dashboard */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute allowedRoles={["sales", "developer", "iwb_partner"]}>
                                <Dashboard />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Fallback Route */}
                    <Route path="*" element={<Home />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;