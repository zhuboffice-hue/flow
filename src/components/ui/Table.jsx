import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import Icon from './Icon';
import Checkbox from './Checkbox';
import Button from './Button';

const Table = ({
    columns,
    data,
    onRowClick,
    selectable = false,
    actions
}) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedRows, setSelectedRows] = useState([]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);

    const toggleSelectAll = () => {
        if (selectedRows.length === data.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(data.map(item => item.id));
        }
    };

    const toggleSelectRow = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-small">
                <thead className="bg-gray-50 border-b border-border">
                    <tr>
                        {selectable && (
                            <th className="w-10 px-4 py-3">
                                <Checkbox
                                    checked={selectedRows.length === data.length && data.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                        )}
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={cn(
                                    "px-4 py-3 font-medium text-text-secondary whitespace-nowrap",
                                    col.sortable && "cursor-pointer hover:text-text-primary select-none"
                                )}
                                onClick={() => col.sortable && handleSort(col.key)}
                            >
                                <div className="flex items-center gap-1">
                                    {col.title || col.header}
                                    {col.sortable && sortConfig.key === col.key && (
                                        <Icon
                                            name={sortConfig.direction === 'asc' ? 'ArrowUp' : 'ArrowDown'}
                                            size={14}
                                        />
                                    )}
                                </div>
                            </th>
                        ))}
                        {actions && <th className="px-4 py-3 w-10"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {sortedData.map((row) => (
                        <tr
                            key={row.id}
                            className="hover:bg-gray-50 transition-colors group"
                            onClick={() => onRowClick && onRowClick(row)}
                        >
                            {selectable && (
                                <td className="px-4 py-3">
                                    <Checkbox
                                        checked={selectedRows.includes(row.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleSelectRow(row.id);
                                        }}
                                    />
                                </td>
                            )}
                            {columns.map((col) => {
                                const renderCell = col.render || col.cell;
                                return (
                                    <td key={`${row.id}-${col.key}`} className="px-4 py-3 text-text-primary">
                                        {renderCell ? renderCell(row[col.key], row) : row[col.key]}
                                    </td>
                                );
                            })}
                            {actions && (
                                <td className="px-4 py-3 text-right">
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icon name="MoreHorizontal" size={16} />
                                    </Button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
