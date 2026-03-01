import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Levels.css';

const Levels = () => {
    const [levels, setLevels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [levelLabel, setLevelLabel] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('levels')
                .select('*')
                .order('label', { ascending: true });

            if (error) throw error;
            setLevels(data || []);
        } catch (error: any) {
            alert(error.message || 'Failed to fetch levels');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (level?: any) => {
        if (level) {
            setEditingId(level.id);
            setLevelLabel(level.label);
        } else {
            setEditingId(null);
            setLevelLabel('');
        }
        setIsModalVisible(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!levelLabel.trim()) {
            alert('Please enter a level label');
            return;
        }

        setIsSaving(true);
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('levels')
                    .update({ label: levelLabel })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('levels')
                    .insert([{ label: levelLabel }]);
                if (error) throw error;
            }

            setIsModalVisible(false);
            fetchLevels();
        } catch (error: any) {
            alert(error.message || 'Failed to save level');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this academic level?')) {
            (async () => {
                try {
                    const { error } = await supabase
                        .from('levels')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    fetchLevels();
                } catch (error: any) {
                    alert(error.message || 'Failed to delete');
                }
            })();
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Levels Config</h2>
                <button className="primary-btn" onClick={() => handleOpenModal()}>
                    <Plus size={16} /> Add Level
                </button>
            </div>

            <div className="page-content">
                {isLoading ? (
                    <div className="loading-state">Loading levels...</div>
                ) : (
                    <div className="levels-grid">
                        {levels.length > 0 ? (
                            levels.map((item) => (
                                <div className="level-card" key={item.id}>
                                    <div className="level-info">
                                        <div className="icon-box">
                                            <Layers size={20} color="#6b46c1" />
                                        </div>
                                        <span className="level-name">{item.label}</span>
                                    </div>
                                    <div className="action-buttons">
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleOpenModal(item)}
                                            title="Edit Level"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="delete-btn-icon"
                                            onClick={() => handleDelete(item.id)}
                                            title="Delete Level"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state-full">
                                <Layers size={48} color="#cbd5e1" />
                                <p>No levels configured</p>
                                <small>Add levels like 100L, 200L, etc.</small>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isModalVisible && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Level' : 'New Level'}</h3>
                            <button className="close-btn" onClick={() => setIsModalVisible(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label>Level Label</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 100L"
                                    value={levelLabel}
                                    onChange={(e) => setLevelLabel(e.target.value.toUpperCase())}
                                    autoFocus
                                    required
                                />
                            </div>

                            <button type="submit" className="primary-btn submit-btn" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Levels;
