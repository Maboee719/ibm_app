import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to IWB</h1>
        <h2>Electronic Recycling Solutions</h2>
        
        <p>
          IWB provides innovative solutions for electronic waste recycling, 
          helping businesses and individuals responsibly dispose of their 
          electronic equipment while recovering valuable materials.
        </p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">♻️</div>
            <h4>Waste Tracking</h4>
            <p>Monitor your electronic waste recycling process</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>Comprehensive Reports</h4>
            <p>Generate detailed analytics on recycling efforts</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h4>Inventory Management</h4>
            <p>Track all recyclable items in your organization</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h4>Financial Insights</h4>
            <p>View statements and understand recycling economics</p>
          </div>
        </div>
        
        <div className="auth-buttons">
          <Link to="/login" className="auth-button login-button">
            Login
          </Link>
          <Link to="/register" className="auth-button register-button">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;