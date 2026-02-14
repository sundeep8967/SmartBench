export interface Project {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    address: string;
    timezone: string;
    status: 'Planning' | 'Active' | 'Completed' | 'Archived';
    start_date?: string;
    end_date?: string;
    created_at: string;
    updated_at: string;
}

export interface WorkOrder {
    id: string;
    project_id: string;
    role: string;
    quantity: number;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    start_time: string; // HH:MM:SS
    end_time: string;   // HH:MM:SS
    status: 'Draft' | 'Open' | 'Filled' | 'Completed';
    description?: string;
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    id: string;
    borrower_company_id: string;
    work_order_id: string;
    worker_id: string;
    hourly_rate: number;
    start_date: string;
    end_date: string;
    created_at: string;
    work_order?: WorkOrder; // Joined data
    worker_profile?: any; // Joined data (TODO: Define WorkerProfile type properly)
    worker?: {
        full_name: string;
        email?: string;
    };
}
