import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link to="/" className="flex items-center gap-2">
                    <div className="bg-primary rounded-md p-1">
                        <Icon name="Layers" className="text-white" size={20} />
                    </div>
                    <span className="text-h3 font-bold text-text-primary">FLOW</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6 text-small font-medium text-text-secondary">
                    <Link to="/features" className="hover:text-text-primary transition-colors">Features</Link>
                    <Link to="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
                    <Link to="/about" className="hover:text-text-primary transition-colors">About</Link>
                    <Link to="/contact" className="hover:text-text-primary transition-colors">Contact</Link>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <Link to="/login">
                        <Button variant="ghost" size="sm">Log in</Button>
                    </Link>
                    <Link to="/pricing">
                        <Button size="sm">Get Started</Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-text-primary"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <Icon name={isMenuOpen ? "X" : "Menu"} size={24} />
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-border bg-surface px-4 py-4 shadow-lg">
                    <div className="flex flex-col space-y-4 text-center">
                        <Link to="/features" className="text-text-secondary hover:text-text-primary font-medium py-2" onClick={() => setIsMenuOpen(false)}>Features</Link>
                        <Link to="/pricing" className="text-text-secondary hover:text-text-primary font-medium py-2" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
                        <Link to="/about" className="text-text-secondary hover:text-text-primary font-medium py-2" onClick={() => setIsMenuOpen(false)}>About</Link>
                        <Link to="/contact" className="text-text-secondary hover:text-text-primary font-medium py-2" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                        <div className="flex flex-col gap-2 pt-4 border-t border-border">
                            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                <Button variant="ghost" className="w-full">Log in</Button>
                            </Link>
                            <Link to="/pricing" onClick={() => setIsMenuOpen(false)}>
                                <Button className="w-full">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

const Footer = () => (
    <footer className="border-t border-border bg-surface">
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                <div className="col-span-2 lg:col-span-2">
                    <Link to="/" className="flex items-center gap-2 mb-4">
                        <div className="bg-primary rounded-md p-1">
                            <Icon name="Layers" className="text-white" size={20} />
                        </div>
                        <span className="text-h3 font-bold text-text-primary">FLOW</span>
                    </Link>
                    <p className="text-text-secondary text-small max-w-xs mb-6">
                        The all-in-one operating system for small companies. No complexity. No clutter. Just results.
                    </p>
                    <div className="flex gap-4 text-muted">
                        <Icon name="Twitter" size={20} className="hover:text-text-primary cursor-pointer" />
                        <Icon name="Github" size={20} className="hover:text-text-primary cursor-pointer" />
                        <Icon name="Linkedin" size={20} className="hover:text-text-primary cursor-pointer" />
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-text-primary mb-4">Product</h4>
                    <ul className="space-y-2 text-small text-text-secondary">
                        <li><Link to="/features" className="hover:text-text-primary">Features</Link></li>
                        <li><Link to="/pricing" className="hover:text-text-primary">Pricing</Link></li>
                        <li><Link to="/faq" className="hover:text-text-primary">FAQ</Link></li>
                        <li><Link to="/app" className="hover:text-text-primary">Login</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-text-primary mb-4">Company</h4>
                    <ul className="space-y-2 text-small text-text-secondary">
                        <li><Link to="/about" className="hover:text-text-primary">About Us</Link></li>
                        <li><Link to="/contact" className="hover:text-text-primary">Contact</Link></li>
                        <li><Link to="/legal" className="hover:text-text-primary">Privacy Policy</Link></li>
                        <li><Link to="/legal" className="hover:text-text-primary">Terms of Service</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold text-text-primary mb-4">Contact</h4>
                    <ul className="space-y-2 text-small text-text-secondary">
                        <li>support@flowhq.app</li>
                        <li>sales@flowhq.app</li>
                        <li>partners@flowhq.app</li>
                    </ul>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t border-border text-center text-small text-muted">
                © {new Date().getFullYear()} FLOW Inc. All rights reserved.
            </div>
        </div>
    </footer>
);

const PublicLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
