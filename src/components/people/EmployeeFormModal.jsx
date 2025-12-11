import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const EmployeeFormModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const defaultData = {
        name: '',
        email: '',
        role: '',
        department: '',
        phone: '',
        availability: 'Available',
        workload: 0,
        skills: []
    };

    // Helper to parse skills (assuming array of objects) to string for input
    const skillsToString = (skills) => {
        if (!skills) return '';
        return skills.map(s => s.name).join(', ');
    };

    const [formData, setFormData] = useState(defaultData);
    const [skillsString, setSkillsString] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setSkillsString(skillsToString(initialData.skills));
        } else {
            setFormData(defaultData);
            setSkillsString('');
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Process skills string back to array if needed, 
        // generic implemenation: split by comma, trim, and assume basic rating of 3 if new
        // For existing skills, we might want to preserve ratings, but for this simple edit form:
        const processedSkills = skillsString.split(',').map(s => s.trim()).filter(s => s).map(s => {
            const existing = initialData?.skills?.find(ex => ex.name.toLowerCase() === s.toLowerCase());
            return existing || { name: s, rating: 3 };
        });

        onSubmit({
            ...formData,
            skills: processedSkills,
            workload: parseInt(formData.workload) || 0
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Employee Profile" : "Add New Employee"}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Changes</Button>
                </div>
            }
        >
            <form className="space-y-4">
                <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={true} // Usually email is immutable or handled essentially
                        helperText="Email cannot be changed directly"
                    />
                    <Input
                        label="Phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        options={[
                            { value: 'Admin', label: 'Admin' },
                            { value: 'Editor', label: 'Editor' },
                            { value: 'Viewer', label: 'Viewer' },
                            { value: 'Manager', label: 'Manager' },
                            { value: 'Developer', label: 'Developer' },
                            { value: 'Designer', label: 'Designer' }
                        ]}
                    />
                    <Select
                        label="Department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        options={[
                            { value: 'Engineering', label: 'Engineering' },
                            { value: 'Design', label: 'Design' },
                            { value: 'Product', label: 'Product' },
                            { value: 'Marketing', label: 'Marketing' },
                            { value: 'Sales', label: 'Sales' },
                            { value: 'HR', label: 'HR' }
                        ]}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Availability"
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        options={[
                            { value: 'Available', label: 'Available' },
                            { value: 'Busy', label: 'Busy' },
                            { value: 'Away', label: 'Away' },
                            { value: 'Offline', label: 'Offline' }
                        ]}
                    />
                    <Input
                        label="Workload (%)"
                        name="workload"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.workload}
                        onChange={handleChange}
                    />
                </div>

                <Input
                    label="Skills (comma separated)"
                    value={skillsString}
                    onChange={(e) => setSkillsString(e.target.value)}
                    placeholder="React, Node.js, UI Design..."
                />

            </form>
        </Modal>
    );
};

export default EmployeeFormModal;
