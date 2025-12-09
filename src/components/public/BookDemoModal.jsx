import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const BookDemoModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Save to Firestore (Leads)
            await addDoc(collection(db, 'leads'), {
                name: formData.name,
                email: formData.email,
                company: formData.company,
                status: 'New',
                source: 'Website Demo Request',
                value: 0,
                createdAt: new Date()
            });

            // 2. Open Gmail Draft
            const subject = encodeURIComponent("Demo Request - " + formData.company);
            const body = encodeURIComponent(
                `Hi Team,\n\nI'm interested in a demo of Flow.\n\nName: ${formData.name}\nCompany: ${formData.company}\nEmail: ${formData.email}\n\nPlease let me know availability.\n\nThanks,`
            );

            // Open in new tab
            window.open(
                `https://mail.google.com/mail/?view=cm&fs=1&to=z3connect.z3connect@gmail.com&su=${subject}&body=${body}`,
                '_blank'
            );

            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting lead:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSubmitted(false);
        setFormData({ name: '', email: '', company: '' });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Book a Demo"
        >
            {submitted ? (
                <div className="text-center py-8 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center text-success">
                        <Icon name="Check" size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-text-primary">Request Sent!</h3>
                        <p className="text-text-secondary mt-2">
                            We've opened your email client to finish sending the request.<br />
                            Our team will get back to you shortly.
                        </p>
                    </div>
                    <Button onClick={handleClose} className="w-full">Close</Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-text-secondary mb-4">
                        Fill out your details to schedule a personalized walkthrough of Flow.
                    </p>

                    <Input
                        label="Full Name"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                    />

                    <Input
                        label="Work Email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@company.com"
                    />

                    <Input
                        label="Company Name"
                        required
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Acme Inc."
                    />

                    <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Processing...' : 'Request Demo'}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default BookDemoModal;
