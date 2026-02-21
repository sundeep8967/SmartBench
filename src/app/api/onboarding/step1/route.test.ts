import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('/api/onboarding/step1', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user_1' } }, error: null }),
            },
            from: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'comp_1' }, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        (createClient as any).mockResolvedValue(mockSupabase);
    });

    it('should return 401 if unauthorized', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth error') });
        const req = new NextRequest('http://localhost/api/onboarding/step1', { method: 'POST' });
        const res = await POST(req);

        expect(res.status).toBe(401);
    });

    it('should handle company creation failure', async () => {
        const errorMsg = 'DB constraint failed';
        // First check: user has no company
        mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        // Second check: insertion fails
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: errorMsg } });

        const req = new NextRequest('http://localhost/api/onboarding/step1', {
            method: 'POST',
            body: JSON.stringify({ companyName: 'Acme', address: '123 St', ein: '123-456', contactPhone: '1234567890' }),
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json.error).toBe(errorMsg);
    });

    it('should return success and company ID when both steps succeed', async () => {
        const req = new NextRequest('http://localhost/api/onboarding/step1', {
            method: 'POST',
            body: JSON.stringify({ companyName: 'Acme Corp', address: '456 Ave', ein: '987-654', contactPhone: '0987654321' }),
        });

        // 1st insert handles chains: .maybeSingle() for company check
        // 2nd insert handles chains: .insert().select().single() for company creation
        // 3rd insert doesn't chain select/single, just returns { error: null }
        mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

        mockSupabase.insert.mockImplementationOnce(() => ({
            select: () => ({ single: async () => ({ data: { id: 'comp_new_1' }, error: null }) })
        }));

        mockSupabase.insert.mockImplementationOnce(async () => ({ error: null }));

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.companyId).toBe('comp_new_1');
    });
});
