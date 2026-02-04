/**
 * LayoutContext Tests
 */

/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { LayoutProvider, useLayout, useLayoutAdapters, useIsActive } from './LayoutContext';
import type { ReactNode } from 'react';

// Mock render functions
const mockRenderLink = vi.fn(({ children, className }) => (
  <a className={className}>{children}</a>
));

const mockIsActive = vi.fn((href: string, exact?: boolean) => {
  if (exact) return href === '/current';
  return href === '/current' || '/current'.startsWith(href);
});

// Helper wrapper
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <LayoutProvider
      theme="creator"
      renderLink={mockRenderLink}
      isActive={mockIsActive}
      user={{ name: 'Test User', email: 'test@example.com' }}
    >
      {children}
    </LayoutProvider>
  );
}

describe('LayoutProvider', () => {
  it('provides theme and user', () => {
    function TestComponent() {
      const { theme, user } = useLayout();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="user-name">{user?.name}</span>
        </div>
      );
    }

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('creator');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
  });

  it('manages sidebar state', () => {
    function TestComponent() {
      const { isSidebarOpen, toggleSidebar, openSidebar, closeSidebar } = useLayout();
      return (
        <div>
          <span data-testid="sidebar-state">{isSidebarOpen ? 'open' : 'closed'}</span>
          <button onClick={toggleSidebar}>Toggle</button>
          <button onClick={openSidebar}>Open</button>
          <button onClick={closeSidebar}>Close</button>
        </div>
      );
    }

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Initially closed
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');

    // Toggle opens
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('open');

    // Toggle closes
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');

    // Open
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('open');

    // Close
    fireEvent.click(screen.getByText('Close'));
    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('closed');
  });

  it('respects defaultSidebarOpen', () => {
    function TestComponent() {
      const { isSidebarOpen } = useLayout();
      return <span data-testid="sidebar-state">{isSidebarOpen ? 'open' : 'closed'}</span>;
    }

    render(
      <LayoutProvider
        renderLink={mockRenderLink}
        isActive={mockIsActive}
        defaultSidebarOpen={true}
      >
        <TestComponent />
      </LayoutProvider>
    );

    expect(screen.getByTestId('sidebar-state')).toHaveTextContent('open');
  });
});

describe('useLayout', () => {
  it('throws when used outside provider', () => {
    const { result } = renderHook(() => {
      try {
        return useLayout();
      } catch (e) {
        return e;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe('useLayout must be used within a LayoutProvider');
  });
});

describe('useLayoutAdapters', () => {
  it('provides render functions', () => {
    function TestComponent() {
      const { renderLink, isActive } = useLayoutAdapters();
      return (
        <div>
          <span data-testid="has-renderLink">{typeof renderLink === 'function' ? 'yes' : 'no'}</span>
          <span data-testid="has-isActive">{typeof isActive === 'function' ? 'yes' : 'no'}</span>
        </div>
      );
    }

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('has-renderLink')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-isActive')).toHaveTextContent('yes');
  });

  it('throws when used outside provider', () => {
    const { result } = renderHook(() => {
      try {
        return useLayoutAdapters();
      } catch (e) {
        return e;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
  });
});

describe('useIsActive', () => {
  it('checks route active state', () => {
    function TestComponent() {
      const isExact = useIsActive('/current', true);
      const isPrefix = useIsActive('/curr');
      return (
        <div>
          <span data-testid="exact">{isExact ? 'active' : 'inactive'}</span>
          <span data-testid="prefix">{isPrefix ? 'active' : 'inactive'}</span>
        </div>
      );
    }

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('exact')).toHaveTextContent('active');
    expect(screen.getByTestId('prefix')).toHaveTextContent('active');
  });
});
