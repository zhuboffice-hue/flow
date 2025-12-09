import React from 'react';

const About = () => {
    return (
        <div className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">About FLOW</h1>
                    <p className="text-xl text-text-secondary">
                        Building the operating system for the next generation of companies.
                    </p>
                </div>

                <div className="space-y-20">
                    <section>
                        <h2 className="text-3xl font-bold text-text-primary mb-6">Our Mission</h2>
                        <p className="text-lg text-text-secondary leading-relaxed">
                            To give every small business a clean, powerful workspace to run their entire company — without complexity.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-text-primary mb-6">Our Story</h2>
                        <div className="space-y-4 text-lg text-text-secondary leading-relaxed">
                            <p>
                                FLOW was created after working closely with agencies, freelancers, and startups who used 6–12 tools every day.
                                Work was scattered. Communication was messy. Projects slipped.
                            </p>
                            <p>
                                So we built FLOW — a single platform that organizes work, clients, finances, and operations in one place.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-3xl font-bold text-text-primary mb-8">Our Values</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { title: "Clarity over complexity", desc: "We believe software should be intuitive and get out of your way." },
                                { title: "Speed over features", desc: "A fast tool is a useful tool. We prioritize performance." },
                                { title: "Focus over noise", desc: "We design for deep work, not distraction." },
                                { title: "Real outcomes over vanity metrics", desc: "We care about shipping work, not just tracking it." }
                            ].map((value, i) => (
                                <div key={i} className="bg-surface p-6 rounded-xl border border-border">
                                    <h3 className="text-xl font-bold text-text-primary mb-2">{value.title}</h3>
                                    <p className="text-text-secondary">{value.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default About;
