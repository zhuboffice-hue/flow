import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import Icon from './Icon';

const MultiSelect = ({
    className,
    label,
    error,
    options = [],
    value = [], // Array of selected values
    onChange, // (values) => void
    placeholder = "Select options...",
    required
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (optionValue) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
        // Keep open for multiple selection
        inputRef.current?.focus();
    };

    const handleRemove = (e, valToRemove) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== valToRemove));
    };

    const selectedLabels = options
        .filter(opt => value.includes(opt.value))
        .map(opt => opt.label);

    return (
        <div className="w-full relative" ref={wrapperRef}>
            {label && (
                <label className="block text-small font-medium text-text-primary mb-1.5">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            <div
                className={cn(
                    "flex min-h-[40px] w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-1.5 text-body ring-offset-background cursor-pointer hover:bg-surface-hover/50",
                    isOpen && "ring-2 ring-primary ring-offset-1 border-primary",
                    error && "border-danger ring-danger",
                    className
                )}
                onClick={() => {
                    if (!isOpen) {
                        setIsOpen(true);
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }
                }}
            >
                <div className="flex flex-wrap gap-1.5 flex-1 mr-2">
                    {value.length > 0 ? (
                        options.filter(opt => value.includes(opt.value)).map(opt => (
                            <span
                                key={opt.value}
                                className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full"
                            >
                                {opt.label}
                                <button
                                    type="button"
                                    onClick={(e) => handleRemove(e, opt.value)}
                                    className="hover:text-primary-dark hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                >
                                    <Icon name="X" size={12} />
                                </button>
                            </span>
                        ))
                    ) : (
                        <span className="text-muted py-1">{placeholder}</span>
                    )}
                </div>
                <Icon name="ChevronDown" size={16} className="text-muted shrink-0" />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-surface rounded-md border border-border shadow-lg max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-border sticky top-0 bg-surface">
                        <div className="flex items-center gap-2 px-2 py-1 bg-background rounded-md border border-border">
                            <Icon name="Search" size={14} className="text-muted" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-transparent border-none text-sm focus:outline-none"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = value.includes(opt.value);
                                return (
                                    <div
                                        key={opt.value}
                                        className={cn(
                                            "px-2 py-1.5 text-sm rounded cursor-pointer transition-colors flex justify-between items-center",
                                            isSelected ? "bg-primary/5 text-primary font-medium" : "hover:bg-primary/10 hover:text-primary"
                                        )}
                                        onClick={() => handleSelect(opt.value)}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && <Icon name="Check" size={14} />}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-3 text-center text-xs text-muted">
                                No results found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-1 text-small text-danger">{error}</p>
            )}
        </div>
    );
};

export default MultiSelect;
