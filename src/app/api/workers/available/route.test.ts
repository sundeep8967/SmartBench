import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({
    cookies: () => ({
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
        delete: vi.fn(),
    }),
}));

const mockRpc = vi.fn();

const createChainableMock = (resolvedValue: any) => {
    const chainable: any = {};
    chainable.eq = vi.fn().mockReturnValue(chainable);
    chainable.neq = vi.fn().mockReturnValue(chainable);
    chainable.in = vi.fn().mockReturnValue(chainable);
    chainable.is = vi.fn().mockReturnValue(chainable);
    chainable.limit = vi.fn().mockReturnValue(chainable);
    chainable.order = vi.fn().mockReturnValue(chainable);
    chainable.single = vi.fn().mockResolvedValue(resolvedValue);
    chainable.maybeSingle = vi.fn().mockResolvedValue(resolvedValue);
    // For arrays or regular results without single()
    chainable.then = (resolve: any) => resolve(resolvedValue);
    return chainable;
};

vi.mock('@supabase/ssr', () => ({
    createServerClient: () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'borrower-user-id' } }, error: null }),
        },
        from: (table: string) => {
            if (table === 'company_members') {
                return { select: vi.fn().mockReturnValue(createChainableMock({ data: { company_id: 'borrower-company-id' }, error: null })) };
            }
            if (table === 'worker_availability') {
                return {
                    select: vi.fn().mockReturnValue(createChainableMock({
                        data: [
                            { worker_id: 'worker-1', minimum_shift_length_hours: 4, company_id: 'lender-company-id' },
                            { worker_id: 'worker-2', minimum_shift_length_hours: null, company_id: 'lender-company-id' }
                        ],
                        error: null
                    }))
                };
            }
            if (table === 'worker_profiles') {
                return {
                    select: vi.fn().mockReturnValue(createChainableMock({
                        data: [
                            { user_id: 'worker-1', user: { full_name: 'John Doe' } },
                            { user_id: 'worker-2', user: { full_name: 'Jane Smith' } }
                        ],
                        error: null
                    }))
                };
            }
            if (table === 'worker_rates') {
                return {
                    select: vi.fn().mockReturnValue(createChainableMock({
                        data: [
                            { worker_id: 'worker-1', hourly_rate: 50 },
                            { worker_id: 'worker-2', hourly_rate: 60 }
                        ],
                        error: null
                    }))
                };
            }
            if (table === 'cart_items') {
                return { select: vi.fn().mockReturnValue(createChainableMock({ data: [], error: null })) };
            }
            if (table === 'work_orders') {
                return { select: vi.fn().mockReturnValue(createChainableMock({ data: [{ id: 'wo-1', role: 'Plumber' }], error: null })) };
            }
            return { select: vi.fn().mockReturnValue(createChainableMock({ data: null, error: null })) };
        },
        rpc: mockRpc
    }),
}));

describe('GET /api/workers/available', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockRpc.mockImplementation((funcName: string) => {
            if (funcName === 'get_worker_on_time_pct') {
                return Promise.resolve({
                    data: [
                        { worker_id: 'worker-1', on_time_pct: 95 },
                        { worker_id: 'worker-2', on_time_pct: null }
                    ],
                    error: null
                });
            }
            if (funcName === 'get_lender_company_metrics') {
                return Promise.resolve({
                    data: [
                        { company_id: 'lender-company-id', fulfillment_score: 98, reliable_partner: true }
                    ],
                    error: null
                });
            }
            return Promise.resolve({ data: null, error: null });
        });
    });

    it('should successfully fetch workers and attach on-time and company metrics', async () => {
        const req = new NextRequest(new URL('http://localhost:3000/api/workers/available?projectId=None'));
        const response = await GET(req);

        expect(response.status).toBe(200);
        const json = await response.json();

        expect(json.workers).toBeDefined();
        expect(json.workers.length).toBe(2);

        const worker1 = json.workers.find((w: any) => w.user_id === 'worker-1');
        expect(worker1).toBeDefined();
        expect(worker1.on_time_pct).toBe(95);
        expect(worker1.fulfillment_score).toBe(98);
        expect(worker1.reliable_partner).toBe(true);
        expect(worker1.hourly_rate).toBe(50);
        expect(worker1.minimum_shift_length_hours).toBe(4);

        const worker2 = json.workers.find((w: any) => w.user_id === 'worker-2');
        expect(worker2).toBeDefined();
        expect(worker2.on_time_pct).toBeNull();
        expect(worker2.fulfillment_score).toBe(98);
        expect(worker2.reliable_partner).toBe(true);
    });

    it('should gracefully handle RPC failures for metrics without crashing', async () => {
        mockRpc.mockRejectedValue(new Error('Relation "time_log" does not exist'));

        const req = new NextRequest(new URL('http://localhost:3000/api/workers/available?projectId=None'));
        const response = await GET(req);

        expect(response.status).toBe(200);
        const json = await response.json();

        expect(json.workers.length).toBe(2);

        const worker1 = json.workers.find((w: any) => w.user_id === 'worker-1');
        expect(worker1.on_time_pct).toBeNull();
        expect(worker1.fulfillment_score).toBeNull();
        expect(worker1.reliable_partner).toBe(false);
    });
});
