import React from 'react';
import Icon from '../../components/ui/Icon';

const features = [
    {
        title: "Projects & Tasks",
        items: ["Kanban, List, Table, Timeline", "Subtasks, checklists, dependencies", "Approvals & revisions", "File management", "Project templates", "Comment mentions & activity logs"],
        icon: "Folder"
    },
    {
        title: "Client Management",
        items: ["Client profiles & contact book", "Communication log", "Client‑specific projects & documents", "Approvals workflow", "Client-facing portal", "Secure file sharing"],
        icon: "Users"
    },
    {
        title: "People & Teams",
        items: ["Team directory", "Roles & permissions (RBAC)", "Workload & capacity planning", "Performance KPIs (7d / 30d)", "Availability & status"],
        icon: "User"
    },
    {
        title: "Finance",
        items: ["Invoices (create, send, track)", "Invoice templates", "Recurring invoices", "Expenses tracking", "Profitability by project & client", "Cashflow snapshot"],
        icon: "CreditCard"
    },
    {
        title: "Automations",
        items: ["Task reminders", "Invoice reminders", "Client status updates", "Sales follow-ups", "Custom workflows: Trigger → Condition → Action", "Scheduled digests"],
        icon: "Zap"
    },
    {
        title: "Calendar & Scheduling",
        items: ["Unified team calendar", "Project deadlines", "Drag-and-drop rescheduling", "Google Calendar sync (optional)"],
        icon: "Calendar"
    },
    {
        title: "Files & Documents",
        items: ["Folder structure", "Version history", "Approvals", "Final delivery packaging", "Company documents (SOPs, policies)"],
        icon: "FileText"
    },
    {
        title: "Sales & CRM",
        items: ["Lead capture", "Pipeline board", "Follow-up reminders", "Proposal builder", "Lead → Client → Project conversion"],
        icon: "DollarSign"
    },
    {
        title: "Analytics & Dashboards",
        items: ["Company dashboard", "Team dashboard", "Sales dashboard", "Project health overview", "Performance trends"],
        icon: "BarChart2"
    }
];

const Features = () => {
    return (
        <div className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">Everything your company needs — in one platform.</h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Replace your disconnected tools with a single, powerful operating system.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-surface p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <Icon name={feature.icon} size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary">{feature.title}</h3>
                            </div>
                            <ul className="space-y-3">
                                {feature.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-text-secondary">
                                        <Icon name="Check" size={16} className="text-success mt-1 shrink-0" />
                                        <span className="text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;
