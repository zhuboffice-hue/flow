import React, { useState } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
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
import { useAuth } from '../../context/AuthContext';
import ClientFormModal from '../clients/ClientFormModal';
import Icon from '../ui/Icon';

const CreateProjectModal = ({ isOpen, onClose, clientId, project, onSuccess }) => {
    const { currentUser } = useAuth(); // Get currentUser
    const { currency: companyCurrency } = useCurrency();
    const [newProject, setNewProject] = useState(initialProjectState);

    const [loading, setLoading] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);

    React.useEffect(() => {
        if (!isOpen || !currentUser?.companyId) return;

        // If editing an existing project, populate state
        if (project) {
            setNewProject({
                ...initialProjectState,
                ...project,
            });
        } else {
            setNewProject({
                ...initialProjectState,
                currency: companyCurrency
            });
        }

        const fetchData = async () => {
            try {
                // Fetch Clients (Filtered)
                const clientsQ = query(collection(db, 'clients'), where('companyId', '==', currentUser.companyId));
                const clientsSnap = await getDocs(clientsQ);
                setClients(clientsSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

                // Fetch Users for Team/Manager (Filtered)
                // Assuming users collection has companyId? Actually users are in 'users' collection with 'companyId' field.
                // Wait, users collection structure: doc(db, 'users', uid).
                // So we need to query 'users' collection where companyId matches.
                // Or maybe 'employees' collection? The original code fetched from 'users'.
                // Let's check 'users' collection structure in AuthContext. Yes, users have companyId.
                const usersQ = query(collection(db, 'users'), where('companyId', '==', currentUser.companyId));
                // However, we might want to fetch from 'employees' instead for the team list, as 'users' are auth accounts.
                // The original code used 'users'. Let's stick to 'users' but filtering by companyId is safer.
                // Actually, 'employees' collection seems to be the one used in Team.jsx.
                // Let's check if 'users' collection is queryable by companyId. Yes index might be needed.
                // For now, let's use 'employees' if possible, but if not, 'users' with filter.
                // Given the original code used 'users', let's stick to it but adding filter.
                const usersSnap = await getDocs(usersQ);
                setUsers(usersSnap.docs.map(d => ({
                    id: d.id,
                    name: d.data().displayName || d.data().name || d.data().email
                })));
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchData();
    }, [isOpen, project, companyCurrency, currentUser]);

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
                companyId: currentUser.companyId, // Add companyId
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

    const handleClientSuccess = (newClientData) => {
        // Since ClientFormModal doesn't return ID directly in onSubmit (it usually handles its own saving),
        // we might need to listen to the clients list update or handle it differently.
        // However, ClientFormModal props are (isOpen, onClose, onSubmit, initialData).
        // Let's check ClientFormModal usage.

        // Wait, ClientFormModal usually takes an onSubmit that handles the API call? 
        // Or does it handle it internally?
        // Looking at ClientFormModal.jsx:
        // const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); onClose(); };
        // So it passes pure form data to the parent.

        // We need to save the client here then.
        handleSaveClient(newClientData);
    };

    const handleSaveClient = async (clientData) => {
        try {
            const docRef = await addDoc(collection(db, 'clients'), {
                ...clientData,
                companyId: currentUser.companyId,
                createdAt: new Date()
            });

            // Add to local list immediately to avoid waiting for re-fetch if not using real-time listener here
            const newClient = { id: docRef.id, name: clientData.name };
            setClients(prev => [...prev, newClient]);

            // Auto-select
            handleChange('clientId', docRef.id);
            setIsClientModalOpen(false);
        } catch (error) {
            console.error("Error creating client:", error);
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

                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <Select
                                    label="Client"
                                    name="clientId"
                                    value={newProject.clientId}
                                    onChange={(e) => handleChange('clientId', e.target.value)}
                                    options={clients.map(c => ({ value: c.id, label: c.name }))}
                                    placeholder="Select Client"
                                />
                            </div>
                            <Button
                                type="button" // Prevent form submission
                                variant="outline"
                                size="icon"
                                className="mb-[1px]" // Align with input
                                onClick={() => setIsClientModalOpen(true)}
                                title="Add New Client"
                            >
                                <Icon name="Plus" size={18} />
                            </Button>
                        </div>
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

            <ClientFormModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSubmit={handleSaveClient}
            />
        </Modal>
    );
};

export default CreateProjectModal;
