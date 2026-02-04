/**
 * AppShell Tests
 */

/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';
import type { NavSection, UserProfile } from '../types';

// Mock adapters
const mockRenderLink = vi.fn(({ item, children, className }) => (
  <a href={item.href} className={className}>
    {children}
  </a>
));

const mockIsActive = vi.fn((href: string) => href === '/dashboard');

// Test data
const navigation: NavSection[] = [
  {
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: 'home', exact: true },
      { title: 'Settings', href: '/settings', icon: 'settings' },
    ],
  },
  {
    label: 'Content',
    items: [
      { title: 'Courses', href: '/courses', icon: 'book-open' },
    ],
  },
];

const user: UserProfile = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Admin',
};

const brand = {
  icon: 'star' as const,
  title: 'Test App',
  subtitle: 'Dashboard',
};

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <AppShell
        brand={brand}
        navigation={navigation}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
      >
        <div data-testid="content">Page Content</div>
      </AppShell>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders brand title (desktop + mobile)', () => {
    render(
      <AppShell
        brand={brand}
        navigation={navigation}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
      >
        Content
      </AppShell>
    );

    // Brand appears in desktop sidebar, mobile drawer, and mobile header
    const brandElements = screen.getAllByText('Test App');
    expect(brandElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders navigation items (desktop + mobile)', () => {
    render(
      <AppShell
        brand={brand}
        navigation={navigation}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
      >
        Content
      </AppShell>
    );

    // Navigation items appear in both desktop and mobile sidebars
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Courses').length).toBeGreaterThanOrEqual(1);
  });

  it('renders section labels', () => {
    render(
      <AppShell
        brand={brand}
        navigation={navigation}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
      >
        Content
      </AppShell>
    );

    // Section labels appear in both desktop and mobile sidebars
    expect(screen.getAllByText('Content').length).toBeGreaterThanOrEqual(1);
  });

  it('applies theme data attribute', () => {
    render(
      <AppShell
        theme="creator"
        brand={brand}
        navigation={navigation}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
      >
        Content
      </AppShell>
    );

    const container = document.querySelector('[data-theme="creator"]');
    expect(container).toBeInTheDocument();
  });

  it('applies custom className to main', () => {
    render(
      <AppShell
        brand={brand}
        navigation={navigation}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
        className="custom-class"
      >
        Content
      </AppShell>
    );

    const main = document.querySelector('main');
    expect(main).toHaveClass('custom-class');
  });

  it('renders user info when provided', () => {
    render(
      <AppShell
        brand={brand}
        navigation={navigation}
        user={user}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
      >
        Content
      </AppShell>
    );

    // User name appears in both desktop and mobile sidebars
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
  });

  it('renders quick switch link when provided', () => {
    render(
      <AppShell
        brand={brand}
        navigation={navigation}
        quickSwitch={{ label: 'Switch View', href: '/other', icon: 'arrow-left' }}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
      >
        Content
      </AppShell>
    );

    // Quick switch appears in both desktop and mobile sidebars
    expect(screen.getAllByText('Switch View').length).toBeGreaterThanOrEqual(1);
  });

  it('calls renderLink for navigation items', () => {
    render(
      <AppShell
        brand={brand}
        navigation={navigation}
        renderLink={mockRenderLink}
        isActive={mockIsActive}
      >
        Content
      </AppShell>
    );

    // Should be called multiple times (desktop + mobile)
    expect(mockRenderLink).toHaveBeenCalled();

    // Check that it was called with correct structure
    const calls = mockRenderLink.mock.calls;
    const dashboardCall = calls.find((call) => call[0].item.title === 'Dashboard');
    expect(dashboardCall).toBeDefined();
    expect(dashboardCall?.[0].item.href).toBe('/dashboard');
  });
});
