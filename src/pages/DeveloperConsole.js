import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DeveloperConsole.css';

const DeveloperConsole = () => {
    const [systemData, setSystemData] = useState({
        health: {},
        backups: [],
        logs: [],
        config: {}
    });
    const [loading, setLoading] = useState({
        health: true,
        backups: true,
        logs: true,
        config: true
    });
    const [errors, setErrors] = useState({
        health: null,
        backups: null,
        logs: null,
        config: null
    });
    const [backupStatus, setBackupStatus] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSystemData();
    }, []);

    const fetchSystemData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Reset loading states
            setLoading({
                health: true,
                backups: true,
                logs: true,
                config: true
            });

            // Reset errors
            setErrors({
                health: null,
                backups: null,
                logs: null,
                config: null
            });

            const endpoints = [
                { key: 'health', url: '/dev/health' },
                { key: 'backups', url: '/dev/backups' },
                { key: 'logs', url: '/dev/logs' },
                { key: 'config', url: '/dev/config' }
            ];

            const requests = endpoints.map(({ key, url }) => 
                axios.get(`http://localhost:5000${url}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(response => ({ key, data: response.data }))
                .catch(error => ({ key, error }))
            );

            const results = await Promise.all(requests);

            results.forEach(({ key, data, error }) => {
                if (error) {
                    console.error(`Error fetching ${key}:`, error);
                    setErrors(prev => ({ ...prev, [key]: error.response?.data?.error || 'Failed to load data' }));
                } else {
                    setSystemData(prev => ({ ...prev, [key]: data }));
                }
                setLoading(prev => ({ ...prev, [key]: false }));
            });

        } catch (error) {
            console.error("Error in fetchSystemData:", error);
            setErrors({
                health: 'Failed to load system data',
                backups: 'Failed to load backups',
                logs: 'Failed to load logs',
                config: 'Failed to load config'
            });
        }
    };

    const handleRunBackup = async () => {
        try {
            setBackupStatus({ loading: true, message: 'Starting backup...' });
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/dev/backups', {}, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            
            setBackupStatus({ 
                loading: false, 
                message: 'Backup completed successfully!',
                success: true
            });
            
            // Refresh backups list
            fetchSystemData();
            
            // Clear status after 5 seconds
            setTimeout(() => setBackupStatus(null), 5000);
        } catch (error) {
            console.error("Error running backup:", error);
            setBackupStatus({ 
                loading: false, 
                message: error.response?.data?.error || 'Backup failed',
                success: false
            });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${days}d ${hours}h ${mins}m ${secs}s`;
    };

    return (
        <div className="developer-console">
            <div className="header">
                <h1>IWB Developer Console</h1>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>

            <div className="dashboard">
                {/* System Health Card */}
                <div className="card health-card">
                    <h2>System Health</h2>
                    {loading.health ? (
                        <p className="loading-indicator">Loading health data...</p>
                    ) : errors.health ? (
                        <p className="error-message">{errors.health}</p>
                    ) : (
                        <div className="health-metrics">
                            <div className="metric">
                                <span className="label">Database:</span>
                                <span className={`value ${systemData.health.dbStatus === 'online' ? 'online' : 'offline'}`}>
                                    {systemData.health.dbStatus}
                                </span>
                            </div>
                            <div className="metric">
                                <span className="label">API:</span>
                                <span className={`value ${systemData.health.apiStatus === 'online' ? 'online' : 'offline'}`}>
                                    {systemData.health.apiStatus}
                                </span>
                            </div>
                            <div className="metric">
                                <span className="label">Storage:</span>
                                <span className="value">{systemData.health.storageUsage || '0'}% used</span>
                            </div>
                            <div className="metric">
                                <span className="label">Last Checked:</span>
                                <span className="value">
                                    {new Date(systemData.health.lastChecked).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Backup Management Card */}
                <div className="card backup-card">
                    <h2>Backup Management</h2>
                    {backupStatus && (
                        <div className={`status-message ${backupStatus.success ? 'success' : 'error'}`}>
                            {backupStatus.message}
                        </div>
                    )}
                    <button 
                        onClick={handleRunBackup} 
                        disabled={backupStatus?.loading}
                        className="action-button"
                    >
                        {backupStatus?.loading ? 'Processing...' : 'Run Backup Now'}
                    </button>
                    
                    <div className="backup-list">
                        <h3>Recent Backups</h3>
                        {loading.backups ? (
                            <p className="loading-indicator">Loading backup history...</p>
                        ) : errors.backups ? (
                            <p className="error-message">{errors.backups}</p>
                        ) : systemData.backups.length === 0 ? (
                            <p>No backups available</p>
                        ) : (
                            <ul>
                                {systemData.backups.map(backup => (
                                    <li key={backup.id}>
                                        <div className="backup-header">
                                            <span className="backup-date">
                                                {new Date(backup.backup_date).toLocaleString()}
                                            </span>
                                            <span className={`backup-status ${backup.status}`}>
                                                {backup.status}
                                            </span>
                                        </div>
                                        <div className="backup-details">
                                            <span className="backup-size">
                                                {formatBytes(backup.size * 1024 * 1024)}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* System Logs Card */}
                <div className="card logs-card">
                    <h2>System Logs</h2>
                    {loading.logs ? (
                        <p className="loading-indicator">Loading system logs...</p>
                    ) : errors.logs ? (
                        <p className="error-message">{errors.logs}</p>
                    ) : systemData.logs.length === 0 ? (
                        <p>No logs available</p>
                    ) : (
                        <div className="log-list-container">
                            <ul className="log-list">
                                {systemData.logs.map(log => (
                                    <li key={log.id} className={`log-entry ${log.level}`}>
                                        <div className="log-header">
                                            <span className="log-timestamp">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                            <span className="log-level">{log.level}</span>
                                        </div>
                                        <div className="log-message">{log.message}</div>
                                        {log.context && (
                                            <div className="log-context">
                                                {JSON.stringify(log.context, null, 2)}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Configuration Card */}
                <div className="card config-card">
                    <h2>System Configuration</h2>
                    {loading.config ? (
                        <p className="loading-indicator">Loading configuration...</p>
                    ) : errors.config ? (
                        <p className="error-message">{errors.config}</p>
                    ) : (
                        <div className="config-sections">
                            <div className="config-section">
                                <h3>API Information</h3>
                                <div className="config-item">
                                    <span className="config-key">Version:</span>
                                    <span className="config-value">{systemData.config.apiVersion}</span>
                                </div>
                                <div className="config-item">
                                    <span className="config-key">Environment:</span>
                                    <span className="config-value">{systemData.config.environment}</span>
                                </div>
                            </div>

                            <div className="config-section">
                                <h3>Database</h3>
                                <div className="config-item">
                                    <span className="config-key">Type:</span>
                                    <span className="config-value">{systemData.config.database?.type}</span>
                                </div>
                                <div className="config-item">
                                    <span className="config-key">Version:</span>
                                    <span className="config-value">{systemData.config.database?.version}</span>
                                </div>
                                <div className="config-item">
                                    <span className="config-key">Connections:</span>
                                    <span className="config-value">
                                        {systemData.config.database?.currentConnections} / {systemData.config.database?.maxConnections}
                                    </span>
                                </div>
                            </div>

                            <div className="config-section">
                                <h3>System</h3>
                                <div className="config-item">
                                    <span className="config-key">Uptime:</span>
                                    <span className="config-value">
                                        {formatUptime(systemData.config.system?.uptime)}
                                    </span>
                                </div>
                                <div className="config-item">
                                    <span className="config-key">Memory Usage:</span>
                                    <span className="config-value">
                                        {formatBytes(systemData.config.system?.memoryUsage?.rss)}
                                    </span>
                                </div>
                            </div>

                            <div className="config-section">
                                <h3>Auto Reply</h3>
                                <div className="config-item">
                                    <span className="config-key">Status:</span>
                                    <span className="config-value">
                                        {systemData.config.autoReply?.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="config-item">
                                    <span className="config-key">Keywords:</span>
                                    <span className="config-value">
                                        {systemData.config.autoReply?.keywords?.join(', ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeveloperConsole;