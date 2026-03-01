import { X, LayoutDashboard, BookOpen, CheckSquare, Settings, LogOut, UserCheck, Building, Layers, Book } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path ? 'active' : '';

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
            <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <div style={{ backgroundColor: 'var(--bg-main)', width: '12px', height: '12px', borderRadius: '50%' }}></div>
                    </div>
                    <h2>MB SARARI</h2>
                    <button className="mobile-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="sidebar-section">
                    <h4 className="section-title">Main Menu</h4>
                    <nav className="nav-menu">
                        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/attendance" className={`nav-item ${isActive('/attendance')}`}>
                            <CheckSquare size={20} />
                            <span>Attendance Log</span>
                        </Link>
                        <Link to="/students" className={`nav-item ${isActive('/students')}`}>
                            <UserCheck size={20} />
                            <span>Students</span>
                        </Link>
                        <Link to="/departments" className={`nav-item ${isActive('/departments')}`}>
                            <Building size={20} />
                            <span>Departments</span>
                        </Link>
                        <Link to="/courses" className={`nav-item ${isActive('/courses')}`}>
                            <BookOpen size={20} />
                            <span>Courses</span>
                        </Link>
                        <Link to="/levels" className={`nav-item ${isActive('/levels')}`}>
                            <Layers size={20} />
                            <span>Levels</span>
                        </Link>
                        <Link to="/books" className={`nav-item ${isActive('/books')}`}>
                            <Book size={20} />
                            <span>Book Management</span>
                        </Link>
                    </nav>
                </div>



                <div className="sidebar-bottom">
                    <h1 className="splash-title">MB SARARI</h1>
                    <nav className="nav-menu">
                        <a href="#" className="nav-item">
                            <Settings size={20} />
                            <span>Setting</span>
                        </a>
                        <a href="#" className="nav-item logout">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </a>
                    </nav>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
