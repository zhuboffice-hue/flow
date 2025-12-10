import React, { useState, useEffect } from 'react';
import ThreePaneLayout from '../../components/layout/ThreePaneLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { collection, getDocs, doc, updateDoc, writeBatch, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

const DataRecovery = () => {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [migrating, setMigrating] = useState(null);
    const [syncingUsers, setSyncingUsers] = useState(false);

    // List of collections to scan
    const collections = [
        'clients',
        'projects',
        'invoices',
        'expenses',
        'tasks',
        'leads',
        'employees',
        'files',
        'proposalTemplates',
        'automations',
        'automationLogs',
        'invitations',
        'calendarEvents'
    ];

    const scanData = async () => {
        if (!currentUser?.companyId) return;
        setScanning(true);
        const newStats = {};

        try {
            for (const colName of collections) {
                // Fetch ALL docs (this is expensive in prod but necessary for recovery)
                // In a real app we might need an index or admin SDK, but for client-side recovery:
                const snap = await getDocs(collection(db, colName));

                // Client-side filter for items MISSING companyId
                const orphans = snap.docs.filter(d => {
                    const data = d.data();
                    return !data.companyId;
                });

                newStats[colName] = orphans.length;
            }
            setStats(newStats);
        } catch (error) {
            console.error("Error scanning:", error);
        } finally {
            setScanning(false);
        }
    };

    const migrateCollection = async (colName) => {
        if (!currentUser?.companyId) return;
        setMigrating(colName);

        try {
            const snap = await getDocs(collection(db, colName));
            const orphans = snap.docs.filter(d => !d.data().companyId);

            // Batch updates (max 500 per batch)
            const batchSize = 500;
            let batch = writeBatch(db);
            let count = 0;
            let totalFixed = 0;

            for (const docSnap of orphans) {
                const ref = doc(db, colName, docSnap.id);
                batch.update(ref, { companyId: currentUser.companyId });
                count++;

                if (count === batchSize) {
                    await batch.commit();
                    batch = writeBatch(db);
                    count = 0;
                }
                totalFixed++;
            }

            if (count > 0) {
                await batch.commit();
            }

            // Re-scan to update stats
            await scanData();
            alert(`Migrated ${totalFixed} documents in ${colName}`);

        } catch (error) {
            console.error(`Error migrating ${colName}:`, error);
            alert(`Failed to migrate ${colName}`);
        } finally {
            setMigrating(null);
        }
    };



    const syncUserProfiles = async () => {
        if (!currentUser?.companyId) return;
        setSyncingUsers(true);
        try {
            // 1. Get all employees of this company
            const q = query(collection(db, 'employees'), where('companyId', '==', currentUser.companyId));
            const empSnap = await getDocs(q);

            let fixedCount = 0;
            const batch = writeBatch(db);
            let hasUpdates = false;

            for (const empDoc of empSnap.docs) {
                const emp = empDoc.data();
                if (emp.uid) { // If employee is linked to a user account
                    const userRef = doc(db, 'users', emp.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        // If user has no companyId OR has wrong companyId
                        if (!userData.companyId || userData.companyId !== currentUser.companyId) {
                            batch.update(userRef, {
                                companyId: currentUser.companyId
                            });
                            fixedCount++;
                            hasUpdates = true;
                        }
                    }
                }
            }

            if (hasUpdates) {
                await batch.commit();
            }
            alert(`Synced ${fixedCount} user profiles to your company.`);

        } catch (error) {
            console.error("Error syncing users:", error);
            alert("Failed to sync users.");
        } finally {
            setSyncingUsers(false);
        }
    };

    const migrateAll = async () => {
        for (const col of collections) {
            if (stats[col] > 0) {
                await migrateCollection(col);
            }
        }
    };

    useEffect(() => {
        scanData();
    }, [currentUser]);

    return (
        <ThreePaneLayout>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Data Recovery & Migration</h1>
                    <p className="text-text-secondary">
                        This tool detects data that is missing a "Company ID" (orphaned data) and links it to your current company ({currentUser?.companyId}).
                        Use this if you cannot see your older data after the recent security update.
                    </p>
                </div>

                <div className="bg-surface border border-border rounded-lg overflow-hidden mb-6">
                    <div className="p-4 border-b border-border bg-surface-secondary/30 flex justify-between items-center">
                        <h3 className="font-bold text-text-primary">Scan Results</h3>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={scanData} disabled={scanning || migrating}>
                                <Icon name="RefreshCw" size={16} className={`mr-2 ${scanning ? 'animate-spin' : ''}`} />
                                Re-Scan
                            </Button>
                            <Button onClick={migrateAll} disabled={scanning || migrating}>
                                <Icon name="Database" size={16} className="mr-2" />
                                Fix All
                            </Button>
                        </div>
                    </div>

                    {/* User Sync Tools */}
                    <div className="p-4 bg-primary/5 border-b border-border flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-text-primary">User Access Sync</h4>
                            <p className="text-xs text-text-secondary">If invited members still see an empty portal, run this to force-update their accounts.</p>
                        </div>
                        <Button onClick={syncUserProfiles} disabled={syncingUsers} variant="secondary">
                            {syncingUsers ? 'Syncing...' : 'Sync User Profiles'}
                        </Button>
                    </div>

                    {scanning ? (
                        <div className="p-8 text-center text-text-secondary">
                            <span className="animate-spin inline-block mr-2"><Icon name="Loader" /></span> Scanning database...
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {collections.map(col => (
                                <div key={col} className="p-4 flex justify-between items-center hover:bg-surface-secondary/10">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-md ${stats[col] > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                            <Icon name={stats[col] > 0 ? 'AlertCircle' : 'Check'} size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-primary capitalize">{col}</p>
                                            <p className="text-xs text-text-secondary">
                                                {stats[col] || 0} orphaned items found
                                            </p>
                                        </div>
                                    </div>
                                    {stats[col] > 0 && (
                                        <Button
                                            size="sm"
                                            onClick={() => migrateCollection(col)}
                                            disabled={migrating === col}
                                        >
                                            {migrating === col ? 'Fixing...' : 'Fix'}
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {Object.values(stats).every(v => v === 0) && (
                                <div className="p-8 text-center text-green-600">
                                    <Icon name="CheckCircle" size={48} className="mx-auto mb-2" />
                                    <p className="font-medium">All data is properly linked!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ThreePaneLayout>
    );
};

export default DataRecovery;
