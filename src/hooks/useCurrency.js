import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CURRENCY_OPTIONS } from '../lib/models'; // Keeping import if needed elsewhere

// Simple static exchange rates (Base: USD)
// Moved outside hook to enforce stability and avoid re-creation
const EXCHANGE_RATES = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'INR': 83.5,
    'AUD': 1.52,
    'CAD': 1.36,
    'SGD': 1.35,
    'JPY': 151.5
};

export const useCurrency = () => {
    const { currentUser } = useAuth();
    const [currency, setCurrency] = useState(currentUser?.currency || 'USD');

    // Subscribe to company settings for real-time updates
    useEffect(() => {
        if (!currentUser?.companyId) {
            // Fallback to user preference if no company
            if (currentUser?.currency && currentUser.currency !== currency) {
                setCurrency(currentUser.currency);
            }
            return;
        }

        const unsub = onSnapshot(doc(db, 'companies', currentUser.companyId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.currency && data.currency !== currency) {
                    setCurrency(data.currency);
                }
            }
        });

        return () => unsub();
    }, [currentUser?.companyId, currentUser?.currency]); // 'currency' dependency removed to avoid potential loop, logic handles check

    /**
     * Converts an amount from source currency to company currency
     */
    const convertAmount = useCallback((amount, fromCurrency) => {
        if (amount === undefined || amount === null) return 0;
        let finalAmount = Number(amount);
        if (isNaN(finalAmount)) return 0;

        let targetCurrency = currency;

        // Default to USD if no source currency provided (handles legacy data)
        const sourceCurrency = fromCurrency || 'USD';

        if (sourceCurrency !== targetCurrency) {
            const rateFrom = EXCHANGE_RATES[sourceCurrency] || 1;
            const rateTo = EXCHANGE_RATES[targetCurrency] || 1;
            // Convert to USD first (Amount / RateFrom), then to Target ( * RateTo)
            const amountInUSD = finalAmount / rateFrom;
            finalAmount = amountInUSD * rateTo;
        }
        return finalAmount;
    }, [currency]);

    /**
     * Formats a number into the company's preferred currency string
     */
    const formatCurrency = useCallback((amount, fromCurrency = null) => {
        const finalAmount = convertAmount(amount, fromCurrency);
        if (finalAmount === undefined) return '-';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        }).format(finalAmount);
    }, [currency, convertAmount]);

    /**
     * Helper to get the currency symbol
     */
    const getCurrencySymbol = useCallback(() => {
        return (0).toLocaleString('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
    }, [currency]);

    return {
        currency,
        formatCurrency,
        convertAmount,
        getCurrencySymbol
    };
};
