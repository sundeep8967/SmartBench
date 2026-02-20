import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
    describe('cn', () => {
        it('should merge tailwind classes correctly', () => {
            // Basic merge
            expect(cn('p-4', 'm-2')).toBe('p-4 m-2');

            // Conditional merge
            expect(cn('p-4', true && 'text-red-500', false && 'text-blue-500')).toBe('p-4 text-red-500');

            // Tailwind-merge conflicts resolution
            expect(cn('p-4 p-8')).toBe('p-8');
            expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
        });
    });
});
