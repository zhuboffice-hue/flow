import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';

const ClientContacts = ({ clientId }) => {
    const [contacts, setContacts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newContact, setNewContact] = useState({
        name: '',
        email: '',
        phone: '',
        role: ''
    });

    useEffect(() => {
        if (!clientId) return;

        const unsubscribe = onSnapshot(collection(db, 'clients', clientId, 'contacts'), (snapshot) => {
            const contactsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setContacts(contactsData);
        });
        return () => unsubscribe();
    }, [clientId]);

    const handleAddContact = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'clients', clientId, 'contacts'), {
                ...newContact,
                createdAt: new Date()
            });
            setIsModalOpen(false);
            setNewContact({ name: '', email: '', phone: '', role: '' });
        } catch (error) {
            console.error("Error adding contact:", error);
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                await deleteDoc(doc(db, 'clients', clientId, 'contacts', contactId));
            } catch (error) {
                console.error("Error deleting contact:", error);
            }
        }
    };

    const columns = [
        { key: 'name', header: 'Name', accessor: 'name', cell: (row) => <span className="font-medium">{row.name}</span> },
        { key: 'email', header: 'Email', accessor: 'email' },
        { key: 'phone', header: 'Phone', accessor: 'phone' },
        { key: 'role', header: 'Role', accessor: 'role' },
        {
            key: 'actions',
            header: '',
            accessor: 'actions',
            cell: (row) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon"><Icon name="Edit" size={14} /></Button>
                    <Button variant="ghost" size="icon" className="text-danger" onClick={() => handleDeleteContact(row.id)}><Icon name="Trash2" size={14} /></Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Contacts</h3>
                <Button size="sm" onClick={() => setIsModalOpen(true)}><Icon name="Plus" size={14} className="mr-2" /> Add Contact</Button>
            </div>

            {contacts.length === 0 ? (
                <div className="text-center py-8 text-text-secondary bg-surface rounded-lg border border-border">
                    <p>No contacts found for this client.</p>
                </div>
            ) : (
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <Table data={contacts} columns={columns} />
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Contact"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddContact}>Add Contact</Button>
                    </div>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Name"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Phone"
                            value={newContact.phone}
                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        />
                        <Input
                            label="Role"
                            value={newContact.role}
                            onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ClientContacts;
