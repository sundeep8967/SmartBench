import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('/api/cart', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user_1' } } }),
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { company_id: 'comp_1' } }),
        };

        (createClient as any).mockResolvedValue(mockSupabase);
    });

    describe('GET', () => {
        it('should return 401 if unauthorized', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
            const req = new NextRequest('http://localhost/api/cart');
            const res = await GET(req);

            expect(res.status).toBe(401);
        });

        it('should return 403 if no active company', async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: null });
            const req = new NextRequest('http://localhost/api/cart');
            const res = await GET(req);

            expect(res.status).toBe(403);
        });

        it('should return cart items on success', async () => {
            const mockCartItems = [{ id: 'item_1', worker_id: 'w1' }];
            mockSupabase.order.mockResolvedValueOnce({ data: mockCartItems, error: null });

            const req = new NextRequest('http://localhost/api/cart');
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json).toEqual(mockCartItems);
        });
    });

    describe('POST', () => {
        it('should return 400 if missing required fields', async () => {
            const req = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify({ work_order_id: 'wo_1' }), // Missing worker_id, start_date, end_date
            });
            const res = await POST(req);

            expect(res.status).toBe(400);
        });

        it('should insert cart item on success', async () => {
            const req = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify({
                    work_order_id: 'wo_1',
                    worker_id: 'w_1',
                    hourly_rate: 20,
                    start_date: '2026-01-01',
                    end_date: '2026-01-31'
                }),
            });

            const mockInsertedData = { id: 'new_item_1' };
            mockSupabase.single.mockResolvedValueOnce({ data: { company_id: 'comp_1' } }) // For company query
                .mockResolvedValueOnce({ data: mockInsertedData, error: null }); // For insert query

            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(mockSupabase.insert).toHaveBeenCalled();
            expect(json).toEqual(mockInsertedData);
        });

        it('should return 409 if unique violation occurs', async () => {
            const req = new NextRequest('http://localhost/api/cart', {
                method: 'POST',
                body: JSON.stringify({
                    work_order_id: 'wo_1',
                    worker_id: 'w_1',
                    start_date: '2026-01-01',
                    end_date: '2026-01-31'
                }),
            });

            mockSupabase.single.mockResolvedValueOnce({ data: { company_id: 'comp_1' } }) // For company query
                .mockResolvedValueOnce({ data: null, error: { code: '23505' } }); // For insert query

            const res = await POST(req);
            expect(res.status).toBe(409);
        });
    });
});
