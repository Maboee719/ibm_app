import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ClientPortal.css';

const ClientPortal = () => {
    const [formData, setFormData] = useState({
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [queries, setQueries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [userInfo, setUserInfo] = useState({
        name: '',
        email: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const email = localStorage.getItem('userEmail');
                const name = localStorage.getItem('userName');
                
                if (email && name) {
                    setUserInfo({
                        name: name,
                        email: email
                    });
                    fetchQueries();
                } else {
                    const response = await axios.get('http://localhost:5000/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    const userData = response.data;
                    setUserInfo({
                        name: userData.name,
                        email: userData.email
                    });
                    localStorage.setItem('userEmail', userData.email);
                    localStorage.setItem('userName', userData.name);
                    fetchQueries();
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                // If we can't get user info, redirect to login
                localStorage.clear();
                navigate('/login');
            }
        };

        fetchUserData();
    }, [navigate]);

    const fetchQueries = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/queries', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setQueries(response.data);
        } catch (error) {
            console.error("Error fetching queries:", error);
            setMessage({ 
                text: 'Failed to load your query history', 
                type: 'error' 
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/queries', {
                message: formData.message
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setMessage({ 
                text: response.data.message || 'Query submitted successfully!', 
                type: 'success' 
            });
            
            // Update local queries list
            setQueries(prev => [{
                id: response.data.queryId,
                customer_name: userInfo.name,
                customer_email: userInfo.email,
                message: formData.message,
                status: 'pending',
                auto_reply: response.data.autoResponse || null,
                created_at: new Date().toISOString()
            }, ...prev]);

            // Reset form
            setFormData({
                message: ''
            });

        } catch (error) {
            let errorText = 'Failed to submit query. Please try again.';
            if (error.response?.data?.message) {
                errorText = error.response.data.message;
            }
            setMessage({ text: errorText, type: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 5000);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Filter and search queries
    const filteredQueries = queries
        .filter(query => 
            query.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (query.auto_reply && query.auto_reply.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .filter(query => 
            filterStatus === 'all' || query.status === filterStatus
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div className="client-portal">
            <header className="portal-header">
                <h1>Customer Support Portal</h1>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </header>

            <div className="portal-container">
                {/* Query Submission Section */}
                <section className="query-section">
                    <h2>Submit New Query</h2>
                    {message.text && (
                        <div className={`alert alert-${message.type}`}>
                            {message.text}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="query-form">
                        <div className="form-group">
                            <label>Your Name</label>
                            <input
                                type="text"
                                value={userInfo.name}
                                readOnly
                                className="read-only-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={userInfo.email}
                                readOnly
                                className="read-only-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Your Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                minLength="10"
                                rows="5"
                                placeholder="Describe your issue or question in detail..."
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="submit-btn"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Submitting...
                                </>
                            ) : 'Submit Query'}
                        </button>
                    </form>
                </section>

                {/* Query History Section */}
                <section className="history-section">
                    <div className="history-header">
                        <h2>Your Query History</h2>
                        <div className="history-controls">
                            <input
                                type="text"
                                placeholder="Search queries..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="status-filter"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="complete">Completed</option>
                            </select>
                        </div>
                    </div>

                    {filteredQueries.length > 0 ? (
                        <div className="queries-list">
                            {filteredQueries.map((query) => (
                                <div key={query.id} className={`query-card ${query.status}`}>
                                    <div className="query-header">
                                        <span className="query-date">
                                            {new Date(query.created_at).toLocaleString()}
                                        </span>
                                        <span className={`status-badge ${query.status}`}>
                                            {query.status}
                                        </span>
                                    </div>
                                    <div className="query-content">
                                        <h3>Your Query:</h3>
                                        <p>{query.message}</p>
                                    </div>
                                    {query.auto_reply && (
                                        <div className="query-response">
                                            <h3>Our Response:</h3>
                                            <p>{query.auto_reply}</p>
                                        </div>
                                    )}
                                    {query.status === 'pending' && (
                                        <div className="query-footer">
                                            <span className="pending-notice">
                                                ⏳ Your query is being processed
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-queries">
                            {queries.length === 0 ? (
                                <p>You haven't submitted any queries yet.</p>
                            ) : (
                                <p>No queries match your search criteria.</p>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ClientPortal;