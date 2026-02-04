/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageCard } from '../PageCard';

describe('PageCard', () => {
  describe('variant prop', () => {
    it('renders default variant without variant class', () => {
      render(<PageCard testId="card">Content</PageCard>);
      const card = screen.getByTestId('card');
      expect(card).not.toHaveClass('border-warning/50');
    });

    it('renders warning variant with correct classes', () => {
      render(<PageCard variant="warning" testId="card">Content</PageCard>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-warning/50');
      expect(card).toHaveClass('bg-warning/10');
    });

    it('renders success variant with correct classes', () => {
      render(<PageCard variant="success" testId="card">Content</PageCard>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-success/50');
      expect(card).toHaveClass('bg-success/10');
    });

    it('renders error variant with correct classes', () => {
      render(<PageCard variant="error" testId="card">Content</PageCard>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-destructive/50');
      expect(card).toHaveClass('bg-destructive/10');
    });

    it('renders info variant with correct classes', () => {
      render(<PageCard variant="info" testId="card">Content</PageCard>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-info/50');
      expect(card).toHaveClass('bg-info/10');
    });

    it('renders muted variant with correct classes', () => {
      render(<PageCard variant="muted" testId="card">Content</PageCard>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-muted');
    });
  });
});
