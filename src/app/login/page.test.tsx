import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LoginPage from './page';
import * as AuthContext from '@/lib/contexts/AuthContext';
import * as NextNavigation from 'next/navigation';

vi.mock('@/lib/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

let mockPush = vi.fn();

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPush = vi.fn();
        (NextNavigation.useRouter as any).mockReturnValue({ push: mockPush });
    });

    it('should redirect to dashboard if user is authenticated', () => {
        (AuthContext.useAuth as any).mockReturnValue({
            signInWithGoogle: vi.fn(),
            loading: false,
            user: { id: 'user_1' },
        });

        render(<LoginPage />);

        expect(mockPush).toHaveBeenCalledWith('/dashboard/marketplace');
    });

    it('should render login functionality if unauthenticated', () => {
        (AuthContext.useAuth as any).mockReturnValue({
            signInWithGoogle: vi.fn(),
            loading: false,
            user: null,
        });

        render(<LoginPage />);

        expect(screen.getByText('Welcome back')).toBeInTheDocument();
        expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('should call signInWithGoogle when button is clicked', async () => {
        const mockSignInWithGoogle = vi.fn();
        (AuthContext.useAuth as any).mockReturnValue({
            signInWithGoogle: mockSignInWithGoogle,
            loading: false,
            user: null,
        });

        render(<LoginPage />);

        const signInButton = screen.getByRole('button');
        fireEvent.click(signInButton);

        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
});
