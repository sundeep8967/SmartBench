import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global Mock for Next.js Navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
}));

// Global Mock for Next.js Headers/Cookies
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(),
    }),
    headers: () => new Headers(),
}));
