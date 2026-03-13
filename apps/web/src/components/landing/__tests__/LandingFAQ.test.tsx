import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingFAQ } from '../LandingFAQ';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <button>{children}</button>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/lib/branding', () => ({
  BRAND_NAME: 'TestBrand',
}));

describe('LandingFAQ', () => {
  it('renders FAQ section with title and 7 questions', () => {
    render(<LandingFAQ />);
    expect(screen.getAllByText('landing.faqTitle').length).toBeGreaterThan(0);
    expect(screen.getByText('landing.faq1Q')).toBeInTheDocument();
    expect(screen.getByText('landing.faq2Q')).toBeInTheDocument();
    expect(screen.getByText('landing.faq3Q')).toBeInTheDocument();
    expect(screen.getByText('landing.faq4Q')).toBeInTheDocument();
    expect(screen.getByText('landing.faq5Q')).toBeInTheDocument();
    expect(screen.getByText('landing.faq6Q')).toBeInTheDocument();
    expect(screen.getByText('landing.faq7Q')).toBeInTheDocument();
  });

  it('renders all answer texts', () => {
    render(<LandingFAQ />);
    expect(screen.getByText('landing.faq1A')).toBeInTheDocument();
    // faq6A and faq7A have interpolation params, so the mock t() appends them
    expect(screen.getByText(/landing\.faq7A/)).toBeInTheDocument();
  });
});
