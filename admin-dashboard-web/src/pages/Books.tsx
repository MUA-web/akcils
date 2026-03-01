import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, User, Trash2 } from 'lucide-react';
import './Books.css';

interface Book {
    id: string;
    title: string;
    price: number;
    level: string;
    department: string;
    created_at: string;
}

interface Student {
    id: string;
    full_name: string;
    registration_number: string;
}

const Books = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [levels, setLevels] = useState<string[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'tracking'>('list');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [purchases, setPurchases] = useState<Record<string, boolean>>({});
    const [pageLoading, setPageLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Form states
    const [newBook, setNewBook] = useState({
        title: '',
        price: '',
        level: '',
        department: ''
    });

    useEffect(() => {
        fetchBooks();
        fetchMetadata();
    }, []);

    const fetchBooks = async () => {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching books:', error);
        else setBooks(data || []);
        setLoading(false);
    };

    const fetchMetadata = async () => {
        // Fetch all levels and departments from their respective tables
        const { data: levelTableData } = await supabase.from('levels').select('label');
        const { data: deptTableData } = await supabase.from('departments').select('name');

        // Also fetch unique values from students table for fallbacks/matching
        const { data: studentData } = await supabase.from('students').select('level, department');

        const uniqueStudentLevels = Array.from(new Set(studentData?.map(s => s.level))).filter(Boolean) as string[];
        const uniqueStudentDepts = Array.from(new Set(studentData?.map(s => s.department))).filter(Boolean) as string[];

        // Use table data if available, otherwise use student data, otherwise use defaults
        const defaultLevels = ['100L', '200L', '300L', '400L', '500L'];
        const allLevels = levelTableData?.length
            ? Array.from(new Set(levelTableData.map(l => l.label).filter(Boolean))) as string[]
            : (uniqueStudentLevels.length ? uniqueStudentLevels : defaultLevels);

        const defaultDepts = ['Computer Science', 'Mathematics', 'Physics', 'Engineering'];
        const allDepts = deptTableData?.length
            ? deptTableData.map(d => d.name).filter(Boolean) as string[]
            : (uniqueStudentDepts.length ? uniqueStudentDepts : defaultDepts);

        // Sort but extract numbers if possible to sort 100L before 200L properly
        setLevels(allLevels.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
        setDepartments(allDepts.sort());

        setNewBook(prev => ({
            ...prev,
            level: '',
            department: ''
        }));
    };

    const handleAddBook = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Create the book
        const { error: bookError } = await supabase
            .from('books')
            .insert([{
                title: newBook.title,
                price: parseFloat(newBook.price),
                level: newBook.level,
                department: newBook.department
            }])
            .select()
            .single();

        if (bookError) {
            alert('Error adding book: ' + bookError.message);
            return;
        }

        // 2. Find students to notify (matching level and department)
        const { data: studentsToNotify } = await supabase
            .from('students')
            .select('id')
            .eq('level', newBook.level)
            .eq('department', newBook.department);

        if (studentsToNotify && studentsToNotify.length > 0) {
            // 3. Bulk insert notifications for all matched students
            const notifications = studentsToNotify.map(student => ({
                student_id: student.id,
                title: 'New Book Registered',
                message: `New study material "${newBook.title}" is now available for target Level ${newBook.level}.`,
                type: 'book'
            }));

            const { error: notifyError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notifyError) console.error('Error broadcasting notifications:', notifyError);
        }

        // 4. Reset form and update UI
        setNewBook({
            title: '',
            price: '',
            level: '',
            department: ''
        });
        setShowAddModal(false);
        fetchBooks();
    };

    const openTracking = async (book: Book) => {
        setSelectedBook(book);
        setView('tracking');
        setPageLoading(true);

        // Fetch students of this level AND department
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id, full_name, registration_number')
            .eq('level', book.level)
            .eq('department', book.department);

        if (studentError) {
            console.error('Error fetching students:', studentError);
        } else {
            setStudents(studentData || []);

            // Fetch existing purchases for this book
            const { data: purchaseData, error: purchaseError } = await supabase
                .from('book_purchases')
                .select('student_id, is_paid')
                .eq('book_id', book.id);

            if (purchaseError) {
                console.error('Error fetching purchases:', purchaseError);
            } else {
                const purchaseMap: Record<string, boolean> = {};
                purchaseData?.forEach(p => {
                    purchaseMap[p.student_id] = p.is_paid;
                });
                setPurchases(purchaseMap);
            }
        }
        setPageLoading(false);
    };

    const totalPaidCount = Object.values(purchases).filter(v => v).length;
    const totalRevenue = selectedBook ? totalPaidCount * selectedBook.price : 0;

    const togglePurchase = async (studentId: string) => {
        const currentStatus = !!purchases[studentId];
        const newStatus = !currentStatus;

        const { error } = await supabase
            .from('book_purchases')
            .upsert({
                book_id: selectedBook?.id,
                student_id: studentId,
                is_paid: newStatus,
            }, { onConflict: 'book_id, student_id' });

        if (error) {
            console.error('Error updating purchase:', error);
        } else {
            setPurchases(prev => ({ ...prev, [studentId]: newStatus }));
        }
    };

    const handleDeleteBook = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this book? This will also remove all purchase records.')) {
            try {
                const { error } = await supabase
                    .from('books')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
                fetchBooks();
            } catch (error: any) {
                alert(error.message || 'Failed to delete book');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} books? This will also remove all their purchase records.`)) {
            setLoading(true);
            try {
                const { error } = await supabase
                    .from('books')
                    .delete()
                    .in('id', selectedIds);

                if (error) throw error;

                setSelectedIds([]);
                fetchBooks();
            } catch (error: any) {
                alert(error.message || 'Failed to delete selected books');
                setLoading(false);
            }
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === books.length && books.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(books.map(b => b.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (view === 'tracking' && selectedBook) {
        return (
            <div className="books-container fade-in">
                <div className="dashboard-top-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <button className="back-btn" onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--slate-medium)' }}>
                                <X size={20} />
                            </button>
                            <h1 className="page-title" style={{ margin: 0 }}>Sales Tracking</h1>
                        </div>
                        <p className="page-subtitle">
                            {selectedBook.title} — {selectedBook.department} • Level {selectedBook.level}
                        </p>
                    </div>
                    <div className="sales-summary-compact">
                        <div className="stat-pill">
                            <span className="label">Revenue:</span>
                            <span className="value">₦{totalRevenue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="sales-overview-grid">
                    <div className="stat-card-gold">
                        <div className="stat-info">
                            <p className="stat-label">Total Students</p>
                            <h3 className="stat-value">{students.length}</h3>
                        </div>
                    </div>
                    <div className="stat-card-gold">
                        <div className="stat-info">
                            <p className="stat-label">Students Paid</p>
                            <h3 className="stat-value" style={{ color: 'var(--success-green)' }}>{totalPaidCount}</h3>
                        </div>
                    </div>
                    <div className="stat-card-gold">
                        <div className="stat-info">
                            <p className="stat-label">Total Revenue</p>
                            <h3 className="stat-value" style={{ color: 'var(--primary-blue)' }}>₦{totalRevenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="books-list-card" style={{ marginTop: '24px' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Student Payment List</h3>
                    {pageLoading ? (
                        <p style={{ textAlign: 'center', padding: '40px' }}>Loading student data...</p>
                    ) : (
                        <div className="student-list full-page-list">
                            <div className="student-tracking-row header-row">
                                <span>Student Name</span>
                                <span>Reg Number</span>
                                <span style={{ textAlign: 'right' }}>Payment Status</span>
                            </div>
                            {students.map(student => (
                                <div key={student.id} className="student-tracking-row">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="student-icon">
                                            <User size={16} color="var(--primary-blue)" />
                                        </div>
                                        <span style={{ fontWeight: '600' }}>{student.full_name}</span>
                                    </div>
                                    <span style={{ color: 'var(--slate-medium)' }}>{student.registration_number}</span>
                                    <div className="status-toggle-wrapper">
                                        <div className="status-toggle" onClick={() => togglePurchase(student.id)}>
                                            <div className={`toggle-switch ${purchases[student.id] ? 'active' : ''}`}>
                                                <div className="toggle-knob"></div>
                                            </div>
                                            <span className={`status-text ${purchases[student.id] ? 'paid' : 'unpaid'}`}>
                                                {purchases[student.id] ? 'PAID' : 'UNPAID'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {students.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px' }}>
                                    <p style={{ color: 'var(--slate-medium)' }}>No students found in this department/level.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Book Management</h2>
                    <p className="page-subtitle" style={{ color: 'var(--slate-medium)', marginTop: '4px' }}>Track student book payments by level and department.</p>
                </div>
                <div className="header-actions">
                    {books.length > 0 && view === 'list' && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {selectedIds.length > 0 && (
                                <button className="delete-btn bulk-delete" onClick={handleBulkDelete}>
                                    <Trash2 size={16} /> Delete Selected ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    )}
                    <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Register New Book
                    </button>
                </div>
            </div>

            <div className="books-list-card" style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Available Books</h3>
                {loading ? (
                    <p>Loading books...</p>
                ) : (
                    <table className="books-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={books.length > 0 && selectedIds.length === books.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>Book Title</th>
                                <th>Target Group</th>
                                <th>Unit Price</th>
                                <th>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map(book => (
                                <tr key={book.id} className={selectedIds.includes(book.id) ? 'selected-row' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(book.id)}
                                            onChange={() => toggleSelect(book.id)}
                                        />
                                    </td>
                                    <td style={{ fontWeight: '700', fontSize: '15px' }}>{book.title}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--slate-medium)' }}>{book.department}</span>
                                            <span className="badge level-medium" style={{ width: 'fit-content', padding: '2px 10px' }}>Level {book.level}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--primary-blue)', fontWeight: '800', fontSize: '16px' }}>₦{book.price.toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button className="track-btn-premium" onClick={() => openTracking(book)}>
                                                View Sales & Tracking
                                            </button>
                                            <button className="delete-btn-simple" onClick={() => handleDeleteBook(book.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {books.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-medium)' }}>
                                        No books registered yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Book Modal */}
            {showAddModal && (
                <div className="tracking-modal-overlay">
                    <div className="tracking-modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Register New Book</h3>
                                <p style={{ fontSize: '13px', color: 'var(--slate-medium)' }}>Setup a new book for sale tracking.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowAddModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleAddBook}>
                                <div className="form-group">
                                    <label>Book Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Advanced Calculus"
                                        value={newBook.title}
                                        onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price (₦)</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={newBook.price}
                                        onChange={e => setNewBook({ ...newBook, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Assigned Department</label>
                                    <select
                                        value={newBook.department}
                                        onChange={e => setNewBook({ ...newBook, department: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Choose Department --</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assigned Level</label>
                                    <select
                                        value={newBook.level}
                                        onChange={e => setNewBook({ ...newBook, level: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Choose Level --</option>
                                        {levels.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="submit-btn" style={{ marginTop: '20px' }}>
                                    Confirm Registration
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Books;
