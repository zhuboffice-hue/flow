import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import BookDemoModal from '../../components/public/BookDemoModal';

const Hero = ({ onBookDemo }) => (
    <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary tracking-tight mb-6 max-w-4xl mx-auto">
                Run Your Entire Company in One <span className="text-primary">Clean, Powerful Workspace</span>
            </h1>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
                FLOW brings together projects, clients, tasks, files, finances, team performance, and automation — into one beautiful dashboard built for modern businesses.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link to="/pricing">
                    <Button size="lg" className="h-14 px-8 text-lg">Get Started <Icon name="ArrowRight" className="ml-2" /></Button>
                </Link>
                <Button
                    variant="secondary"
                    size="lg"
                    className="h-14 px-8 text-lg"
                    onClick={onBookDemo}
                >
                    Book a Demo
                </Button>
            </div>
            {/* ... rest of Hero ... */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted font-medium uppercase tracking-wider">
                <span>Used by digital agencies</span>
                <span className="hidden sm:inline">•</span>
                <span>Ecommerce teams</span>
                <span className="hidden sm:inline">•</span>
                <span>IT firms</span>
                <span className="hidden sm:inline">•</span>
                <span>Creative studios</span>
            </div>
        </div>
    </section>
);

// ... (FeatureHighlight, WhyFlow, ValueSection, Testimonials remain unchanged) ...
const FeatureHighlight = ({ icon, title, description }) => (
    <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm hover:shadow-md transition-all">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
            <Icon name={icon} size={24} />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary leading-relaxed">{description}</p>
    </div>
);

const WhyFlow = () => (
    <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">The all-in-one operating system</h2>
                <p className="text-lg text-text-secondary">No complexity. No clutter. Just results.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureHighlight
                    icon="KanbanSquare"
                    title="Manage projects from kickoff → delivery"
                    description="Tasks, timelines, approvals, files, revisions — all in one space."
                />
                <FeatureHighlight
                    icon="Users"
                    title="Handle clients without the chaos"
                    description="Client portal, communication logs, and easy approvals."
                />
                <FeatureHighlight
                    icon="DollarSign"
                    title="Track revenue, expenses & profitability"
                    description="Simple finance dashboard + invoices + reminders."
                />
                <FeatureHighlight
                    icon="Zap"
                    title="Automate the repetitive work"
                    description="Triggers, reminders, follow-ups — on autopilot."
                />
                <FeatureHighlight
                    icon="BarChart2"
                    title="See your company’s health at a glance"
                    description="Dashboards for projects, team, sales, and finance."
                />
                <FeatureHighlight
                    icon="ShieldCheck"
                    title="Secure & Scalable"
                    description="Enterprise-grade security with role-based access control."
                />
            </div>
        </div>
    </section>
);

const ValueSection = () => (
    <section className="py-24 bg-surface">
        <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-8">FLOW makes your company work faster</h2>
                    <div className="space-y-6">
                        {[
                            "Reduce client update time by 50%",
                            "Deliver projects 2x faster",
                            "Increase team efficiency with automated workflows",
                            "Improve visibility & accountability across teams"
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="mt-1 bg-success/10 p-1 rounded-full text-success">
                                    <Icon name="Check" size={16} />
                                </div>
                                <p className="text-lg text-text-primary font-medium">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-2xl blur-3xl opacity-50"></div>
                    <div className="relative bg-background border border-border rounded-2xl shadow-2xl p-8">
                        {/* Abstract UI representation */}
                        <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                            <div className="h-8 w-32 bg-gray-200 rounded"></div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                <div className="h-8 w-24 bg-primary rounded"></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-24 bg-gray-50 rounded border border-border p-4">
                                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                            </div>
                            <div className="h-24 bg-gray-50 rounded border border-border p-4">
                                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const Testimonials = () => (
    <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                    <div className="flex gap-1 text-warning mb-4">
                        {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="Star" size={20} fill="currentColor" />)}
                    </div>
                    <p className="text-xl text-text-primary italic mb-6">
                        “FLOW replaced 6 tools for our agency. Projects run smoother, clients stay updated, and finances are finally organized.”
                    </p>
                    <div>
                        <p className="font-bold text-text-primary">Creative Agency</p>
                        <p className="text-sm text-text-secondary">CEO</p>
                    </div>
                </div>
                <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                    <div className="flex gap-1 text-warning mb-4">
                        {[1, 2, 3, 4, 5].map(i => <Icon key={i} name="Star" size={20} fill="currentColor" />)}
                    </div>
                    <p className="text-xl text-text-primary italic mb-6">
                        “The client portal alone is worth it. Approvals went from 5 days to 24 hours.”
                    </p>
                    <div>
                        <p className="font-bold text-text-primary">Ecommerce Media Team</p>
                        <p className="text-sm text-text-secondary">Operations Director</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const CTA = ({ onBookDemo }) => (
    <section className="py-24 bg-surface">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-text-primary mb-6">
                Your company deserves a workspace that just works.
            </h2>
            <p className="text-xl text-text-secondary mb-10">Start using FLOW today.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/pricing">
                    <Button size="lg" className="h-14 px-8 text-lg">Start Free</Button>
                </Link>
                <Button
                    variant="secondary"
                    size="lg"
                    className="h-14 px-8 text-lg"
                    onClick={onBookDemo}
                >
                    Book a Demo
                </Button>
            </div>
        </div>
    </section>
);

const Home = () => {
    const [showDemoModal, setShowDemoModal] = useState(false);

    return (
        <>
            <Hero onBookDemo={() => setShowDemoModal(true)} />
            <WhyFlow />
            <ValueSection />
            <Testimonials />
            <CTA onBookDemo={() => setShowDemoModal(true)} />

            <BookDemoModal
                isOpen={showDemoModal}
                onClose={() => setShowDemoModal(false)}
            />
        </>
    );
};

export default Home;
