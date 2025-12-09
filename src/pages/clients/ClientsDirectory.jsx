import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ThreePaneLayout from '../../components/layout/ThreePaneLayout';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import ClientFormModal from '../../components/clients/ClientFormModal';

const ClientsDirectory = () => {
    const [clients, setClients] = useState([]);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClients(clientsData);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveClient = async (clientData) => {
        try {
            if (selectedClient) {
                // Update existing
                await updateDoc(doc(db, 'clients', selectedClient.id), clientData);
            } else {
                // Create new
                await addDoc(collection(db, 'clients'), {
                    ...clientData,
                    status: 'Active',
                    projects: 0,
                    invoices: 0,
                    createdAt: new Date()
                });
            }
            setIsModalOpen(false);
            setSelectedClient(null);
        } catch (error) {
            console.error("Error saving client: ", error);
        }
    };

    const handleEditClient = (client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleDeleteClient = async (clientId) => {
        if (window.confirm("Are you sure you want to delete this client?")) {
            try {
                await deleteDoc(doc(db, 'clients', clientId));
            } catch (error) {
                console.error("Error deleting client:", error);
            }
        }
    };

    const openNewClientModal = () => {
        setSelectedClient(null);
        setIsModalOpen(true);
    };

    const handleStatusChange = async (clientId, newStatus) => {
        try {
            await updateDoc(doc(db, 'clients', clientId), { status: newStatus });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Client Name',
            accessor: 'name',
            cell: (_, row) => (
                <Link to={`/app/clients/${row.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                    <Avatar name={row.name} size="sm" />
                    <span className="font-medium">{row.name || 'Untitled Client'}</span>
                </Link>
            )
        },
        { key: 'industry', header: 'Industry', accessor: 'industry' },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            cell: (_, row) => {
                const variants = { 'Active': 'bg-success/10 text-success', 'Inactive': 'bg-danger/10 text-danger', 'On Hold': 'bg-warning/10 text-warning' };
                const currentStatus = row?.status || 'Active';
                return (
                    <select
                        className={`text-xs font-medium px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer ${variants[currentStatus] || 'bg-gray-100 text-gray-600'}`}
                        value={currentStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                );
            }
        },
        { key: 'primaryEmail', header: 'Email', accessor: 'primaryEmail', cell: (val) => val || '-' },
        { key: 'primaryName', header: 'Contact', accessor: 'primaryName', cell: (val) => val || '-' },
        {
            key: 'actions',
            header: '',
            accessor: 'actions',
            cell: (_, row) => (
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClient(row)} title="Edit">
                        <Icon name="Edit" size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(row.id)} title="Delete" className="text-danger hover:bg-danger/10">
                        <Icon name="Trash2" size={16} />
                    </Button>
                </div>
            )
        }
    ];

    const fileInputRef = React.useRef(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split(/\r\n|\n/);

            // Robust CSV line parser
            const parseLine = (line) => {
                const values = [];
                let currentValue = '';
                let inQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue.trim());
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                values.push(currentValue.trim());
                return values;
            };

            const nonEmptyLines = lines.filter(l => l.trim().length > 0);
            if (nonEmptyLines.length < 2) {
                alert("Invalid CSV format or empty file.");
                return;
            }

            const headerLine = nonEmptyLines[0];
            const headers = parseLine(headerLine).map(h => h.replace(/^["']|["']$/g, '').toLowerCase());

            if (headers.length < 2) {
                alert("Invalid CSV format. Please ensure consistent columns.");
                return;
            }

            let successCount = 0;
            const batchPromises = [];

            for (let i = 1; i < nonEmptyLines.length; i++) {
                const line = nonEmptyLines[i];
                const values = parseLine(line);

                if (values.length > headers.length) {
                    // unexpected extra columns, try to slice? or skip?
                    // often trailing empty comma
                }

                // Allow simple mismatch if it's just trailing empty fields, but generally strict
                // if (values.length !== headers.length) continue; 

                const clientData = {};
                headers.forEach((header, index) => {
                    const h = header.replace(/[^a-z0-9]/g, '');
                    let val = values[index];

                    // Cleanup quotes
                    if (val && val.startsWith('"') && val.endsWith('"')) {
                        val = val.slice(1, -1);
                    }
                    // Handle double quotes inside
                    if (val) val = val.replace(/""/g, '"');

                    if (!val) return;

                    if (h.includes('clientname') || h === 'name') clientData.name = val;
                    else if (h.includes('industry')) clientData.industry = val;
                    else if (h.includes('status')) clientData.status = val;
                    else if (h.includes('email')) clientData.primaryEmail = val;
                    else if (h.includes('contact')) clientData.primaryName = val;
                    // Additional fields
                    else if (h.includes('accountmanager')) clientData.accountManager = val;
                    else if (h.includes('phone')) clientData.primaryPhone = val;
                    else if (h.includes('website')) clientData.website = val;
                });

                // Set defaults
                clientData.createdAt = new Date();
                clientData.status = clientData.status || 'Active';
                clientData.projects = 0;
                clientData.invoices = 0;

                if (clientData.name) {
                    batchPromises.push(addDoc(collection(db, 'clients'), clientData));
                    successCount++;
                }
            }

            try {
                await Promise.all(batchPromises);
                alert(`Successfully imported ${successCount} clients.`);
            } catch (error) {
                console.error("Error importing CSV:", error);
                alert("Partial or full import failure. Check console.");
            }

            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <ThreePaneLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h2 font-bold text-text-primary">Clients</h1>
                        <p className="text-text-secondary">Manage your client relationships.</p>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv"
                            className="hidden"
                        />
                        <Button variant="secondary" onClick={handleImportClick}>
                            <Icon name="Upload" size={16} className="mr-2" /> Import CSV
                        </Button>
                        <Button onClick={openNewClientModal}>
                            <Icon name="Plus" size={16} className="mr-2" /> Add Client
                        </Button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="h-8 w-px bg-border mx-2"></div>
                        <select defaultValue="All Statuses" className="px-3 py-2 rounded-md border border-border bg-background text-small">
                            <option value="All Statuses">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Paused">Paused</option>
                            <option value="Archived">Archived</option>
                        </select>
                        <select defaultValue="All Industries" className="px-3 py-2 rounded-md border border-border bg-background text-small">
                            <option value="All Industries">All Industries</option>
                            <option value="Technology">Technology</option>
                            <option value="Finance">Finance</option>
                        </select>
                    </div>
                    <div className="flex bg-background rounded-md border border-border p-1">
                        <button
                            className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-surface shadow-sm' : 'text-muted hover:text-text-primary'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <Icon name="List" size={18} />
                        </button>
                        <button
                            className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-surface shadow-sm' : 'text-muted hover:text-text-primary'}`}
                            onClick={() => setViewMode('cards')}
                        >
                            <Icon name="Grid" size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {viewMode === 'table' ? (
                    <div className="bg-surface rounded-lg border border-border overflow-hidden">
                        <Table
                            data={clients}
                            columns={columns}
                            selectable
                        />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map(client => (
                            <div key={client.id} className="bg-surface p-6 rounded-lg border border-border hover:shadow-md transition-shadow relative group">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClient(client)} className="h-8 w-8">
                                        <Icon name="Edit" size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id)} className="h-8 w-8 text-danger hover:bg-danger/10">
                                        <Icon name="Trash2" size={14} />
                                    </Button>
                                </div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={client.name} />
                                        <div>
                                            <h3 className="font-bold text-text-primary">{client.name}</h3>
                                            <p className="text-xs text-text-secondary">{client.industry}</p>
                                        </div>
                                    </div>
                                    <Badge variant={client.status === 'Active' ? 'success' : 'warning'}>{client.status || 'Draft'}</Badge>
                                </div>
                                <div className="space-y-2 text-small text-text-secondary mb-6">
                                    <div className="flex items-center gap-2">
                                        <Icon name="User" size={14} /> <span className="font-medium text-text-primary">Contact:</span> {client.primaryName || client.primaryContact || '-'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icon name="Mail" size={14} /> <span className="font-medium text-text-primary">Email:</span> {client.primaryEmail || client.email || '-'}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="text-xs text-muted">
                                        {client.projects || 0} Projects · {client.invoices || 0} Invoices
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/app/clients/${client.id}`)}>View Details</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <ClientFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSaveClient}
                    initialData={selectedClient}
                />
            </div>
        </ThreePaneLayout>
    );
};

export default ClientsDirectory;
