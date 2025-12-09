/**
 * Data Models for Flow Application
 * These structures define the initial state and schema for Firestore documents.
 */

export const PROJECT_TYPES = ['Fixed Price', 'Retainer', 'Time & Materials'];
export const PROJECT_STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Archived'];
export const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD - United States Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound Sterling' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'NZD', label: 'NZD - New Zealand Dollar' },
    { value: 'AED', label: 'AED - United Arab Emirates Dirham' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
    { value: 'DKK', label: 'DKK - Danish Krone' },
    { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
    { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
    { value: 'ILS', label: 'ILS - Israeli New Sheqel' },
    { value: 'KRW', label: 'KRW - South Korean Won' },
    { value: 'MXN', label: 'MXN - Mexican Peso' },
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'NOK', label: 'NOK - Norwegian Krone' },
    { value: 'PHP', label: 'PHP - Philippine Peso' },
    { value: 'PLN', label: 'PLN - Polish Zloty' },
    { value: 'RUB', label: 'RUB - Russian Ruble' },
    { value: 'SAR', label: 'SAR - Saudi Riyal' },
    { value: 'SEK', label: 'SEK - Swedish Krona' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'THB', label: 'THB - Thai Baht' },
    { value: 'TRY', label: 'TRY - Turkish Lira' },
    { value: 'TWD', label: 'TWD - New Taiwan Dollar' },
    { value: 'ZAR', label: 'ZAR - South African Rand' }
];
export const CURRENCIES = CURRENCY_OPTIONS.map(c => c.value);
export const VISIBILITY_OPTIONS = ['Private', 'Client Portal Readonly', 'Client Portal Editable'];

export const initialProjectState = {
    name: '',
    clientId: '',
    type: 'Fixed Price',
    status: 'Planning',
    startDate: null,
    endDate: null,
    budget: 0,
    currency: 'USD',
    managerId: '',
    team: [], // Array of user IDs
    tags: [],
    description: '',
    templateId: null,
    visibility: 'Private',
    progress: 0,
    workflowStages: ['To Do', 'In Progress', 'Review', 'Done'],
    settings: {
        autoCreateTasks: false,
        allowClientComments: true
    }
};

export const initialTaskState = {
    projectId: '',
    title: '',
    description: '',
    assigneeId: null,
    status: 'To Do',
    priority: 'Medium', // Low, Medium, High, Urgent, Critical
    estimateHours: 0,
    actualHours: 0,
    dueDate: null,
    startDate: null,
    tags: [],
    dependencies: [], // Array of task IDs
    attachments: [],
    createdBy: '',
    createdAt: null,
    updatedAt: null
};

export const initialSubtaskState = {
    taskId: '',
    title: '',
    assigneeId: null,
    dueDate: null,
    status: 'pending', // pending, done
    createdAt: null
};

export const initialCommentState = {
    taskId: '',
    authorId: '',
    text: '',
    mentions: [],
    attachments: [],
    createdAt: null
};

export const initialTimeEntryState = {
    taskId: '',
    userId: '',
    startTime: null,
    endTime: null,
    durationHours: 0,
    notes: '',
    createdAt: null
};

export const initialApprovalState = {
    taskId: '',
    requestedBy: '',
    requestedTo: '',
    status: 'pending', // pending, approved, declined
    notes: '',
    requestedAt: null,
    resolvedAt: null
};

export const initialMilestoneState = {
    projectId: '',
    title: '',
    startDate: null,
    endDate: null,
    status: 'Pending', // Pending, Achieved
    description: ''
};
