import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SearchableSelect from '../ui/SearchableSelect';
import Button from '../ui/Button';
import { COUNTRIES } from '../../lib/constants';

const ClientFormModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const defaultData = {
        name: '',
        website: '',
        industry: '',
        country: '',
        type: 'Company',
        description: '',
        primaryName: '',
        primaryEmail: '',
        primaryPhone: '',
        accountManager: '',
        tags: ''
    };

    const [formData, setFormData] = useState(initialData || defaultData);

    React.useEffect(() => {
        setFormData(initialData || defaultData);
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Client" : "Add New Client"}
            size="lg"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Client</Button>
                </div>
            }
        >
            <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Client Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        options={[
                            { value: 'tech', label: 'Technology' },
                            { value: 'finance', label: 'Finance' },
                            { value: 'healthcare', label: 'Healthcare' },
                            { value: 'retail', label: 'Retail' },
                            { value: 'other', label: 'Other' }
                        ]}
                    />
                    <SearchableSelect
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        options={COUNTRIES}
                        placeholder="Search country..."
                        className="bg-background" // Optional specific style
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Client Type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        options={[
                            { value: 'Company', label: 'Company' },
                            { value: 'Individual', label: 'Individual' }
                        ]}
                    />
                    <Input
                        label="Tags (comma separated)"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-small font-medium text-text-primary mb-1.5">Description</label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-body ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className="border-t border-border pt-4">
                    <h4 className="text-small font-bold text-text-primary mb-4">Primary Contact</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Name"
                            name="primaryName"
                            value={formData.primaryName}
                            onChange={handleChange}
                        />
                        <Input
                            label="Email"
                            name="primaryEmail"
                            type="email"
                            value={formData.primaryEmail}
                            onChange={handleChange}
                        />
                        <Input
                            label="Phone"
                            name="primaryPhone"
                            value={formData.primaryPhone}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default ClientFormModal;
