import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import Icon from './Icon';

const SearchableSelect = ({
    className,
    label,
    error,
    options = [],
    value,
    onChange, // Expects (e) => where e.target = { name, value } to match existing pattern
    name,
    placeholder = "Select an option",
    required
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Get selected label
    const selectedOption = options.find(opt => opt.value === value);

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
        // Mock event object to match expected API of standard inputs
        const event = {
            target: {
                name,
                value: optionValue
            }
        };
        onChange(event);
        setIsOpen(false);
        setSearchTerm(''); // Clear search on select? Optional.
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            {label && (
                <label className="block text-small font-medium text-text-primary mb-1.5">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}

            <div
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-body ring-offset-background cursor-pointer hover:bg-surface-hover/50",
                    isOpen && "ring-2 ring-primary ring-offset-1 border-primary",
                    error && "border-danger ring-danger",
                    className
                )}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 50);
                }}
            >
                <span className={cn("truncate", !selectedOption && "text-muted")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <Icon name="ChevronDown" size={16} className="text-muted" />
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
                                onClick={(e) => e.stopPropagation()} // Prevent closing
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={cn(
                                        "px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors flex justify-between items-center",
                                        value === opt.value && "bg-primary/5 text-primary font-medium"
                                    )}
                                    onClick={() => handleSelect(opt.value)}
                                >
                                    {opt.label}
                                    {value === opt.value && <Icon name="Check" size={14} />}
                                </div>
                            ))
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

export default SearchableSelect;
