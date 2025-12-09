import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/ui/Icon';
import { doc, updateDoc, getDoc, collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const PlanCard = ({ name, price, features, current, onSelect, loading }) => (
    <div className={`p-6 rounded-lg border ${current ? 'border-primary bg-primary/5' : 'border-border bg-surface'} flex flex-col`}>
        <div className="mb-4">
            <h4 className="text-lg font-bold text-text-primary">{name}</h4>
            <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-text-primary">${price}</span>
                <span className="text-sm text-text-secondary">/month</span>
            </div>
        </div>
        <ul className="space-y-3 mb-6 flex-1">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                    <Icon name="Check" size={16} className="text-primary" />
                    {feature}
                </li>
            ))}
        </ul>
        <button
            onClick={onSelect}
            disabled={current || loading}
            className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${current
                    ? 'bg-primary/10 text-primary cursor-default'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
        >
            {current ? 'Current Plan' : 'Upgrade'}
        </button>
    </div>
);

const BillingSettings = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentPlan, setCurrentPlan] = useState('free');
    const [success, setSuccess] = useState('');
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (currentUser?.companyId) {
                const companyDoc = await getDoc(doc(db, 'companies', currentUser.companyId));
                if (companyDoc.exists()) {
                    setCurrentPlan(companyDoc.data().plan || 'free');
                }
            }
        };
        fetchSubscription();

        // Fetch payment methods from subcollection
        if (currentUser?.companyId) {
            const q = query(collection(db, 'companies', currentUser.companyId, 'paymentMethods'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPaymentMethods(methods);
            });
            return () => unsubscribe();
        }
    }, [currentUser]);

    const handleUpgrade = async (plan) => {
        if (!currentUser?.companyId) return;
        if (window.confirm(`Are you sure you want to switch to the ${plan} plan?`)) {
            setLoading(true);
            try {
                const companyRef = doc(db, 'companies', currentUser.companyId);
                await updateDoc(companyRef, { plan: plan });
                setCurrentPlan(plan);
                setSuccess(`Successfully switched to ${plan} plan!`);
                setTimeout(() => setSuccess(''), 3000);
            } catch (error) {
                console.error("Error updating plan:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddPaymentMethod = async (e) => {
        e.preventDefault();
        if (!currentUser?.companyId) return;

        // Mock adding a card - in a real app, this would integrate with Stripe/etc.
        const newCard = {
            type: 'Mastercard',
            last4: Math.floor(1000 + Math.random() * 9000).toString(),
            expiry: '01/28',
            isDefault: paymentMethods.length === 0,
            createdAt: new Date()
        };

        try {
            await addDoc(collection(db, 'companies', currentUser.companyId, 'paymentMethods'), newCard);
            setIsAddPaymentModalOpen(false);
            setSuccess('Payment method added successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error("Error adding payment method:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface p-6 rounded-lg border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-6">Subscription Plan</h3>

                {success && (
                    <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md text-sm flex items-center gap-2">
                        <Icon name="CheckCircle" size={16} />
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PlanCard
                        name="Free"
                        price="0"
                        features={['Up to 5 team members', 'Basic Analytics', '1GB Storage']}
                        current={currentPlan === 'free'}
                        onSelect={() => handleUpgrade('free')}
                        loading={loading}
                    />
                    <PlanCard
                        name="Pro"
                        price="29"
                        features={['Up to 20 team members', 'Advanced Analytics', '10GB Storage', 'Priority Support']}
                        current={currentPlan === 'pro'}
                        onSelect={() => handleUpgrade('pro')}
                        loading={loading}
                    />
                    <PlanCard
                        name="Enterprise"
                        price="99"
                        features={['Unlimited team members', 'Custom Reporting', 'Unlimited Storage', 'Dedicated Account Manager']}
                        current={currentPlan === 'enterprise'}
                        onSelect={() => handleUpgrade('enterprise')}
                        loading={loading}
                    />
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-text-primary">Payment Method</h3>
                    <button
                        onClick={() => setIsAddPaymentModalOpen(true)}
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                    >
                        + Add Method
                    </button>
                </div>
                <div className="space-y-4">
                    {paymentMethods.length === 0 ? (
                        <p className="text-text-secondary text-sm">No payment methods added.</p>
                    ) : (
                        paymentMethods.map(method => (
                            <div key={method.id} className="flex items-center gap-4 p-4 border border-border rounded-md">
                                <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-500">
                                    {method.type}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">•••• •••• •••• {method.last4}</p>
                                    <p className="text-xs text-text-secondary">Expires {method.expiry}</p>
                                </div>
                                {method.isDefault && (
                                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Default</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-6">Billing History</h3>
                <table className="w-full text-sm text-left">
                    <thead className="text-text-secondary border-b border-border">
                        <tr>
                            <th className="py-2">Date</th>
                            <th className="py-2">Description</th>
                            <th className="py-2">Amount</th>
                            <th className="py-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-text-primary">
                        <tr className="border-b border-border last:border-0">
                            <td className="py-3">Oct 1, 2023</td>
                            <td className="py-3">Pro Plan - Monthly</td>
                            <td className="py-3">$29.00</td>
                            <td className="py-3 text-right text-green-600">Paid</td>
                        </tr>
                        <tr className="border-b border-border last:border-0">
                            <td className="py-3">Sep 1, 2023</td>
                            <td className="py-3">Pro Plan - Monthly</td>
                            <td className="py-3">$29.00</td>
                            <td className="py-3 text-right text-green-600">Paid</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Add Payment Method Modal */}
            {isAddPaymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Add Payment Method</h3>
                        <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-text-secondary block mb-1">Card Number</label>
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-3 py-2 bg-background border border-border rounded-md" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-text-secondary block mb-1">Expiry Date</label>
                                    <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 bg-background border border-border rounded-md" required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text-secondary block mb-1">CVC</label>
                                    <input type="text" placeholder="123" className="w-full px-3 py-2 bg-background border border-border rounded-md" required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddPaymentModalOpen(false)}
                                    className="px-4 py-2 text-text-secondary hover:text-text-primary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                                >
                                    Add Card
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingSettings;
