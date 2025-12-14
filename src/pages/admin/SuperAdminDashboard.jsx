import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Note: Only works if logged in as Admin and creating secondary auth, or using secondary app instance for admin actions. For now we simulate invite link generation or simple storage.
import { db, auth } from '../../lib/firebase';
import ThreePaneLayout from '../../components/layout/ThreePaneLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState({
        totalCompanies: 0,
        totalUsers: 0,
        totalRevenue: 0,
        activeCompanies: 0
    });
    const [loading, setLoading] = useState(true);
    // Modal & Form State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [inviteLink, setInviteLink] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        plan: 'free',
        adminName: '',
        adminEmail: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [companies, setCompanies] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [planData, setPlanData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Companies
            const qCompanies = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
            const companiesSnap = await getDocs(qCompanies);
            const companiesList = companiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 2. Fetch Users (for aggregation)
            const qUsers = query(collection(db, 'users')); // Fetch specific fields if possible to save bandwidth
            const usersSnap = await getDocs(qUsers);
            const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 3. Aggregate Data
            const companyStats = companiesList.map(comp => {
                const companyUsers = usersList.filter(u => u.companyId === comp.id);
                return {
                    ...comp,
                    userCount: companyUsers.length,
                    // Mock usage for now
                    storageUsed: Math.floor(Math.random() * 80) + 10
                };
            });

            // 4. Calculate Global Stats
            const totalRevenue = companiesList.reduce((acc, curr) => {
                const price = curr.plan === 'enterprise' ? 99 : curr.plan === 'pro' ? 29 : 0;
                return acc + price;
            }, 0);

            setStats({
                totalCompanies: companiesList.length,
                totalUsers: usersList.length,
                totalRevenue: totalRevenue,
                activeCompanies: companiesList.filter(c => c.status === 'Active').length
            });

            // 5. Prepare Chart Data
            // Growth (Mocking monthly data based on creation date or random for demo if date missing)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const mockGrowth = months.map(m => ({
                name: m,
                companies: Math.floor(Math.random() * 10) + companiesList.length // Mock cumulative
            }));
            setGrowthData(mockGrowth);

            const pData = [
                { name: 'Free', value: companiesList.filter(c => c.plan === 'free').length },
                { name: 'Pro', value: companiesList.filter(c => c.plan === 'pro').length },
                { name: 'Enterprise', value: companiesList.filter(c => c.plan === 'enterprise').length },
            ];
            setPlanData(pData);

            setCompanies(companyStats);

        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            const companyRef = await addDoc(collection(db, 'companies'), {
                name: formData.name,
                industry: formData.industry,
                plan: formData.plan,
                createdAt: serverTimestamp(),
                status: 'Active'
            });

            const link = `${window.location.origin}/signup?companyId=${companyRef.id}&email=${encodeURIComponent(formData.adminEmail)}&name=${encodeURIComponent(formData.adminName)}&role=Admin`;
            setInviteLink(link);

            const subject = encodeURIComponent(`Admin Invite for ${formData.name}`);
            const body = encodeURIComponent(`Hi ${formData.adminName},\n\nYou have been invited to manage ${formData.name} on Flow.\n\nPlease set up your admin account using this link:\n${link}\n\nBest,\nFlow Super Admin`);
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${formData.adminEmail}&su=${subject}&body=${body}`, '_blank');

            fetchDashboardData();
        } catch (error) {
            console.error("Error creating company:", error);
            alert("Failed to create company");
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (window.confirm("Are you sure you want to delete this company?")) {
            try {
                await deleteDoc(doc(db, 'companies', companyId));
                setStats(prev => ({ ...prev, totalCompanies: prev.totalCompanies - 1 })); // Optimistic update
                fetchDashboardData();
            } catch (error) {
                console.error("Error deleting company:", error);
            }
        }
    };

    const openEditModal = (company) => {
        setEditingCompany(company);
        setIsEditModalOpen(true);
    };

    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        try {
            const companyRef = doc(db, 'companies', editingCompany.id);
            await updateDoc(companyRef, {
                name: editingCompany.name,
                industry: editingCompany.industry,
                plan: editingCompany.plan
            });
            setIsEditModalOpen(false);
            setEditingCompany(null);
            fetchDashboardData();
        } catch (error) {
            console.error("Error updating company:", error);
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.industry && company.industry.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <ThreePaneLayout hideSidebar={true}>
            <div className="p-4 md:p-6 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                        <p className="text-sm md:text-base text-gray-500">Manage companies and system wide settings.</p>
                    </div>
                    <Button onClick={() => { setIsCreateModalOpen(true); setInviteLink(''); }}>
                        <Icon name="Plus" size={16} className="mr-2" />
                        Create Company
                    </Button>
                </div>

                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-text-secondary text-sm font-medium">Total Companies</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-1">{stats.totalCompanies}</h3>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Icon name="Briefcase" size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-green-600">
                            <Icon name="ArrowUp" size={12} className="mr-1" />
                            <span className="font-medium">12%</span>
                            <span className="text-text-secondary ml-1">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-text-secondary text-sm font-medium">Total Users</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-1">{stats.totalUsers}</h3>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Icon name="Users" size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-green-600">
                            <Icon name="ArrowUp" size={12} className="mr-1" />
                            <span className="font-medium">8%</span>
                            <span className="text-text-secondary ml-1">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-text-secondary text-sm font-medium">Monthly Revenue</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-1">${stats.totalRevenue}</h3>
                            </div>
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <Icon name="DollarSign" size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-text-secondary">
                            <span>Estimated based on plans</span>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-text-secondary text-sm font-medium">System Health</p>
                                <h3 className="text-2xl font-bold text-green-600 mt-1">99.8%</h3>
                            </div>
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Icon name="Activity" size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-text-secondary">
                            <span>All systems operational</span>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-surface p-6 rounded-lg border border-border shadow-sm">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Company Growth</h3>
                        <div className="h-64 w-full" style={{ width: '99%', minWidth: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="companies" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompanies)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
                        <h3 className="text-lg font-bold text-text-primary mb-6">Plan Distribution</h3>
                        <div className="h-64 w-full flex justify-center" style={{ width: '99%', minWidth: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {planData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#94A3B8', '#3B82F6', '#8B5CF6'][index % 3]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            {planData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-sm text-text-secondary">
                                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-slate-400' : index === 1 ? 'bg-blue-500' : 'bg-violet-500'}`}></div>
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Companies Table */}
                <div className="bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-primary">Registered Companies</h3>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Input
                                placeholder="Search companies..."
                                className="w-full md:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button variant="outline" size="sm"><Icon name="Filter" size={16} /> Filter</Button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-text-secondary">Loading analytics...</div>
                    ) : (
                        <Table
                            columns={[
                                {
                                    key: 'name',
                                    header: 'Company',
                                    cell: (_, row) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {row.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-text-primary">{row.name}</div>
                                                <div className="text-xs text-text-secondary">{row.industry || 'Tech'}</div>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'users',
                                    header: 'Users',
                                    cell: (_, row) => (
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {[...Array(Math.min(3, row.userCount || 1))].map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-600">U</div>
                                                ))}
                                                {(row.userCount || 0) > 3 && (
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-500">+{row.userCount - 3}</div>
                                                )}
                                            </div>
                                            <span className="text-sm text-text-secondary">{row.userCount || 0} total</span>
                                        </div>
                                    )
                                },
                                {
                                    key: 'plan',
                                    header: 'Plan',
                                    cell: (_, row) => (
                                        <Badge variant={row.plan === 'enterprise' ? 'default' : row.plan === 'pro' ? 'secondary' : 'outline'}>
                                            {row.plan || 'Free'}
                                        </Badge>
                                    )
                                },
                                {
                                    key: 'usage',
                                    header: 'Storage',
                                    cell: (_, row) => (
                                        <div className="w-32">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-text-secondary">{row.storageUsed || 0}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${row.storageUsed || 0}%` }}></div>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    key: 'status',
                                    header: 'Status',
                                    accessor: 'status',
                                    cell: (_, row) => <Badge variant={row.status === 'Active' ? 'success' : 'warning'}>{row.status}</Badge>
                                },
                                {
                                    key: 'actions',
                                    header: '',
                                    cell: (_, row) => (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(row)} className="p-1 hover:bg-gray-100 rounded text-text-secondary hover:text-primary">
                                                <Icon name="Edit" size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteCompany(row.id)} className="p-1 hover:bg-red-50 rounded text-text-secondary hover:text-red-600">
                                                <Icon name="Trash2" size={16} />
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            data={filteredCompanies}
                        />
                    )}
                </div>

                {/* Create Company Modal (Simple inline overlay for now) */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-bold mb-4">Create New Company</h2>

                            {!inviteLink ? (
                                <form onSubmit={handleCreateCompany} className="space-y-4">
                                    <Input
                                        label="Company Name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Industry"
                                        value={formData.industry}
                                        onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md p-2"
                                            value={formData.plan}
                                            onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <h3 className="text-sm font-medium mb-3 text-gray-900">Initial Admin</h3>
                                        <Input
                                            label="Admin Name"
                                            value={formData.adminName}
                                            onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Admin Email"
                                            type="email"
                                            value={formData.adminEmail}
                                            onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 mt-6">
                                        <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                        <Button type="submit">Create & Generate Invite</Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                                        <p className="font-bold flex items-center gap-2">
                                            <Icon name="Check" size={16} />
                                            Company Created!
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        We've opened a Gmail draft for you. You can also copy the link below and share it with <strong>{formData.adminName}</strong> to let them sign up.
                                    </p>
                                    <div className="p-3 bg-gray-100 rounded-md border border-gray-200 break-all text-sm font-mono select-all">
                                        {inviteLink}
                                    </div>
                                    <div className="flex justify-end">
                                        <Button onClick={() => setIsCreateModalOpen(false)}>Close</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Edit Company Modal */}
                {isEditModalOpen && editingCompany && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-bold mb-4">Edit Company</h2>
                            <form onSubmit={handleUpdateCompany} className="space-y-4">
                                <Input
                                    label="Company Name"
                                    value={editingCompany.name}
                                    onChange={e => setEditingCompany({ ...editingCompany, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Industry"
                                    value={editingCompany.industry}
                                    onChange={e => setEditingCompany({ ...editingCompany, industry: e.target.value })}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md p-2"
                                        value={editingCompany.plan}
                                        onChange={e => setEditingCompany({ ...editingCompany, plan: e.target.value })}
                                    >
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ThreePaneLayout>
    );
};

export default SuperAdminDashboard;
