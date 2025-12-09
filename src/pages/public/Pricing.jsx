import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';

const PricingCard = ({ title, price, description, features, recommended, ctaText = "Start free" }) => (
    <div className={`relative p-8 rounded-2xl border ${recommended ? 'border-primary shadow-lg scale-105 bg-surface z-10' : 'border-border bg-surface/50'} flex flex-col h-full`}>
        {recommended && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Most Popular
            </div>
        )}
        <div className="mb-8">
            <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
            <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-text-primary">{price}</span>
                {price !== 'Custom' && <span className="text-text-secondary">/user/mo</span>}
            </div>
            <p className="text-text-secondary text-sm">{description}</p>
        </div>

        <div className="flex-1 mb-8">
            <ul className="space-y-4">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                        <Icon name="Check" size={16} className="text-primary mt-1 shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
        </div>

        <Link to={`/signup?plan=${title.toLowerCase()}`} className="block">
            <Button variant={recommended ? 'primary' : 'secondary'} className="w-full">
                {ctaText}
            </Button>
        </Link>
    </div>
);

const Pricing = () => {
    return (
        <div className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">Simple, transparent pricing for growing teams.</h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Choose the plan that fits your workflow. No hidden fees.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    <PricingCard
                        title="Free"
                        price="$0"
                        description="For freelancers & solo creators."
                        features={[
                            "Unlimited clients",
                            "Unlimited projects",
                            "Client portal",
                            "Tasks & files",
                            "Basic invoices"
                        ]}
                    />
                    <PricingCard
                        title="Starter"
                        price="$12"
                        description="Perfect for small teams & agencies."
                        features={[
                            "Everything in Free, plus:",
                            "Team workload",
                            "Advanced tasks & timeline",
                            "Approvals",
                            "Expense tracking",
                            "Proposal builder",
                            "Automations (basic)"
                        ]}
                        recommended
                    />
                    <PricingCard
                        title="Business"
                        price="$25"
                        description="For growing companies."
                        features={[
                            "Everything in Starter, plus:",
                            "Advanced automations",
                            "Profitability dashboards",
                            "Department & roles management",
                            "Custom branding",
                            "Priority support"
                        ]}
                    />
                    <PricingCard
                        title="Enterprise"
                        price="Custom"
                        description="For large teams who need scale."
                        features={[
                            "Unlimited users",
                            "SSO",
                            "Dedicated success manager",
                            "Custom integrations",
                            "SLA guarantees"
                        ]}
                        ctaText="Contact Sales"
                    />
                </div>
            </div>
        </div>
    );
};

export default Pricing;
