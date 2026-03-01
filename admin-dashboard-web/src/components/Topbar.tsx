import { Menu, CheckCircle, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './Topbar.css';

interface TopbarProps {
    onMenuClick: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
    const location = useLocation();
    let title = 'Dashboard';
    let subtitle = '';

    if (location.pathname === '/dashboard') {
        title = 'Attendance Overview';
        subtitle = 'Manage and track student attendance records efficiently.';
    } else {
        // Auto-generate for other routes based on pathname
        const path = location.pathname.split('/')[1];
        title = path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';
        subtitle = `Manage ${title.toLowerCase()} and system components.`;
    }

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="mobile-menu-btn" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
                <div className="topbar-page-info">
                    <h1 className="topbar-title">{title}</h1>
                    <p className="topbar-subtitle">{subtitle}</p>
                </div>
            </div>
            <div className="topbar-actions">
                <span className="topbar-last-update">
                    Last Update: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <CheckCircle size={12} color="var(--success)" />
                </span>
                <button className="topbar-export-btn">
                    <span>Export Data</span> <ChevronRight size={12} />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
