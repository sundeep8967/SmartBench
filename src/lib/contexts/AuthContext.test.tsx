import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock Next.js Navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    usePathname: vi.fn(() => '/'),
}));

// Mock Supabase Client
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(),
}));

// Test component to consume the context
const TestComponent = () => {
    const { user, loading, hasCompletedOnboarding, signInWithGoogle, logout } = useAuth();

    if (loading) return <div data-testid="status">Loading...</div>;

    return (
        <div>
            <div data-testid="status">Ready</div>
            <div data-testid="user">{user ? user.email : 'No User'}</div>
            <div data-testid="onboarded">{hasCompletedOnboarding ? 'Yes' : 'No'}</div>
            <button onClick={signInWithGoogle}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    const mockRouterPush = vi.fn();
    const mockSignInWithOAuth = vi.fn();
    const mockSignOut = vi.fn();
    let mockOnAuthStateChangeCallback: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default useRouter mock
        (useRouter as any).mockReturnValue({ push: mockRouterPush });

        // Setup default Supabase mock
        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
                onAuthStateChange: vi.fn((callback) => {
                    mockOnAuthStateChangeCallback = callback;
                    return { data: { subscription: { unsubscribe: vi.fn() } } };
                }),
                signInWithOAuth: mockSignInWithOAuth,
                signOut: mockSignOut,
            }
        };
        (createClient as any).mockReturnValue(mockSupabase);
    });

    it('should initialize with loading state and resolve to no user', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Initially loading
        expect(screen.getByTestId('status')).toHaveTextContent('Loading...');

        // Wait for getSession to resolve
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });

        expect(screen.getByTestId('status')).toHaveTextContent('Ready');
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
        expect(screen.getByTestId('onboarded')).toHaveTextContent('No');
    });

    it('should update state when auth state changes to SIGNED_IN', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => {
            // Let initial fetch finish
            await new Promise((r) => setTimeout(r, 0));

            // Simulate Supabase firing a SIGNED_IN event
            mockOnAuthStateChangeCallback('SIGNED_IN', {
                user: { id: '123', email: 'test@example.com', user_metadata: { is_onboarded: true } }
            });
        });

        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('onboarded')).toHaveTextContent('Yes');
    });

    it('should call signInWithOAuth when signInWithGoogle is invoked', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });

        await act(async () => {
            screen.getByText('Login').click();
        });

        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: expect.any(Object)
        });
    });

    it('should call signOut and redirect to login when logout is invoked', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });

        await act(async () => {
            screen.getByText('Logout').click();
        });

        expect(mockSignOut).toHaveBeenCalled();
        expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
});
