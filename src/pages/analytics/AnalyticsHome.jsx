import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/ThreePaneLayout';
import Icon from '../../components/ui/Icon';

const AnalyticsCard = ({ title, icon, description, path, color }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(path)}
            className="bg-surface p-6 rounded-lg border border-border hover:border-primary cursor-pointer transition-all hover:shadow-md group"
        >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                <Icon name={icon} className="text-white" size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-text-secondary">{description}</p>
        </div>
    );
};

const AnalyticsHome = () => {
    const dashboards = [
        {
            title: "Company Dashboard",
            icon: "BarChart2",
            description: "High-level overview of company performance, revenue, and active projects.",
            path: "/app/analytics/company",
            color: "bg-blue-500"
        },
        {
            title: "Team Performance",
            icon: "Users",
            description: "Analyze team productivity, utilization, and task completion rates.",
            path: "/app/analytics/team",
            color: "bg-purple-500"
        },
        {
            title: "Project Analytics",
            icon: "Folder",
            description: "Deep dive into project budgets, milestones, and health scores.",
            path: "/app/analytics/projects",
            color: "bg-orange-500"
        },
        {
            title: "Sales Analytics",
            icon: "TrendingUp",
            description: "Track sales funnel, lead conversion, and revenue forecasts.",
            path: "/app/analytics/sales",
            color: "bg-green-500"
        },
        {
            title: "Finance Analytics",
            icon: "CreditCard",
            description: "Detailed financial reports, cashflow analysis, and profitability.",
            path: "/app/analytics/finance",
            color: "bg-red-500"
        }
    ];

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-h1 font-bold text-text-primary">Analytics Overview</h1>
                    <p className="text-text-secondary">Select a dashboard to view detailed insights.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboards.map((dashboard, index) => (
                        <AnalyticsCard key={index} {...dashboard} />
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default AnalyticsHome;
