import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Departments.css';

const Departments = () => {
    const [departments, setDepartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [prefix, setPrefix] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('departments')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setDepartments(data || []);
        } catch (error: any) {
            alert(error.message || 'Failed to fetch departments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (dept?: any) => {
        if (dept) {
            setEditingId(dept.id);
            setName(dept.name);
            setPrefix(dept.prefix);
        } else {
            setEditingId(null);
            setName('');
            setPrefix('');
        }
        setIsModalVisible(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !prefix.trim()) {
            alert('Please fill in all fields');
            return;
        }

        setIsSaving(true);
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('departments')
                    .update({ name, prefix })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('departments')
                    .insert([{ name, prefix }]);
                if (error) throw error;
            }

            setIsModalVisible(false);
            fetchDepartments();
        } catch (error: any) {
            alert(error.message || 'Failed to save department');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            (async () => {
                try {
                    const { error } = await supabase
                        .from('departments')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    fetchDepartments();
                } catch (error: any) {
                    alert(error.message || 'Failed to delete');
                }
            })();
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Departments</h2>
                <button className="primary-btn" onClick={() => handleOpenModal()}>
                    <Plus size={16} /> Add Department
                </button>
            </div>

            <div className="page-content">
                {isLoading ? (
                    <div className="loading-state">Loading departments...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Department Name</th>
                                    <th>Prefix</th>
                                    <th className="action-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.length > 0 ? departments.map((dept) => (
                                    <tr key={dept.id}>
                                        <td style={{ fontWeight: 600 }}>{dept.name}</td>
                                        <td>
                                            <span className="level-badge">{dept.prefix}</span>
                                        </td>
                                        <td className="action-col">
                                            <div className="action-buttons">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => handleOpenModal(dept)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(dept.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="empty-state">
                                            <p>No departments found</p>
                                            <small>Add your first department using the Add Button</small>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalVisible && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Department' : 'New Department'}</h3>
                            <button className="close-btn" onClick={() => setIsModalVisible(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label>Department Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Computer Science"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Registration ID Prefix</label>
                                <input
                                    type="text"
                                    placeholder="e.g. SCE/PT/BSCS/23/"
                                    value={prefix}
                                    onChange={(e) => setPrefix(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="primary-btn submit-btn" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Department'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Departments;
