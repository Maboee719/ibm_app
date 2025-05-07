import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CustomerQueries.css';

const CustomerQueries = () => {
    const [queries, setQueries] = useState([]);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    // Fetch queries when the component mounts
    useEffect(() => {
        fetchQueries();
    }, []);

    // Fetch queries from the server
    const fetchQueries = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/queries', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setQueries(response.data);
        } catch (error) {
            console.error("Error fetching queries:", error);
            setMessage({
                text: 'Failed to load customer queries. Please try again later.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Select a query to respond to
    const handleSelectQuery = (query) => {
        setSelectedQuery(query);
        setResponse(query.auto_reply || '');
    };

    // Submit the response to the query
    const handleSubmitResponse = async () => {
        if (!selectedQuery || !response) {
            setMessage({ text: 'Please enter a response before submitting.', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/queries/${selectedQuery.id}`, {
                response
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setMessage({
                text: 'Response submitted successfully!',
                type: 'success'
            });

            // Update the state locally to reflect the change
            setQueries(prevQueries => prevQueries.map(query =>
                query.id === selectedQuery.id ? { ...query, auto_reply: response, status: 'complete' } : query
            ));

            // Clear selection after a short delay
            setTimeout(() => {
                setSelectedQuery(null);
                setResponse('');
            }, 1500);
        } catch (error) {
            console.error("Error submitting response:", error);
            setMessage({
                text: 'Failed to submit response. Please try again later.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle user logout
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="customer-queries-container">
            <div className="header-buttons">
                <button onClick={() => navigate('/sales')} className="nav-button">
                    Back to Sales
                </button>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            <h2 className="section-title">Customer Support Queries</h2>
            
            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="queries-layout">
                {/* Query List Section */}
                <div className="queries-list">
                    <h3>Customer Queries</h3>
                    {loading ? (
                        <p>Loading queries...</p>
                    ) : queries.length === 0 ? (
                        <p>No customer queries found.</p>
                    ) : (
                        <ul className="queries-list-items">
                            {queries.map(query => (
                                <li 
                                    key={query.id} 
                                    className={`query-item ${query.status} ${selectedQuery?.id === query.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectQuery(query)}
                                >
                                    <div className="query-header">
                                        <span className="customer-name">{query.customer_name}</span>
                                        <span className={`status-badge ${query.status}`}>
                                            {query.status}
                                        </span>
                                    </div>
                                    <div className="query-message">
                                        {query.message.length > 50 
                                            ? `${query.message.substring(0, 50)}...` 
                                            : query.message}
                                    </div>
                                    <div className="query-date">
                                        {new Date(query.created_at).toLocaleString()}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Response Panel Section */}
                <div className="response-panel">
                    {selectedQuery ? (
                        <>
                            <h3>Response to: {selectedQuery.customer_name}</h3>
                            <div className="original-query">
                                <h4>Original Query:</h4>
                                <p>{selectedQuery.message}</p>
                                <div className="query-meta">
                                    <span>From: {selectedQuery.customer_email}</span>
                                    <span>Date: {new Date(selectedQuery.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="response-form">
                                <h4>Your Response:</h4>
                                <textarea
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    rows="8"
                                    placeholder="Type your response here..."
                                    className="response-textarea"
                                />
                                <button 
                                    onClick={handleSubmitResponse}
                                    disabled={loading}
                                    className="submit-button"
                                >
                                    {loading ? 'Submitting...' : 'Send Response'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <p>Select a query from the list to respond</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerQueries;
