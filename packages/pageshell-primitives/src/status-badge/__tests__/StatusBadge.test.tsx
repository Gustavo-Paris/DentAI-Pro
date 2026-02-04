/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, defineStatusConfig } from '../StatusBadge';

describe('StatusBadge', () => {
  describe('defineStatusConfig', () => {
    it('creates typed status config', () => {
      const config = defineStatusConfig({
        draft: { variant: 'default', icon: 'file', label: 'Draft' },
        published: { variant: 'success', icon: 'success', label: 'Published' },
      });

      expect(config.draft.variant).toBe('default');
      expect(config.draft.icon).toBe('file');
    });
  });

  describe('icon support', () => {
    it('renders icon when config has icon', () => {
      const config = defineStatusConfig({
        active: { variant: 'success', icon: 'success', label: 'Active' },
      });

      const { container } = render(<StatusBadge status="active" config={config} />);
      // PageIcon renders an SVG element
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('does not render icon when config has no icon', () => {
      const config = defineStatusConfig({
        active: { variant: 'success', label: 'Active' },
      });

      const { container } = render(<StatusBadge status="active" config={config} />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('pulse animation', () => {
    it('adds pulse class when config has pulse: true', () => {
      const config = defineStatusConfig({
        processing: { variant: 'warning', pulse: true, label: 'Processing' },
      });

      render(<StatusBadge status="processing" config={config} />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('does not add pulse class when pulse is false', () => {
      const config = defineStatusConfig({
        complete: { variant: 'success', label: 'Complete' },
      });

      render(<StatusBadge status="complete" config={config} />);
      const badge = screen.getByRole('status');
      expect(badge).not.toHaveClass('animate-pulse');
    });
  });
});
