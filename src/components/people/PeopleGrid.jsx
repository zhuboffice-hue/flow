import React from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const PeopleGrid = ({ employees, onProfileClick, onMessageClick }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map(employee => (
                <div
                    key={employee.id}
                    className="bg-surface rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center"
                    onClick={() => onProfileClick(employee.id)}
                >
                    <div className="relative mb-4">
                        <Avatar src={employee.avatar} fallback={employee.name.charAt(0)} size="lg" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${employee.availability === 'Available' ? 'bg-success' :
                            employee.availability === 'Busy' ? 'bg-danger' : 'bg-warning'
                            }`}></span>
                    </div>

                    <h3 className="font-bold text-text-primary text-lg mb-1">{employee.name}</h3>
                    <p className="text-text-secondary text-sm mb-3">{employee.role}</p>

                    <div className="flex gap-2 mb-4">
                        <Badge variant="secondary">{employee.department}</Badge>
                        {employee.workload > 80 && <Badge variant="danger">Overloaded</Badge>}
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                            className={`h-full rounded-full ${employee.workload > 80 ? 'bg-danger' :
                                employee.workload > 50 ? 'bg-warning' : 'bg-success'
                                }`}
                            style={{ width: `${employee.workload}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between w-full text-xs text-text-secondary mb-4">
                        <span>Workload</span>
                        <span>{employee.workload}%</span>
                    </div>

                    <div className="flex gap-2 w-full mt-auto">
                        <Button variant="secondary" className="flex-1" onClick={(e) => { e.stopPropagation(); onMessageClick(employee); }}>
                            <Icon name="MessageSquare" size={16} />
                        </Button>
                        <Button variant="secondary" className="flex-1" onClick={(e) => { e.stopPropagation(); onProfileClick(employee.id); }}>
                            Profile
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PeopleGrid;
