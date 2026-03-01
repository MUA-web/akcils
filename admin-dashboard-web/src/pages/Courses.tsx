import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Calendar, Clock, BarChart2, X, MapPin, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Courses.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATIONS = ['2 Hours'];
const TIME_SLOTS = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM'
];

const Courses = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Form State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [totalSessions, setTotalSessions] = useState('40');
    const [sessionDay, setSessionDay] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [sessionDuration, setSessionDuration] = useState('2 Hours');

    // Geofencing State
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [radiusMeters, setRadiusMeters] = useState('50');

    const [depts, setDepts] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [isLoadingLevels, setIsLoadingLevels] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchDepts();
    }, []);

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('courses')
                .select(`
                    *,
                    departments (name),
                    levels (label)
                `)
                .order('code', { ascending: true });

            if (error) throw error;
            setCourses(data || []);
        } catch (error: any) {
            alert(error.message || 'Failed to fetch courses');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDepts = async () => {
        try {
            const { data, error } = await supabase
                .from('departments')
                .select('*')
                .order('name');
            if (error) throw error;
            setDepts(data || []);
        } catch (error: any) {
            console.error('Failed to load departments', error);
        }
    };

    const fetchLevelsForDept = async (deptId: string) => {
        setIsLoadingLevels(true);
        try {
            const { data, error } = await supabase
                .from('levels')
                .select('*')
                .eq('department_id', deptId)
                .order('label');

            if (error) throw error;

            if (!data || data.length === 0) {
                if (window.confirm('This department has no levels configured. Would you like to seed default levels (Level 1-5)?')) {
                    await seedDefaultLevels(deptId);
                }
                setLevels([]);
            } else {
                setLevels(data);
            }
            setSelectedLevel('');
        } catch (error: any) {
            alert('Failed to fetch levels: ' + error.message);
        } finally {
            setIsLoadingLevels(false);
        }
    };

    const seedDefaultLevels = async (deptId: string) => {
        try {
            const defaults = [
                { department_id: deptId, label: 'Level 1' },
                { department_id: deptId, label: 'Level 2' },
                { department_id: deptId, label: 'Level 3' },
                { department_id: deptId, label: 'Level 4' },
                { department_id: deptId, label: 'Level 5' },
            ];
            const { error } = await supabase.from('levels').insert(defaults);
            if (error) throw error;

            await fetchLevelsForDept(deptId);
        } catch (error: any) {
            alert('Failed to seed levels: ' + error.message);
        }
    };

    const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deptId = e.target.value;
        setSelectedDept(deptId);
        if (deptId) {
            fetchLevelsForDept(deptId);
        } else {
            setLevels([]);
            setSelectedLevel('');
        }
    };

    const handleOpenModal = () => {
        setName('');
        setCode('');
        setSelectedDept('');
        setSelectedLevel('');
        setTotalSessions('40');
        setSessionDay('');
        setSessionTime('');
        setSessionDuration('2 Hours');
        setLatitude('');
        setLongitude('');
        setRadiusMeters('50');
        setIsModalVisible(true);
    };

    const getTimeRange = (startTime: string, durationStr: string) => {
        if (!startTime) return 'No Time';

        try {
            // Rough calculation for display
            const duration = parseInt(durationStr) || 1;
            const timeParts = startTime.match(/(\d+):?(\d+)?\s*(AM|PM)/i);
            if (!timeParts) return startTime;

            let hours = parseInt(timeParts[1]);
            let minutes = parseInt(timeParts[2] || '0');
            const modifier = timeParts[3].toUpperCase();

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            let endHours = hours + duration;
            let endModifier = 'AM';

            if (endHours >= 12) {
                endModifier = 'PM';
                if (endHours > 12) endHours -= 12;
                if (endHours === 12 && modifier === 'AM') endModifier = 'PM'; // Edge case
            } else if (endHours === 0) {
                endHours = 12;
            }

            const minutesStr = minutes.toString().padStart(2, '0');
            return `${startTime} - ${endHours}:${minutesStr} ${endModifier}`;
        } catch (e) {
            return startTime;
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !code.trim() || !selectedDept) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('courses')
                .insert([{
                    name,
                    code: code.toUpperCase(),
                    department_id: selectedDept,
                    level_id: selectedLevel || null,
                    total_sessions: parseInt(totalSessions) || 40,
                    session_day: sessionDay,
                    session_time: sessionTime,
                    duration: sessionDuration,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                    radius_meters: radiusMeters ? parseInt(radiusMeters) : 50
                }]);

            if (error) throw error;
            setIsModalVisible(false);
            fetchCourses();
        } catch (error: any) {
            alert(error.message || 'Failed to save course');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to remove this course?')) {
            (async () => {
                try {
                    const { error } = await supabase
                        .from('courses')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
                    fetchCourses();
                } catch (error: any) {
                    alert('Failed to delete course');
                }
            })();
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} courses?`)) {
            setIsLoading(true);
            try {
                const { error } = await supabase
                    .from('courses')
                    .delete()
                    .in('id', selectedIds);

                if (error) throw error;

                setSelectedIds([]);
                fetchCourses();
            } catch (error: any) {
                alert(error.message || 'Failed to delete selected courses');
                setIsLoading(false);
            }
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === courses.length && courses.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(courses.map(c => c.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleStartSession = (course: any) => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        if (window.confirm(`Start attendance session for ${course.code}? This will set the required GPS location to your CURRENT physical location.`)) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    try {
                        const { error } = await supabase
                            .from('courses')
                            .update({
                                latitude: lat,
                                longitude: lon,
                            })
                            .eq('id', course.id);

                        if (error) throw error;

                        alert(`Session started successfully!\nActive Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                        fetchCourses(); // Refresh the display
                    } catch (error: any) {
                        alert('Failed to start session: ' + error.message);
                    }
                },
                () => {
                    alert("Could not get your location. Please check your browser's location permissions.");
                },
                { enableHighAccuracy: true }
            );
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Courses</h2>
                <div className="header-actions">
                    {courses.length > 0 && (
                        <button className="secondary-btn" onClick={toggleSelectAll}>
                            {selectedIds.length === courses.length ? 'Deselect All' : 'Select All'}
                        </button>
                    )}
                    {selectedIds.length > 0 && (
                        <button className="delete-btn bulk-delete" onClick={handleBulkDelete}>
                            <Trash2 size={16} /> Delete Selected ({selectedIds.length})
                        </button>
                    )}
                    <button className="primary-btn" onClick={handleOpenModal}>
                        <Plus size={16} /> Create New Course
                    </button>
                </div>
            </div>

            <div className="page-content transparent-bg">
                {isLoading ? (
                    <div className="loading-state">Loading courses...</div>
                ) : courses.length > 0 ? (
                    <div className="courses-grid">
                        {courses.map((course) => (
                            <div className={`course-card ${selectedIds.includes(course.id) ? 'selected-card' : ''}`} key={course.id} onClick={() => toggleSelect(course.id)}>
                                <div className="course-header">
                                    <div className="course-selection">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(course.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleSelect(course.id);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="course-code-row">
                                        <span className="course-code">{course.code}</span>
                                        <span className="course-dept">{course.departments?.name || 'N/A'}</span>
                                    </div>
                                    <button
                                        className="delete-btn-icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(course.id);
                                        }}
                                        title="Delete Course"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <h3 className="course-name">{course.name}</h3>
                                <div className="course-meta">
                                    <div className="meta-item">
                                        <Calendar size={14} />
                                        <span>{course.session_day || 'No Day'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Clock size={14} />
                                        <span>{getTimeRange(course.session_time, course.duration)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <BarChart2 size={14} />
                                        <span>{course.total_sessions || 40} total</span>
                                    </div>
                                    {course.latitude && course.longitude && (
                                        <div className="meta-item">
                                            <span style={{ color: '#475569', fontSize: 12 }}>📍 Active Location: {course.latitude.toFixed(4)}, {course.longitude.toFixed(4)}</span>
                                        </div>
                                    )}
                                </div>

                                <button className="start-session-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartSession(course);
                                }}>
                                    <PlayCircle size={16} /> Start Class Session
                                </button>

                                <div className="course-level">
                                    {course.levels?.label || 'No Level'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state-card">
                        <BookOpen size={48} color="#cbd5e1" />
                        <p className="empty-title">No courses found</p>
                        <p className="empty-desc">Create your first course using the button above.</p>
                    </div>
                )}
            </div>

            {isModalVisible && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h3>New Course</h3>
                            <button className="close-btn" onClick={() => setIsModalVisible(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-row">
                                <div className="form-group flex-2">
                                    <label>Course Title *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Software Engineering"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Course Code *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CSC412"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Offering Department *</label>
                                    <select value={selectedDept} onChange={handleDeptChange} required>
                                        <option value="" disabled>Select Department</option>
                                        {depts.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Level (Optional) {isLoadingLevels && <span className="loading-text">Loading...</span>}</label>
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        disabled={!selectedDept || isLoadingLevels}
                                    >
                                        <option value="">{selectedDept ? 'Select Level' : 'Select a department first'}</option>
                                        {levels.map(l => (
                                            <option key={l.id} value={l.id}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="section-divider">
                                <h4>Attendance Configuration</h4>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Total Sessions per Semester</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 40"
                                        value={totalSessions}
                                        onChange={(e) => setTotalSessions(e.target.value)}
                                        min="1"
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Class Day</label>
                                    <select value={sessionDay} onChange={(e) => setSessionDay(e.target.value)}>
                                        <option value="">Select Day</option>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Start Time</label>
                                    <select value={sessionTime} onChange={(e) => setSessionTime(e.target.value)}>
                                        <option value="">Select Time</option>
                                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Duration</label>
                                    <select value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)}>
                                        {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="section-divider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4>Location Coordinates (Geofencing)</h4>
                                <button
                                    type="button"
                                    className="detect-btn"
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    setLatitude(position.coords.latitude.toFixed(6));
                                                    setLongitude(position.coords.longitude.toFixed(6));
                                                },
                                                () => {
                                                    alert("Could not detect location. Please ensure location services are allowed in your browser.");
                                                },
                                                { enableHighAccuracy: true }
                                            );
                                        } else {
                                            alert("Geolocation is not supported by your browser.");
                                        }
                                    }}
                                >
                                    <MapPin size={14} /> Detect Location
                                </button>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label>Latitude</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 5.6037"
                                        step="any"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Longitude</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. -0.1870"
                                        step="any"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Allowed Radius (meters)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 50"
                                        value={radiusMeters}
                                        onChange={(e) => setRadiusMeters(e.target.value)}
                                        min="10"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="primary-btn submit-btn" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Course'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Courses;
