import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ThreePaneLayout from '../../components/layout/ThreePaneLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import MessageModal from '../../components/messaging/MessageModal';
import EmployeeFormModal from '../../components/people/EmployeeFormModal';

const EmployeeProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');
    const [loading, setLoading] = useState(true);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'employees', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setEmployee({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching employee:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id]);

    const handleUpdateProfile = async (updatedData) => {
        try {
            const docRef = doc(db, 'employees', id);
            // Only update specific fields to avoid overwriting metadata if any
            await updateDoc(docRef, {
                name: updatedData.name,
                phone: updatedData.phone,
                role: updatedData.role,
                department: updatedData.department,
                availability: updatedData.availability,
                workload: updatedData.workload,
                skills: updatedData.skills,
                allowedModules: updatedData.allowedModules || []
            });
            setEmployee(prev => ({ ...prev, ...updatedData }));
            // Optional: show toast
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
    };

    const handleDeactivate = async () => {
        if (!window.confirm("Are you sure you want to deactivate this employee? They will lose access to the system.")) return;

        try {
            const docRef = doc(db, 'employees', id);
            await updateDoc(docRef, {
                status: 'Inactive',
                availability: 'Offline'
            });
            setEmployee(prev => ({ ...prev, status: 'Inactive', availability: 'Offline' }));
            alert("Employee deactivated successfully.");
            navigate('/app/team');
        } catch (error) {
            console.error("Error deactivating employee:", error);
            alert("Failed to deactivate employee.");
        }
    };

    if (loading) return <ThreePaneLayout><div className="p-6">Loading...</div></ThreePaneLayout>;
    if (!employee) return <ThreePaneLayout><div className="p-6">Employee not found</div></ThreePaneLayout>;

    return (
        <ThreePaneLayout>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="bg-surface border-b border-border p-6">
                    <div className="flex items-start justify-between mb-6">
                        <Button variant="ghost" onClick={() => navigate('/app/team')}>
                            <Icon name="ArrowLeft" size={16} className="mr-2" /> Back to Team
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setIsMessageModalOpen(true)}
                                title="Send Message"
                            >
                                Message
                            </Button>
                            <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
                            <Button variant="danger" onClick={handleDeactivate}>Deactivate</Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <Avatar src={employee.avatar} fallback={employee.name.charAt(0)} size="xl" className="w-24 h-24 text-2xl" />
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary mb-1">{employee.name}</h1>
                            <div className="flex items-center gap-3 text-text-secondary mb-3">
                                <div className="flex items-center gap-1">
                                    <Icon name="Briefcase" size={14} />
                                    <span>{employee.role}</span>
                                </div>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <Icon name="Users" size={14} />
                                    <span>{employee.department}</span>
                                </div>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <Icon name="MapPin" size={14} />
                                    <span>Remote</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant={
                                    employee.availability === 'Available' ? 'success' :
                                        employee.availability === 'Busy' ? 'danger' : 'warning'
                                }>
                                    {employee.availability}
                                </Badge>
                                <Badge variant="secondary">Workload: {employee.workload}%</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border px-6">
                    <div className="flex gap-6">
                        {['Overview', 'Skills', 'Workload', 'Performance'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-surface-secondary/30">
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-surface p-6 rounded-lg border border-border">
                                <h3 className="font-bold text-lg mb-4">Contact Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-text-secondary uppercase font-semibold">Email</label>
                                        <p className="text-text-primary">{employee.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary uppercase font-semibold">Phone</label>
                                        <p className="text-text-primary">{employee.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary uppercase font-semibold">Joined</label>
                                        <p className="text-text-primary">{employee.joinedAt ? new Date(employee.joinedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-surface p-6 rounded-lg border border-border">
                                <h3 className="font-bold text-lg mb-4">Current Status</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-text-secondary uppercase font-semibold">Availability</label>
                                        <p className="text-text-primary">{employee.availability}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary uppercase font-semibold">Active Projects</label>
                                        <p className="text-text-primary">3 Projects</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Skills' && (
                        <div className="bg-surface p-6 rounded-lg border border-border">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">Skills & Expertise</h3>
                                <Button variant="secondary" size="sm">Add Skill</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {employee.skills && employee.skills.length > 0 ? (
                                    employee.skills.map((skill, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-background rounded border border-border">
                                            <span className="font-medium">{skill.name}</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Icon
                                                        key={star}
                                                        name="Star"
                                                        size={14}
                                                        className={star <= skill.rating ? "text-warning fill-warning" : "text-gray-300"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-text-secondary italic">No skills listed yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Workload' && (
                        <div className="bg-surface p-6 rounded-lg border border-border">
                            <h3 className="font-bold text-lg mb-4">Workload Overview</h3>
                            <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-text-secondary">
                                Workload Chart Placeholder
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <MessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                recipientId={employee?.uid}
                recipientName={employee?.name}
                recipientEmail={employee?.email}
            />

            <EmployeeFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateProfile}
                initialData={employee}
            />
        </ThreePaneLayout>
    );
};

export default EmployeeProfile;
