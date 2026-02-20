import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DashboardPage from './page';

describe('DashboardPage', () => {
    it('should render the dashboard overview heading', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
        expect(screen.getByText('Welcome back to your construction management hub.')).toBeInTheDocument();
    });

    it('should render statistics cards', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Active Bookings')).toBeInTheDocument();
        expect(screen.getByText('Pending Verifications')).toBeInTheDocument();
        expect(screen.getByText('Stripe Balance')).toBeInTheDocument();
    });

    it('should render the recent bookings table', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
        expect(screen.getByText('Mike Ross')).toBeInTheDocument();
        expect(screen.getByText('Rachel Zane')).toBeInTheDocument();
    });

    it('should render quick action buttons', () => {
        render(<DashboardPage />);
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Search Workers')).toBeInTheDocument();
        expect(screen.getByText('Create Project')).toBeInTheDocument();
        expect(screen.getByText('Add to Roster')).toBeInTheDocument();
    });
});
