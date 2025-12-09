import React from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';

const Contact = () => {
    return (
        <div className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-16">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">Contact Us</h1>
                        <p className="text-xl text-text-secondary mb-10">
                            We're here to help you succeed.
                        </p>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">Support</h3>
                                <a href="mailto:support@flowhq.app" className="text-primary hover:underline flex items-center gap-2">
                                    <Icon name="Mail" size={18} /> support@flowhq.app
                                </a>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">Sales</h3>
                                <a href="mailto:sales@flowhq.app" className="text-primary hover:underline flex items-center gap-2">
                                    <Icon name="Mail" size={18} /> sales@flowhq.app
                                </a>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">Partnerships</h3>
                                <a href="mailto:partners@flowhq.app" className="text-primary hover:underline flex items-center gap-2">
                                    <Icon name="Mail" size={18} /> partners@flowhq.app
                                </a>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">Office</h3>
                                <p className="text-text-secondary flex items-start gap-2">
                                    <Icon name="MapPin" size={18} className="mt-1 shrink-0" />
                                    123 Innovation Dr.<br />
                                    San Francisco, CA 94103
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                        <form className="space-y-6">
                            <Input label="Name" placeholder="Your name" />
                            <Input label="Email" type="email" placeholder="you@company.com" />
                            <Input label="Company" placeholder="Company name" />

                            <div>
                                <label className="block text-small font-medium text-text-primary mb-1.5">
                                    What do you need help with?
                                </label>
                                <select className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-body ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                    <option>General Inquiry</option>
                                    <option>Sales</option>
                                    <option>Support</option>
                                    <option>Partnership</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-small font-medium text-text-primary mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    className="flex min-h-[120px] w-full rounded-md border border-border bg-surface px-3 py-2 text-body ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    placeholder="How can we help?"
                                ></textarea>
                            </div>

                            <Button className="w-full" size="lg">Send Message</Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
