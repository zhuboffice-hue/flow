import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Icon from '../../components/ui/Icon';

const Toggle = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${enabled ? 'bg-primary' : 'bg-gray-200'
            }`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
        />
    </button>
);

const NotificationSettings = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'

    const [notifications, setNotifications] = useState({
        email: {
            marketing: false,
            security: true,
            updates: true,
            comments: true
        },
        push: {
            mentions: true,
            reminders: true,
            newProjects: false
        }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (currentUser) {
                try {
                    const settingsRef = doc(db, 'user_settings', currentUser.uid);
                    const settingsDoc = await getDoc(settingsRef);

                    if (settingsDoc.exists() && settingsDoc.data().notifications) {
                        setNotifications(settingsDoc.data().notifications);
                    }
                } catch (error) {
                    console.error("Error fetching notification settings:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSettings();
    }, [currentUser]);

    const updateSettings = async (newNotifications) => {
        setNotifications(newNotifications);
        setSaveStatus('saving');

        if (currentUser) {
            try {
                const settingsRef = doc(db, 'user_settings', currentUser.uid);
                await setDoc(settingsRef, { notifications: newNotifications }, { merge: true });
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus(''), 2000);
            } catch (error) {
                console.error("Error updating notification settings:", error);
                setSaveStatus('error');
            }
        }
    };

    const toggleEmail = (key) => {
        const newSettings = {
            ...notifications,
            email: { ...notifications.email, [key]: !notifications.email[key] }
        };
        updateSettings(newSettings);
    };

    const togglePush = (key) => {
        const newSettings = {
            ...notifications,
            push: { ...notifications.push, [key]: !notifications.push[key] }
        };
        updateSettings(newSettings);
    };

    if (loading) {
        return <div className="p-6">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end h-6">
                {saveStatus === 'saving' && <span className="text-sm text-text-secondary flex items-center gap-2"><div className="animate-spin h-3 w-3 border-b-2 border-primary rounded-full"></div> Saving...</span>}
                {saveStatus === 'saved' && <span className="text-sm text-green-600 flex items-center gap-2"><Icon name="Check" size={14} /> Saved</span>}
                {saveStatus === 'error' && <span className="text-sm text-red-600 flex items-center gap-2"><Icon name="AlertCircle" size={14} /> Failed to save</span>}
            </div>

            <div className="bg-surface p-6 rounded-lg border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-6">Email Notifications</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-text-primary">Marketing Emails</p>
                            <p className="text-sm text-text-secondary">Receive news, tips, and special offers.</p>
                        </div>
                        <Toggle enabled={notifications.email.marketing} onChange={() => toggleEmail('marketing')} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-text-primary">Security Alerts</p>
                            <p className="text-sm text-text-secondary">Get notified about important security activity.</p>
                        </div>
                        <Toggle enabled={notifications.email.security} onChange={() => toggleEmail('security')} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-text-primary">Product Updates</p>
                            <p className="text-sm text-text-secondary">Stay up to date with the latest features.</p>
                        </div>
                        <Toggle enabled={notifications.email.updates} onChange={() => toggleEmail('updates')} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-text-primary">Comments & Mentions</p>
                            <p className="text-sm text-text-secondary">When someone comments on your tasks or mentions you.</p>
                        </div>
                        <Toggle enabled={notifications.email.comments} onChange={() => toggleEmail('comments')} />
                    </div>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-6">Push Notifications</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-text-primary">Direct Mentions</p>
                            <p className="text-sm text-text-secondary">Notify when you are mentioned in a comment.</p>
                        </div>
                        <Toggle enabled={notifications.push.mentions} onChange={() => togglePush('mentions')} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-text-primary">Task Reminders</p>
                            <p className="text-sm text-text-secondary">Get reminders for upcoming due dates.</p>
                        </div>
                        <Toggle enabled={notifications.push.reminders} onChange={() => togglePush('reminders')} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-text-primary">New Projects</p>
                            <p className="text-sm text-text-secondary">When a new project is created in your team.</p>
                        </div>
                        <Toggle enabled={notifications.push.newProjects} onChange={() => togglePush('newProjects')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
