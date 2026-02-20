import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { OnboardingCard } from './OnboardingCard';

describe('OnboardingCard', () => {
    it('should render title and children', () => {
        render(
            <OnboardingCard title="Test Title">
                <div data-testid="test-child">Child Content</div>
            </OnboardingCard>
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should render description if provided', () => {
        render(
            <OnboardingCard title="Test Title" description="Test Description">
                <div>Content</div>
            </OnboardingCard>
        );

        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render footer if provided', () => {
        render(
            <OnboardingCard
                title="Test Title"
                footer={<div data-testid="test-footer">Footer Content</div>}
            >
                <div>Content</div>
            </OnboardingCard>
        );

        expect(screen.getByTestId('test-footer')).toBeInTheDocument();
    });

    it('should render badge with correct text', () => {
        render(
            <OnboardingCard
                title="Test Title"
                badge={{ text: 'Beta', variant: 'warning' }}
            >
                <div>Content</div>
            </OnboardingCard>
        );

        expect(screen.getByText('Beta')).toBeInTheDocument();
    });
});
