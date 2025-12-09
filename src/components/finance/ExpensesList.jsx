import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import AddExpenseModal from './AddExpenseModal';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCurrency } from '../../hooks/useCurrency';

const ExpensesList = () => {
    const { formatCurrency } = useCurrency();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');

    const [expenses, setExpenses] = useState([]);
    const [projects, setProjects] = useState({});

    useEffect(() => {
        // Fetch Expenses
        const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
        const unsubscribeExpenses = onSnapshot(q, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExpenses(expensesData);
        });

        // Fetch Projects
        const unsubscribeProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
            const projectsMap = {};
            snapshot.docs.forEach(doc => {
                projectsMap[doc.id] = doc.data().name;
            });
            setProjects(projectsMap);
        });

        return () => {
            unsubscribeExpenses();
            unsubscribeProjects();
        };
    }, []);

    const filteredExpenses = filterCategory === 'All'
        ? expenses
        : expenses.filter(e => e.category === filterCategory);

    return (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
            {/* Header / Filters */}
            <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {['All', 'Software', 'Contractors', 'Advertising', 'Travel', 'Supplies'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filterCategory === cat
                                ? 'bg-primary text-white'
                                : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Icon name="Plus" size={16} className="mr-2" /> Add Expense
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surface-secondary text-text-secondary font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Vendor</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredExpenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-background transition-colors">
                                <td className="px-6 py-4 text-text-secondary">{expense.date}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full bg-surface-secondary text-xs border border-border">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-text-primary">{expense.vendor}</td>
                                <td className="px-6 py-4 text-text-secondary">{projects[expense.projectId] || '-'}</td>
                                <td className="px-6 py-4 font-medium text-text-primary">
                                    {formatCurrency(expense.amount, expense.currency)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="icon">
                                        <Icon name="MoreHorizontal" size={16} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddExpenseModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
};

export default ExpensesList;
