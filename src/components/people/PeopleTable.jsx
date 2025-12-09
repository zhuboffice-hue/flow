import React from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const PeopleTable = ({ employees, onProfileClick, onMessageClick }) => {
    return (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-surface-secondary border-b border-border text-text-secondary font-medium">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Workload</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {employees.map(employee => (
                        <tr
                            key={employee.id}
                            className="hover:bg-background transition-colors cursor-pointer"
                            onClick={() => onProfileClick(employee.id)}
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar src={employee.avatar} fallback={employee.name.charAt(0)} size="sm" />
                                    <div>
                                        <p className="font-medium text-text-primary">{employee.name}</p>
                                        <p className="text-xs text-text-secondary">{employee.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-text-secondary">{employee.role}</td>
                            <td className="px-6 py-4 text-text-secondary">{employee.department}</td>
                            <td className="px-6 py-4">
                                <Badge variant={
                                    employee.availability === 'Available' ? 'success' :
                                        employee.availability === 'Busy' ? 'danger' : 'warning'
                                }>
                                    {employee.availability}
                                </Badge>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${employee.workload > 80 ? 'bg-danger' :
                                                employee.workload > 50 ? 'bg-warning' : 'bg-success'
                                                }`}
                                            style={{ width: `${employee.workload}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-text-secondary">{employee.workload}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onMessageClick(employee); }} title="Message">
                                        <Icon name="MessageSquare" size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* Edit */ }}>
                                        <Icon name="MoreHorizontal" size={16} />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PeopleTable;
