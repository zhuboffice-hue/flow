import React, { useState } from 'react';
import Icon from '../../components/ui/Icon';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-border last:border-0">
            <button
                className="w-full flex items-center justify-between py-6 text-left focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-lg font-medium text-text-primary">{question}</span>
                <Icon
                    name="ChevronDown"
                    className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    size={20}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
            >
                <p className="text-text-secondary leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

const FAQ = () => {
    const faqs = [
        {
            question: "What is FLOW?",
            answer: "FLOW is an all‑in‑one company management system for small businesses, agencies, and startups. It combines project management, CRM, finance, and team collaboration into one platform."
        },
        {
            question: "Do I need technical skills?",
            answer: "No — FLOW is extremely simple and user-friendly. We designed it to be intuitive for anyone to use without training."
        },
        {
            question: "Can I onboard my team easily?",
            answer: "Yes, inviting your team takes less than 30 seconds. You can assign roles and permissions instantly."
        },
        {
            question: "Does FLOW support clients?",
            answer: "Yes — with a powerful client portal. You can share projects, files, and get approvals directly from your clients in a branded interface."
        },
        {
            question: "Can I cancel anytime?",
            answer: "Absolutely. No long contracts, no hidden fees. You can cancel your subscription at any time from your settings."
        }
    ];

    return (
        <div className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">Frequently Asked Questions</h1>
                    <p className="text-xl text-text-secondary">
                        Everything you need to know about FLOW.
                    </p>
                </div>

                <div className="bg-surface rounded-2xl border border-border px-8">
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
