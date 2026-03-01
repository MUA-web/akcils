import { useState, useEffect } from 'react';
import { Search, UserCheck, Trash2, Edit2, ArrowUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Students.css';

const Students = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        department: '',
        level: ''
    });

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const [availableDepts, setAvailableDepts] = useState<string[]>(['All']);
    const [availableLevels, setAvailableLevels] = useState<string[]>(['All']);

    useEffect(() => {
        fetchStudents();
        fetchFilters();
    }, []);

    const fetchFilters = async () => {
        try {
            const { data: dData } = await supabase.from('departments').select('name').order('name');
            const { data: lData } = await supabase.from('levels').select('label').order('label');

            if (dData) setAvailableDepts(['All', ...dData.map(d => d.name)]);
            if (lData) setAvailableLevels(['All', ...Array.from(new Set(lData.map(l => l.label)))]);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            // If the column 'created_at' doesn't exist, this might throw, so fallback if needed
            if (error) {
                // Try without ordering if 'created_at' fails
                const fallback = await supabase.from('students').select('*');
                if (fallback.error) throw fallback.error;
                if (fallback.data) {
                    setStudents(fallback.data.map((u: any) => ({
                        name: u.full_name || 'Unknown',
                        registrationNumber: u.registration_number || 'N/A',
                        department: u.department_id || 'N/A',
                        level: u.level_id || 'N/A'
                    })));
                }
            } else if (data) {
                setStudents(data.map((u: any) => ({
                    name: u.full_name || 'Unknown',
                    registrationNumber: u.registration_number || 'N/A',
                    department: u.department || 'N/A',
                    level: u.level || 'N/A'
                })));
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            alert('Failed to fetch students from server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStudent = async (regNo: string) => {
        if (window.confirm(`Are you sure you want to remove student with ID ${regNo}?`)) {
            try {
                // We use an RPC call because deleting from `students` doesn't automatically 
                // delete the Supabase Auth account. The RPC handles both.
                const { error, data } = await supabase.rpc('delete_student_by_reg', { reg_no: regNo });

                if (error) {
                    console.error('RPC Delete Error:', error);
                    // Fallback to normal delete if RPC doesn't exist yet
                    const fallback = await supabase.from('students').delete().eq('registration_number', regNo);
                    if (fallback.error) throw fallback.error;
                } else if (data === false) {
                    console.warn('Student not found in RPC logic.');
                }

                fetchStudents();
            } catch (error: any) {
                alert(error.message || 'Failed to delete student');
            }
        }
    };

    const handleEditClick = (student: any) => {
        setEditingStudent(student);
        setEditFormData({
            name: student.name,
            department: student.department !== 'N/A' ? student.department : '',
            level: student.level !== 'N/A' ? student.level : ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;

        try {
            const { error } = await supabase
                .from('students')
                .update({
                    full_name: editFormData.name,
                    department: editFormData.department,
                    level: editFormData.level
                })
                .eq('registration_number', editingStudent.registrationNumber);

            if (error) throw error;
            setIsEditModalOpen(false);
            fetchStudents(); // Refresh the list
        } catch (error: any) {
            console.error('Error updating student:', error);
            alert(error.message || 'Failed to update student');
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredStudents = students
        .filter(student => {
            const nameMatch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
            const regMatch = student.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSearch = nameMatch || regMatch;
            const matchesDept = selectedDept === 'All' || student.department === selectedDept;
            const matchesLevel = selectedLevel === 'All' || student.level === selectedLevel;
            return matchesSearch && matchesDept && matchesLevel;
        })
        .sort((a, b) => {
            if (sortConfig !== null) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            }
            // Default sorting by registration number
            return a.registrationNumber.localeCompare(b.registrationNumber, undefined, { numeric: true });
        });

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Students</h2>
            </div>

            <div className="page-content">
                <div className="filters-container">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="dropdowns">
                        <div className="dropdown-group">
                            <label>Dept</label>
                            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                                {availableDepts.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div className="dropdown-group">
                            <label>Level</label>
                            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                                {availableLevels.map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-state">Loading students...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="sortable-header" onClick={() => handleSort('name')}>
                                        Student Info <ArrowUpDown size={14} className="sort-icon" />
                                    </th>
                                    <th className="sortable-header" onClick={() => handleSort('department')}>
                                        Department <ArrowUpDown size={14} className="sort-icon" />
                                    </th>
                                    <th className="sortable-header" onClick={() => handleSort('level')}>
                                        Level <ArrowUpDown size={14} className="sort-icon" />
                                    </th>
                                    <th className="action-col">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                    <tr key={student.registrationNumber}>
                                        <td>
                                            <div className="student-info-cell">
                                                <div className="student-avatar">
                                                    <UserCheck size={20} />
                                                </div>
                                                <div>
                                                    <p className="student-name">{student.name}</p>
                                                    <span className="student-reg">{student.registrationNumber}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{student.department}</td>
                                        <td><span className="level-badge">{student.level}</span></td>
                                        <td className="action-col">
                                            <div className="action-buttons">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => handleEditClick(student)}
                                                    title="Edit Student"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDeleteStudent(student.registrationNumber)}
                                                    title="Delete Student"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="empty-state">No students found matching your filters.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Student Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit Student Info</h3>
                            <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleUpdateStudent}>
                            <div className="form-group">
                                <label>Registration Number (Read Only)</label>
                                <input
                                    type="text"
                                    value={editingStudent?.registrationNumber || ''}
                                    disabled
                                    className="readonly-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <select
                                    value={editFormData.department}
                                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select Department</option>
                                    {availableDepts.filter(d => d !== 'All').map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Level</label>
                                <select
                                    value={editFormData.level}
                                    onChange={(e) => setEditFormData({ ...editFormData, level: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select Level</option>
                                    {availableLevels.filter(l => l !== 'All').map(lvl => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;
