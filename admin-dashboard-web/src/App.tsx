import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AttendanceLog from './pages/AttendanceLog';
import Students from './pages/Students';
import Departments from './pages/Departments';
import Courses from './pages/Courses';
import Levels from './pages/Levels';
import Books from './pages/Books';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    // Close sidebar on route change
    closeSidebar();
  }, [location.pathname]);

  useEffect(() => {
    // 1. Splash Screen Timer (Mandatory 2.5s)
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    // 2. Auth Session Check with Safety Timeout
    const authTimeout = setTimeout(() => {
      setLoading(false); // Safety bypass
    }, 6000);

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && session.user?.user_metadata?.role !== 'admin') {
          await supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(session);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        clearTimeout(authTimeout);
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user?.user_metadata?.role !== 'admin') {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
      }
    });

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Priority 1: Show splash for at least the timer duration
  if (showSplash) {
    return <SplashScreen />;
  }

  // Priority 2: Wait for auth to resolve (or timeout)
  if (loading) {
    return <SplashScreen />; // Keep showing splash while waiting for auth
  }

  // If not logged in, only allow Login page
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If logged in and on /login, redirect to dashboard
  if (location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Topbar onMenuClick={toggleSidebar} />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<AttendanceLog />} />
          <Route path="/students" element={<Students />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/levels" element={<Levels />} />
          <Route path="/books" element={<Books />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
