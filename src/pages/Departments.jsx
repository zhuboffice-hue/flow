import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import ThreePaneLayout from '../components/layout/ThreePaneLayout';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import DepartmentFormModal from '../components/people/DepartmentFormModal';
import TeamFormModal from '../components/people/TeamFormModal';

const Departments = () => {
    const { currentUser } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Modals
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [selectedDeptId, setSelectedDeptId] = useState(null); // For creating a team inside a dept

    // Drag State
    const [draggedEmployee, setDraggedEmployee] = useState(null);

    useEffect(() => {
        if (!currentUser?.companyId) return;

        // Fetch Departments
        const qDepts = query(collection(db, 'departments'), where('companyId', '==', currentUser.companyId));
        const unsubscribeDepts = onSnapshot(qDepts, (snap) => {
            setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Fetch Teams
        const qTeams = query(collection(db, 'teams'), where('companyId', '==', currentUser.companyId));
        const unsubscribeTeams = onSnapshot(qTeams, (snap) => {
            setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Fetch Employees
        const qEmployees = query(collection(db, 'employees'), where('companyId', '==', currentUser.companyId));
        const unsubscribeEmployees = onSnapshot(qEmployees, (snap) => {
            setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubscribeDepts();
            unsubscribeTeams();
            unsubscribeEmployees();
        };
    }, [currentUser]);

    // Data Helpers
    const unassignedEmployees = employees.filter(e => {
        const hasDeptId = !!e.departmentId;
        const hasLegacyDept = e.department && departments.some(d => d.name === e.department);
        return !hasDeptId && !hasLegacyDept;
    });

    const getDeptTeams = (deptId) => teams.filter(t => t.departmentId === deptId);

    const getDeptEmployees = (deptId) => {
        const dept = departments.find(d => d.id === deptId);
        return employees.filter(e => {
            const matchesId = e.departmentId === deptId;
            const matchesName = !e.departmentId && dept && e.department === dept.name;
            return (matchesId || matchesName) && !e.teamId;
        });
    };

    const getTeamEmployees = (teamId) => employees.filter(e => e.teamId === teamId);

    // CRUD Handlers
    const handleDeptSubmit = async (data) => {
        try {
            if (editingDept) {
                await updateDoc(doc(db, 'departments', editingDept.id), data);
            } else {
                await addDoc(collection(db, 'departments'), { ...data, companyId: currentUser.companyId });
            }
        } catch (err) { console.error(err); }
    };

    const handleTeamSubmit = async (data) => {
        if (!selectedDeptId) return;
        try {
            await addDoc(collection(db, 'teams'), {
                name: data.name,
                departmentId: selectedDeptId,
                companyId: currentUser.companyId
            });
        } catch (err) { console.error(err); }
    };

    const handleDeleteDept = async (id) => {
        if (confirm("Delete this department?")) await deleteDoc(doc(db, 'departments', id));
    };

    // Drag and Drop Logic
    const handleDragStart = (e, employee) => {
        setDraggedEmployee(employee);
        e.dataTransfer.setData('text/plain', employee.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetType, targetId) => {
        e.preventDefault();
        const employeeId = draggedEmployee?.id;
        if (!employeeId) return;

        try {
            const employeeRef = doc(db, 'employees', employeeId);
            let updates = {};

            if (targetType === 'department') {
                // Determine Department Name for backwards compatibility/Team page filters
                const dept = departments.find(d => d.id === targetId);
                updates = { department: dept.name, departmentId: targetId, teamId: null };
                // Note: Storing department NAME is legacy behavior for Filters, consider migrating filters to IDs later.
                // For now, let's store both if possible, or just the name if 'department' field is used elsewhere as string.
                // In Team.jsx, we filter by e.department === 'Name'. So we must store the Name.
                // But for DnD here we need ID. Let's store BOTH: department (name) and departmentId (id).
            } else if (targetType === 'team') {
                const team = teams.find(t => t.id === targetId);
                const dept = departments.find(d => d.id === team.departmentId);
                updates = { department: dept.name, departmentId: dept.id, teamId: targetId };
            } else if (targetType === 'unassigned') {
                updates = { department: null, departmentId: null, teamId: null };
            }

            await updateDoc(employeeRef, updates);
        } catch (err) {
            console.error("Drop failed", err);
        }
        setDraggedEmployee(null);
    };

    return (
        <ThreePaneLayout className="p-0 h-full overflow-hidden">
            <div className="flex h-full bg-background">
                {/* Sidebar: Unassigned */}
                <div className="w-64 border-r border-border bg-surface flex flex-col">
                    <div className="p-4 border-b border-border">
                        <h3 className="font-semibold text-text-primary">Unassigned</h3>
                        <p className="text-xs text-text-secondary">{unassignedEmployees.length} people</p>
                    </div>
                    <div
                        className="flex-1 overflow-y-auto p-2 space-y-2"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'unassigned')}
                    >
                        {unassignedEmployees.map(emp => (
                            <div
                                key={emp.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, emp)}
                                className="p-3 bg-white border border-border rounded shadow-sm cursor-move hover:border-primary flex items-center gap-2"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                    {emp.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary truncate w-32">{emp.name}</p>
                                    <p className="text-xs text-text-secondary truncate w-32">{emp.role}</p>
                                </div>
                            </div>
                        ))}
                        {unassignedEmployees.length === 0 && (
                            <div className="text-center py-10 text-text-secondary text-sm border-2 border-dashed border-border rounded">
                                Drop here to unassign
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content: Departments */}
                <div className="flex-1 flex flex-col">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-white">
                        <div>
                            <h1 className="text-h2 font-bold text-text-primary">Organization Chart</h1>
                            <p className="text-text-secondary">Drag and drop to organize your teams.</p>
                        </div>
                        <Button onClick={() => { setEditingDept(null); setIsDeptModalOpen(true); }}>
                            <Icon name="Plus" size={16} className="mr-2" /> Add Department
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto p-6 bg-background">
                        <div className="flex gap-6 overflow-x-auto pb-6 min-h-full">
                            {departments.map(dept => (
                                <div
                                    key={dept.id}
                                    className="w-80 flex-shrink-0 flex flex-col bg-surface rounded-lg border border-border shadow-sm h-fit max-h-full"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'department', dept.id)}
                                >
                                    {/* Department Header */}
                                    <div className="p-4 border-b border-border bg-white rounded-t-lg sticky top-0 z-10">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-text-primary">{dept.name}</h3>
                                            <div className="flex gap-1">
                                                <button onClick={() => { setEditingDept(dept); setIsDeptModalOpen(true); }} className="p-1 hover:bg-gray-100 rounded text-text-secondary">
                                                    <Icon name="Edit" size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteDept(dept.id)} className="p-1 hover:bg-gray-100 rounded text-danger">
                                                    <Icon name="Trash2" size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-text-secondary mb-3">{dept.description || 'No description'}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-center"
                                            onClick={() => { setSelectedDeptId(dept.id); setIsTeamModalOpen(true); }}
                                        >
                                            <Icon name="Plus" size={14} className="mr-1" /> Add Team
                                        </Button>
                                    </div>

                                    <div className="p-2 space-y-4 overflow-y-auto">
                                        {/* Teams */}
                                        {getDeptTeams(dept.id).map(team => (
                                            <div
                                                key={team.id}
                                                className="bg-gray-50 border border-border rounded ml-2"
                                                onDragOver={(e) => { e.stopPropagation(); handleDragOver(e); }}
                                                onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'team', team.id); }}
                                            >
                                                <div className="p-2 border-b border-border/50 flex justify-between items-center">
                                                    <span className="font-semibold text-sm text-text-primary">{team.name}</span>
                                                    <span className="text-xs text-text-secondary bg-white px-1 rounded border border-border">{getTeamEmployees(team.id).length}</span>
                                                </div>
                                                <div className="p-2 space-y-1 min-h-[40px]">
                                                    {getTeamEmployees(team.id).map(emp => (
                                                        <div
                                                            key={emp.id}
                                                            draggable
                                                            onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, emp); }}
                                                            className="flex items-center gap-2 p-1.5 bg-white border border-border rounded shadow-sm text-sm cursor-move hover:border-primary"
                                                        >
                                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                                                                {emp.name?.charAt(0)}
                                                            </div>
                                                            <span className="truncate flex-1">{emp.name}</span>
                                                        </div>
                                                    ))}
                                                    {getTeamEmployees(team.id).length === 0 && (
                                                        <div className="text-xs text-center text-text-secondary py-2 border border-dashed border-border rounded">Drop Team Members</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Direct Reports */}
                                        <div className="px-2">
                                            <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Direct Members</p>
                                            <div className="space-y-1 min-h-[60px] border border-dashed border-border rounded p-1 bg-gray-50/50">
                                                {getDeptEmployees(dept.id).map(emp => (
                                                    <div
                                                        key={emp.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, emp)}
                                                        className="flex items-center gap-2 p-2 bg-white border border-border rounded shadow-sm text-sm cursor-move hover:border-primary"
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                                                            {emp.name?.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="truncate font-medium">{emp.name}</p>
                                                            <p className="text-[10px] text-text-secondary truncate">{emp.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {getDeptEmployees(dept.id).length === 0 && (
                                                    <div className="text-xs text-center text-text-secondary py-4">Drop here for direct assignment</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* New Dept Placeholder */}
                            <button
                                onClick={() => { setEditingDept(null); setIsDeptModalOpen(true); }}
                                className="w-80 flex-shrink-0 h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors"
                            >
                                <Icon name="Plus" size={32} className="mb-2" />
                                <span className="font-medium">Add New Department</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <DepartmentFormModal
                    isOpen={isDeptModalOpen}
                    onClose={() => setIsDeptModalOpen(false)}
                    onSubmit={handleDeptSubmit}
                    initialData={editingDept}
                />
                <TeamFormModal
                    isOpen={isTeamModalOpen}
                    onClose={() => setIsTeamModalOpen(false)}
                    onSubmit={handleTeamSubmit}
                    initialData={null}
                />
            </div>
        </ThreePaneLayout>
    );
};

export default Departments;
