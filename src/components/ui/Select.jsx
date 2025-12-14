import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import { cn } from '../../lib/utils';

const Select = ({ value, onChange, options = [], placeholder = "Select...", className = "", label, error, name }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        // Mock event object for compatibility with standard onChange handlers
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className="w-full" ref={selectRef}>
            {label && (
                <label className="block text-small font-medium text-text-primary mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-danger focus:ring-danger",
                        className
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className={!selectedOption ? "text-text-secondary" : "text-text-primary"}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <Icon name="ChevronDown" size={16} className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-md shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-1">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between",
                                        value === option.value
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-text-primary hover:bg-surface-secondary"
                                    )}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    {option.label}
                                    {value === option.value && <Icon name="Check" size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-small text-danger">{error}</p>
            )}
        </div>
    );
};

export default Select;
