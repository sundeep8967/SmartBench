import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TimeClockClient from './TimeClockClient';
import { timeClockAction } from './actions';
import { useToast } from '@/components/ui/use-toast';

// Mock React's useOptimistic to behave synchronously for standard testing
vi.mock('react', async () => {
    const actual = await vi.importActual('react') as any;
    return {
        ...actual,
        useOptimistic: (initialState: any, updateFn: any) => {
            // Very simple synchronous mock: it just returns the initial state 
            // and a dummy dispatcher that immediately updates a local variable
            // For a basic test, returning the initialState and a spy is enough.
            const [state, setState] = actual.useState(initialState);
            const dispatch = (action: any) => {
                const newState = updateFn(state, action);
                setState(newState);
            };
            return [state, dispatch];
        },
    };
});

// Mock the server actions
vi.mock('./actions', () => ({
    timeClockAction: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
    useToast: vi.fn(),
}));

describe('TimeClockClient', () => {
    const mockToast = vi.fn();

    const mockProjects = [
        { id: 'proj-1', name: 'Downtown Highrise' },
        { id: 'proj-2', name: 'Suburban Development' },
    ];

    const mockActiveShift = {
        id: 'shift-1',
        clock_in: new Date().toISOString(),
        clock_out: null,
        break_start: null,
        total_break_minutes: 0,
        status: 'Active',
        project: { name: 'Downtown Highrise' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useToast as any).mockReturnValue({ toast: mockToast });
    });

    it('should render Not Clocked In state initially', () => {
        render(
            <TimeClockClient
                initialActiveShift={null}
                recentShifts={[]}
                projects={mockProjects}
            />
        );

        expect(screen.getByText('Not Clocked In')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clock in/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle optimistic clock in', () => {
        (timeClockAction as any).mockResolvedValueOnce({ id: 'new-shift' });

        render(
            <TimeClockClient
                initialActiveShift={null}
                recentShifts={[]}
                projects={mockProjects}
            />
        );

        const clockInButton = screen.getByRole('button', { name: /clock in/i });

        // Trigger the clock in synchronously
        act(() => {
            fireEvent.click(clockInButton);
        });

        // Optimistically, the UI should immediately show 'Clocked In' 
        // without waiting for the server
        expect(screen.queryByText('Not Clocked In')).not.toBeInTheDocument();
        expect(screen.getByText('Clocked In')).toBeInTheDocument();

        // Ensure the server action was called
        expect(timeClockAction).toHaveBeenCalledWith('clock_in', 'proj-1', undefined);
    });

    it('should render Active Shift state if initialized with one', () => {
        render(
            <TimeClockClient
                initialActiveShift={mockActiveShift}
                recentShifts={[]}
                projects={mockProjects}
            />
        );

        expect(screen.getByText('Clocked In')).toBeInTheDocument();
        expect(screen.getByText('Downtown Highrise')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start break/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clock out/i })).toBeInTheDocument();
    });

    it('should handle optimistic clock out', () => {
        (timeClockAction as any).mockResolvedValueOnce(null);

        render(
            <TimeClockClient
                initialActiveShift={mockActiveShift}
                recentShifts={[]}
                projects={mockProjects}
            />
        );

        const clockOutButton = screen.getByRole('button', { name: /clock out/i });

        act(() => {
            fireEvent.click(clockOutButton);
        });

        // The UI should immediately revert to the "Not Clocked In" state
        expect(screen.getByText('Not Clocked In')).toBeInTheDocument();
        expect(timeClockAction).toHaveBeenCalledWith('clock_out', 'proj-1', 'shift-1');
    });
});
