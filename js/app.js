// Configuration
const CONFIG = {
    // ⚠️ CHANGE THIS: Replace with your actual Azure App Service URL
    API_BASE_URL: 'https://iot-hub-viewer-yourname-e5cebydkczgphbdr.centralus-01.azurewebsites.net'
};

const { useState, useEffect } = React;

// Main App Component
function App() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newDeviceId, setNewDeviceId] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/devices`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch devices: ${response.statusText}`);
            }
            
            const data = await response.json();
            setDevices(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createDevice = async (e) => {
        e.preventDefault();
        
        if (!newDeviceId.trim()) {
            setError('Device ID cannot be empty');
            return;
        }

        setCreating(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(
                `${CONFIG.API_BASE_URL}/api/devices/${encodeURIComponent(newDeviceId)}`, 
                { method: 'POST' }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create device: ${errorText}`);
            }

            const newDevice = await response.json();
            setSuccess(`Device "${newDeviceId}" created successfully!`);
            setNewDeviceId('');
            setShowModal(false);
            
            // Refresh the device list
            await fetchDevices();

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const getStatusClass = (status) => {
        return status === 'Enabled' ? 'badge-success' : 'badge-danger';
    };

    const getConnectionClass = (state) => {
        return state === 'Connected' ? 'badge-success' : 'badge-secondary';
    };

    return (
        <div className="container">
            <Header 
                loading={loading}
                onRefresh={fetchDevices}
                onCreateClick={() => setShowModal(true)}
            />

            <Messages error={error} success={success} />

            {loading && devices.length === 0 && <LoadingSpinner />}

            {!loading && devices.length === 0 && !error && <NoDevices />}

            {devices.length > 0 && (
                <DeviceGrid 
                    devices={devices}
                    formatDate={formatDate}
                    getStatusClass={getStatusClass}
                    getConnectionClass={getConnectionClass}
                />
            )}

            {showModal && (
                <CreateDeviceModal
                    newDeviceId={newDeviceId}
                    setNewDeviceId={setNewDeviceId}
                    creating={creating}
                    onSubmit={createDevice}
                    onCancel={() => {
                        setShowModal(false);
                        setNewDeviceId('');
                    }}
                />
            )}
        </div>
    );
}

// Header Component
function Header({ loading, onRefresh, onCreateClick }) {
    return (
        <div className="header">
            <h1>IoT Hub Devices</h1>
            <div className="button-group">
                <button onClick={onRefresh} disabled={loading}>
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>
                <button className="create-btn" onClick={onCreateClick}>
                    ➕ Create Device
                </button>
            </div>
        </div>
    );
}

// Messages Component
function Messages({ error, success }) {
    return (
        <>
            {error && (
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    <strong>Success:</strong> {success}
                </div>
            )}
        </>
    );
}

// Loading Spinner Component
function LoadingSpinner() {
    return (
        <div className="loading">
            <div className="spinner"></div>
            <p>Loading devices...</p>
        </div>
    );
}

// No Devices Component
function NoDevices() {
    return (
        <div className="no-devices">
            <p>No devices found. Create your first device!</p>
        </div>
    );
}

// Device Grid Component
function DeviceGrid({ devices, formatDate, getStatusClass, getConnectionClass }) {
    return (
        <div className="devices-grid">
            {devices.map((device) => (
                <DeviceCard
                    key={device.deviceId}
                    device={device}
                    formatDate={formatDate}
                    getStatusClass={getStatusClass}
                    getConnectionClass={getConnectionClass}
                />
            ))}
        </div>
    );
}

// Device Card Component
function DeviceCard({ device, formatDate, getStatusClass, getConnectionClass }) {
    return (
        <div className="device-card">
            <div className="device-header">
                <h3>{device.deviceId}</h3>
                <div className="status-badges">
                    <span className={`badge ${getStatusClass(device.status)}`}>
                        {device.status}
                    </span>
                    <span className={`badge ${getConnectionClass(device.connectionState)}`}>
                        {device.connectionState}
                    </span>
                </div>
            </div>
            <div className="device-details">
                <div className="detail-row">
                    <span className="label">Authentication:</span>
                    <span className="value">{device.authenticationType}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Last Activity:</span>
                    <span className="value">{formatDate(device.lastActivityTime)}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Pending Messages:</span>
                    <span className="value">{device.cloudToDeviceMessageCount}</span>
                </div>
            </div>
        </div>
    );
}

// Create Device Modal Component
function CreateDeviceModal({ newDeviceId, setNewDeviceId, creating, onSubmit, onCancel }) {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Create New Device</h2>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="deviceId">Device ID:</label>
                        <input
                            type="text"
                            id="deviceId"
                            value={newDeviceId}
                            onChange={(e) => setNewDeviceId(e.target.value)}
                            placeholder="Enter device ID (e.g., device-001)"
                            autoFocus
                            required
                        />
                    </div>
                    <div className="modal-buttons">
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={onCancel}
                            disabled={creating}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="create-btn"
                            disabled={creating}
                        >
                            {creating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);