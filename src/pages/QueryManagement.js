// src/components/QueryManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './QueryManagement.css';

const QueryManagement = () => {
    const [queries, setQueries] = useState([]);
    const [filter, setFilter] = useState('all');
    const [responseText, setResponseText] = useState('');
    const [currentQuery, setCurrentQuery] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchQueries();
    }, [filter]);

    const fetchQueries = async () => {
        setLoading(true);
        try {
            const url = filter === 'all'
                ? 'http://localhost:5000/queries'
                : `http://localhost:5000/queries?status=${filter}`;
            const response = await axios.get(url);
            setQueries(response.data);
        } catch (error) {
            console.error("Error fetching queries:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResponseSubmit = async (e) => {
        e.preventDefault();
        if (!currentQuery || !responseText) return;

        setLoading(true);
        try {
            await axios.put(`http://localhost:5000/queries/${currentQuery.id}`, {
                response: responseText,
                status: 'completed'
            });
            setResponseText('');
            setCurrentQuery(null);
            fetchQueries();
        } catch (error) {
            console.error("Error responding to query:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="query-management">
            <button onClick={handleLogout} className="logout-button">Logout</button>
            <h2>Customer Query Management</h2>

            <div className="filter-controls">
                <label>Filter by status:</label>
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All Queries</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {loading ? (
                <p>Loading queries...</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Email</th>
                            <th>Query</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queries.map((query) => (
                            <tr key={query.id}>
                                <td>{new Date(query.createdAt).toLocaleString()}</td>
                                <td>{query.clientName}</td>
                                <td>{query.clientEmail}</td>
                                <td>{query.query}</td>
                                <td className={`status ${query.status}`}>{query.status}</td>
                                <td>
                                    <button
                                        onClick={() => setCurrentQuery(query)}
                                        disabled={query.status === 'completed'}
                                    >
                                        {query.status === 'completed' ? 'Responded' : 'Respond'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {currentQuery && (
                <div className="response-modal">
                    <div className="modal-content">
                        <h3>Respond to Query</h3>
                        <p><strong>Client:</strong> {currentQuery.clientName}</p>
                        <p><strong>Query:</strong> {currentQuery.query}</p>

                        <form onSubmit={handleResponseSubmit}>
                            <label>Your Response</label>
                            <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                required
                                rows="5"
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Response'}
                            </button>
                            <button type="button" onClick={() => setCurrentQuery(null)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueryManagement;
