import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
    it('should render all steps up to totalSteps', () => {
        render(<ProgressIndicator currentStep={1} totalSteps={4} />);

        expect(screen.getByText('Company Info')).toBeInTheDocument();
        expect(screen.getByText('Verification')).toBeInTheDocument();
        expect(screen.getByText('User Type')).toBeInTheDocument();
        expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should render correct number of steps if totalSteps is specified', () => {
        render(<ProgressIndicator currentStep={1} totalSteps={2} />);

        expect(screen.getByText('Company Info')).toBeInTheDocument();
        expect(screen.getByText('Verification')).toBeInTheDocument();
        expect(screen.queryByText('User Type')).not.toBeInTheDocument();
    });

    it('should show completed icons for previous steps', () => {
        const { container } = render(<ProgressIndicator currentStep={3} />);

        // At step 3, steps 1 and 2 should have the checkmark SVG
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBe(2);
    });
});
