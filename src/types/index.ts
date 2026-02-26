export interface Project {
    id: string;
    company_id: string;
    name: string;
    project_description?: string;
    address: string;
    timezone: string;
    daily_start_time?: string;
    meeting_location_type?: string;
    meeting_instructions?: string;
    lat?: number;
    lng?: number;
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
    project?: Project;
}

export interface WorkerProfile {
    id: string;
    user_id: string;
    trade?: string;
    skills?: string[];
    years_of_experience?: any;
    certifications?: any;
    languages?: any;
    tools_equipment?: string;
    photo_url?: string;
    home_zip_code?: string;
    lat?: number;
    lng?: number;
    travel_radius_miles?: number;
    earliest_start_time?: string;
    latest_start_time?: string;
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
    worker_profile?: WorkerProfile; // Joined data
    worker?: {
        full_name: string;
        email?: string;
    };
}
