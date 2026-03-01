import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './DashboardContent.css';

const DashboardContent = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<{
        totalStudents: number;
        todayAttendance: number;
        totalDepartments: number;
        loading: boolean;
    }>({
        totalStudents: 0,
        todayAttendance: 0,
        totalDepartments: 0,
        loading: true
    });

    const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Get Total Students
                const { count: studentCount } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true });

                // Get Total Departments
                const { count: deptCount } = await supabase
                    .from('departments')
                    .select('*', { count: 'exact', head: true });

                // Get Today's Attendance
                const today = new Date().toISOString().split('T')[0];
                const { count: attendanceCount } = await supabase
                    .from('attendance')
                    .select('*', { count: 'exact', head: true })
                    .eq('date', today);

                setStats({
                    totalStudents: studentCount || 0,
                    todayAttendance: attendanceCount || 0,
                    totalDepartments: deptCount || 0,
                    loading: false
                });

                // Get Recent Attendance Logs (use flat data from attendance table)
                const { data: logs, error: logsError } = await supabase
                    .from('attendance')
                    .select('*')
                    .order('date', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (logsError) throw logsError;
                setRecentAttendance(logs || []);
                setLoadingLogs(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setStats(prev => ({ ...prev, loading: false }));
                setLoadingLogs(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="dashboard-content">
            {/* Stat Cards */}
            <div className="stat-cards">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon icon-blue">
                            <Users size={16} />
                        </div>
                        <span className="stat-trend trend-up">↑ 12.1%</span>
                    </div>
                    <div className="stat-card-body">
                        <h2 className="stat-value">{stats.loading ? '...' : stats.totalStudents}</h2>
                        <p className="stat-label">Total Registered Students</p>
                    </div>
                    <div className="stat-card-footer">
                        <span>from last period</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon icon-green">
                            <CheckCircle size={16} />
                        </div>
                        <span className="stat-trend trend-up">↑ 5.2%</span>
                    </div>
                    <div className="stat-card-body">
                        <h2 className="stat-value">{stats.loading ? '...' : stats.todayAttendance}</h2>
                        <p className="stat-label">Today's Presence</p>
                    </div>
                    <div className="stat-card-footer">
                        <span>from last period</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <div className="stat-icon icon-slate">
                            <Building2 size={16} />
                        </div>
                        <span className="stat-trend trend-down">↓ 1.2%</span>
                    </div>
                    <div className="stat-card-body">
                        <h2 className="stat-value">{stats.loading ? '...' : stats.totalDepartments}</h2>
                        <p className="stat-label">Academic Departments</p>
                    </div>
                    <div className="stat-card-footer">
                        <span>from last period</span>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="controls-bar">
                <div className="tab-buttons">
                    <button className="tab-btn active">List View</button>
                    <button className="tab-btn">Charts</button>
                </div>
                <div className="control-actions">
                    <button className="icon-btn-text">Sort by</button>
                    <button className="icon-btn-text">Filter</button>
                    <div className="search-pill">
                        <Users size={14} />
                        <input type="text" placeholder="Search..." />
                    </div>
                    <button className="primary-blue-btn" onClick={() => navigate('/students')}>+ Add Student</button>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="recent-activity">
                <div className="activity-row table-header">
                    <div className="col-check"><input type="checkbox" /></div>
                    <div className="col-status">Status</div>
                    <div className="col-name">Student Name</div>
                    <div className="col-reg">Reg. Number</div>
                    <div className="col-course">Course</div>
                    <div className="col-auth" style={{ width: '120px' }}>Auth Method</div>
                    <div className="col-duration" style={{ width: '100px' }}>Duration</div>
                </div>

                {loadingLogs ? (
                    <div className="loading-state">Loading recent records...</div>
                ) : recentAttendance.length > 0 ? (
                    recentAttendance.map((log) => (
                        <div key={log.id} className="activity-row">
                            <div className="col-check"><input type="checkbox" /></div>
                            <div className="col-status">
                                <span className={`status-dot present`}></span>
                                Present
                            </div>
                            <div className="col-name">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.name || 'User'}`}
                                    alt=""
                                    className="table-avatar-circle"
                                />
                                <span className="bold-name">{log.name || 'Unknown Student'}</span>
                            </div>
                            <div className="col-reg muted-sub">{log.registration_number || 'N/A'}</div>
                            <div className="col-course">{log.course_code || 'N/A'}</div>
                            <div className="col-auth">
                                <span className={`auth-badge ${log.method?.toLowerCase()}`}>
                                    {log.method || 'Default'}
                                </span>
                            </div>
                            <div className="col-duration" style={{ fontSize: '12px', color: 'var(--slate-medium)' }}>
                                {log.date || 'Today'}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-data">No recent attendance records found.</div>
                )}
            </div>
        </div>
    );
};

export default DashboardContent;
