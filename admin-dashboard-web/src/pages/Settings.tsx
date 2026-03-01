import { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import './Settings.css';

const Settings = () => {
    const [scheduledClasses, setScheduledClasses] = useState('40');
    const [attendanceThreshold, setAttendanceThreshold] = useState('75');
    const [includeStudentId, setIncludeStudentId] = useState(true);
    const [includeDept, setIncludeDept] = useState(true);
    const [autoExport, setAutoExport] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Mock save logic
        setTimeout(() => {
            setIsSaving(false);
            alert('Settings saved successfully!');
        }, 800);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Settings</h2>
                <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            <div className="page-content transparent-bg" style={{ padding: 0 }}>
                <div className="settings-section">
                    <h3 className="section-title">Attendance Export</h3>
                    <div className="settings-card">
                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Total Scheduled Classes</h4>
                                <p>Used to calculate percentage in Excel reports</p>
                            </div>
                            <input
                                type="number"
                                className="numeric-input"
                                value={scheduledClasses}
                                onChange={(e) => setScheduledClasses(e.target.value)}
                            />
                        </div>
                        <div className="setting-divider" />

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Attendance Threshold (%)</h4>
                                <p>Minimum required for exam eligibility</p>
                            </div>
                            <input
                                type="number"
                                className="numeric-input"
                                value={attendanceThreshold}
                                onChange={(e) => setAttendanceThreshold(e.target.value)}
                            />
                        </div>
                        <div className="setting-divider" />

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Include Student ID</h4>
                                <p>Add matriculation number column</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={includeStudentId}
                                    onChange={(e) => setIncludeStudentId(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className="setting-divider" />

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Include Department</h4>
                                <p>Add academic unit column</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={includeDept}
                                    onChange={(e) => setIncludeDept(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h3 className="section-title">Automation</h3>
                    <div className="settings-card">
                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Daily Auto-Export</h4>
                                <p>Email report at end of day</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={autoExport}
                                    onChange={(e) => setAutoExport(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="reset-container">
                    <button className="reset-btn">Restore Default Settings</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
