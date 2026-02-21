import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookingsPage from './page';
import useSWR from 'swr';

// Mock SWR to control the fetched data payloads
vi.mock('swr', () => ({
    default: vi.fn(),
}));

describe('BookingsPage', () => {

    it('should display the loading state initially', () => {
        (useSWR as any).mockReturnValue({ data: undefined, isLoading: true });

        render(<BookingsPage />);

        expect(screen.getByText('Bookings Management')).toBeInTheDocument();
        expect(screen.getByText('Loading bookings...')).toBeInTheDocument();
        // Should not show an empty state when explicitly loading
        expect(screen.queryByText('No bookings found.')).not.toBeInTheDocument();
    });

    it('should display the empty state when no bookings exist', () => {
        (useSWR as any).mockReturnValue({ data: [], isLoading: false });

        render(<BookingsPage />);

        expect(screen.getByText('No bookings found.')).toBeInTheDocument();
    });

    it('should render a list of bookings correctly mapping data to the UI', () => {
        const mockBookings = [
            {
                id: 'bkg-12345678',
                worker: { full_name: 'Harvey Specter' },
                work_order: { role: 'Senior Plumber' },
                project: { name: 'Hudson Yards', address: 'NYC' },
                start_date: '2024-06-01',
                end_date: '2024-06-05',
                total_amount: 50000, // $500.00
                status: 'Confirmed'
            }
        ];

        (useSWR as any).mockReturnValue({ data: mockBookings, isLoading: false });

        render(<BookingsPage />);

        // Assert the ID slices correctly
        expect(screen.getByText('#bkg-1234')).toBeInTheDocument();

        // Assert the Worker data mounts
        expect(screen.getByText('Harvey Specter')).toBeInTheDocument();
        expect(screen.getByText('Senior Plumber')).toBeInTheDocument();

        // Assert the Project data mounts
        expect(screen.getByText('Hudson Yards')).toBeInTheDocument();

        // Assert the Financial conversion ($500.00 from 50000 cents)
        expect(screen.getByText('$500.00')).toBeInTheDocument();

        // Assert Status
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });

});
