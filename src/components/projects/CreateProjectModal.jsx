import React, { useState } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { initialProjectState, PROJECT_TYPES, CURRENCIES, VISIBILITY_OPTIONS, CURRENCY_OPTIONS } from '../../lib/models';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SearchableSelect from '../ui/SearchableSelect';
import MultiSelect from '../ui/MultiSelect';
import TextArea from '../ui/TextArea';
import { useCurrency } from '../../hooks/useCurrency';

const CreateProjectModal = ({ isOpen, onClose, clientId, project, onSuccess }) => {
    const { currency: companyCurrency } = useCurrency(); // Get company currency
    const [newProject, setNewProject] = useState(initialProjectState);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);

    React.useEffect(() => {
        if (!isOpen) return;

        // If editing an existing project, populate state
        if (project) {
            setNewProject({
                ...initialProjectState,
                ...project,
                // Ensure date strings are handled correctly if needed, though they usually bind directly to input date
            });
        } else {
            setNewProject({
                ...initialProjectState,
                currency: companyCurrency // Default to company currency
            });
        }

        const fetchData = async () => {
            try {
                // Fetch Clients
                const clientsSnap = await getDocs(collection(db, 'clients'));
                setClients(clientsSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

                // Fetch Users for Team/Manager
                const usersSnap = await getDocs(collection(db, 'users'));
                setUsers(usersSnap.docs.map(d => ({
                    id: d.id,
                    name: d.data().displayName || d.data().name || d.data().email
                })));
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchData();
    }, [isOpen, project, companyCurrency]);

    const handleChange = (field, value) => {
        setNewProject(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use passed clientId or selected clientId
            const finalClientId = clientId || newProject.clientId;
            const projectData = {
                ...newProject,
                clientId: finalClientId,
                updatedAt: new Date()
            };

            if (project?.id) {
                // Update existing project
                await updateDoc(doc(db, 'projects', project.id), projectData);
            } else {
                // Create new project
                await addDoc(collection(db, 'projects'), {
                    ...projectData,
                    createdAt: new Date()
                });
            }

            setNewProject(initialProjectState);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving project:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={project ? "Edit Project" : "Create New Project"}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : (project ? 'Save Changes' : 'Create Project')}
                    </Button>
                </div>
            }
        >
            <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {!clientId && (
                        <Select
                            label="Client"
                            value={newProject.clientId}
                            onChange={(e) => handleChange('clientId', e.target.value)}
                            options={clients.map(c => ({ value: c.id, label: c.name }))}
                            placeholder="Select Client"
                        />
                    )}
                    <Input
                        label="Project Name"
                        value={newProject.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        placeholder="e.g. Website Redesign"
                        className={!clientId ? "" : "col-span-2"}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Project Type"
                        value={newProject.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        options={PROJECT_TYPES.map(t => ({ value: t, label: t }))}
                    />
                    <Select
                        label="Visibility"
                        value={newProject.visibility}
                        onChange={(e) => handleChange('visibility', e.target.value)}
                        options={VISIBILITY_OPTIONS.map(v => ({ value: v, label: v }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Start Date"
                        type="date"
                        value={newProject.startDate || ''}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                    />
                    <Input
                        label="End Date"
                        type="date"
                        value={newProject.endDate || ''}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Budget"
                        type="number"
                        min="0"
                        value={newProject.budget}
                        onChange={(e) => handleChange('budget', parseFloat(e.target.value) || 0)}
                    />
                    <SearchableSelect
                        label="Currency"
                        value={newProject.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        options={CURRENCY_OPTIONS}
                        placeholder="Select Currency"
                    />
                </div>

                <TextArea
                    label="Description"
                    value={newProject.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Project goals and details..."
                    rows={4}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchableSelect
                        label="Project Manager"
                        value={newProject.managerId}
                        onChange={(e) => handleChange('managerId', e.target.value)}
                        options={users.map(u => ({ value: u.id, label: u.name }))}
                        placeholder="Assign Manager"
                    />
                    <MultiSelect
                        label="Team Members"
                        value={newProject.team}
                        onChange={(val) => handleChange('team', val)}
                        options={users.map(u => ({ value: u.id, label: u.name }))}
                        placeholder="Select Team"
                    />
                </div>
            </form>
        </Modal>
    );
};

export default CreateProjectModal;
