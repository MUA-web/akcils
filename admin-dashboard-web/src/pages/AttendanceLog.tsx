import { useState, useEffect } from 'react';
import { Download, CheckCircle, Clock, Fingerprint, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AttendanceLog.css';

// API_URL removed as it belongs to the old dashboard logic

const AttendanceLog = () => {
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [selectedCourse, setSelectedCourse] = useState('All');
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [availableDepts, setAvailableDepts] = useState<string[]>(['All']);
    const [availableLevels, setAvailableLevels] = useState<string[]>(['All']);
    const [availableCourses, setAvailableCourses] = useState<string[]>(['All']);

    useEffect(() => {
        fetchLogs();
        fetchFilters();
    }, []);

    const fetchFilters = async () => {
        try {
            const [dRes, lRes, cRes, attRes] = await Promise.all([
                supabase.from('departments').select('name').order('name'),
                supabase.from('levels').select('label').order('label'),
                supabase.from('courses').select('code').order('code'),
                supabase.from('attendance').select('course_code').not('course_code', 'is', null),
            ]);

            if (dRes.data) setAvailableDepts(['All', ...dRes.data.map(d => d.name)]);
            if (lRes.data) setAvailableLevels(['All', ...Array.from(new Set(lRes.data.map(l => l.label)))]);

            // Merge courses from the courses table AND from actual attendance records
            const fromCoursesTable = (cRes.data || []).map(c => c.code);
            const fromAttendance = (attRes.data || []).map(a => a.course_code).filter(Boolean);
            const allCodes = Array.from(new Set([...fromCoursesTable, ...fromAttendance])).sort();
            setAvailableCourses(['All', ...allCodes]);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch today's records from attendance table
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('date', today);

            if (attendanceError) throw attendanceError;

            // 2. Fetch all students (for those who haven't marked)
            const { data: allStudents, error: studentsError } = await supabase
                .from('students')
                .select('*');

            if (studentsError) throw studentsError;

            // 3. Map students to attendance status
            const mergedLogs = allStudents.map(student => {
                const record = attendanceData.find(r =>
                    r.registration_number === student.registration_number
                );

                return {
                    id: student.id,
                    name: student.full_name,
                    registration_number: student.registration_number,
                    department: student.department || (record ? record.department : 'Unknown'),
                    level: student.level || (record ? record.level : 'Unknown'),
                    date: record ? record.date : today,
                    created_at: record ? record.created_at : null,
                    course_code: record ? record.course_code : null,
                    method: record ? (record.method || 'Fingerprint') : null,
                    status: record ? 'Present' : 'Absent'
                };
            });

            setLogs(mergedLogs);
        } catch (error) {
            console.error('Error fetching logs:', error);
            alert('Failed to fetch attendance logs');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesDept = selectedDept === 'All' || log.department === selectedDept;
        const matchesLevel = selectedLevel === 'All' || log.level === selectedLevel;
        const matchesCourse = selectedCourse === 'All' || log.course_code === selectedCourse || log.status === 'Absent';
        return matchesDept && matchesLevel && matchesCourse;
    }).sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === 'Present' ? -1 : 1;
        }
        return (a.name || '').localeCompare(b.name || '');
    });

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Attendance Log</h2>
                <button className="primary-btn">
                    <Download size={16} /> Export Report
                </button>
            </div>

            <div className="page-content">
                <div className="filters-container">
                    <div className="dropdowns">
                        <div className="dropdown-group">
                            <label>Department</label>
                            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                                {availableDepts.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                            </select>
                        </div>
                        <div className="dropdown-group">
                            <label>Level</label>
                            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                                {availableLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                            </select>
                        </div>
                        <div className="dropdown-group">
                            <label>Course</label>
                            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                                {availableCourses.map(course => <option key={course} value={course}>{course}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-state">Loading attendance logs...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Date & Time</th>
                                    <th>Course</th>
                                    <th>Method</th>
                                    <th className="action-col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <p className="student-name" style={{ margin: 0 }}>{log.name}</p>
                                            <span style={{ fontSize: '11px', color: '#a0a0a0' }}>{log.registration_number}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0a0', fontSize: '13px' }}>
                                                <Clock size={14} />
                                                {log.date} {log.created_at ? `• ${new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                            </div>
                                        </td>
                                        <td>
                                            {log.course_code ? (
                                                <span className="level-badge">{log.course_code}</span>
                                            ) : (
                                                <span style={{ color: '#a0a0a0' }}>{log.status === 'Absent' ? 'N/A' : '-'}</span>
                                            )}
                                        </td>
                                        <td>
                                            {log.method ? (
                                                <div className={`method-badge ${log.method.toLowerCase()}`}>
                                                    {log.method === 'Fingerprint' ? <Fingerprint size={14} /> : <Lock size={14} />}
                                                    {log.method}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#a0a0a0' }}>-</span>
                                            )}
                                        </td>
                                        <td className="action-col">
                                            <div className={`status-badge ${log.status.toLowerCase()}`}>
                                                {log.status === 'Present' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                {log.status}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="empty-state">No attendance logs found matching your filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceLog;
