import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Header } from './header';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/contexts/CartContext';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
}));

vi.mock('@/lib/contexts/CartContext', () => ({
    useCart: vi.fn(),
}));

// Mock Link component
vi.mock('next/link', () => {
    return {
        default: ({ children, href }: { children: React.ReactNode, href: string }) => {
            return <a href={href}>{children}</a>;
        }
    };
});

describe('Header Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render default dashboard view', () => {
        // Arrange
        (usePathname as any).mockReturnValue('/dashboard');
        (useCart as any).mockReturnValue({ cartCount: 0 });

        // Act
        render(<Header />);

        // Assert
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText(/New Project/i)).toBeInTheDocument();
    });

    it('should render marketplace view with cart actions', () => {
        // Arrange
        (usePathname as any).mockReturnValue('/dashboard/marketplace');
        (useCart as any).mockReturnValue({ cartCount: 3 });

        // Act
        render(<Header />);

        // Assert
        expect(screen.getByText('Marketplace')).toBeInTheDocument();
        expect(screen.getByText('Search')).toBeInTheDocument();
        expect(screen.getByText('Saved')).toBeInTheDocument();
        expect(screen.getByText(/Cart/i)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Cart badge
    });

    it('should render roster view with add worker action', () => {
        // Arrange
        (usePathname as any).mockReturnValue('/dashboard/roster');
        (useCart as any).mockReturnValue({ cartCount: 0 });

        // Act
        render(<Header />);

        // Assert
        expect(screen.getByText('Roster')).toBeInTheDocument();
        expect(screen.getByText('Team')).toBeInTheDocument();
        expect(screen.getByText(/Add Worker/i)).toBeInTheDocument();
    });
});
