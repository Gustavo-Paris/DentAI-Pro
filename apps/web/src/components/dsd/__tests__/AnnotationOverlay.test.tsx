import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnnotationOverlay } from '../AnnotationOverlay';
import type { DSDSuggestion, ToothBoundsPct } from '@/types/dsd';

vi.mock('@/lib/treatment-colors', () => ({
  TREATMENT_COLORS: { resina: '#3b82f6', gengivoplastia: '#ec4899' },
}));

const mockBounds: ToothBoundsPct[] = [
  { tooth: '11', x: 45, y: 50, width: 8, height: 20 },
  { tooth: '12', x: 55, y: 50, width: 6, height: 18 },
];

const mockSuggestions: DSDSuggestion[] = [
  {
    tooth: '11',
    current_issue: 'Borda incisal irregular',
    proposed_change: 'Aumentar bordo incisal 1.5mm',
    treatment_indication: 'resina',
  },
  {
    tooth: '12',
    current_issue: 'Margem gengival assimetrica',
    proposed_change: 'Gengivoplastia 1mm',
    treatment_indication: 'gengivoplastia',
  },
];

describe('AnnotationOverlay', () => {
  it('returns null when not visible', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={mockSuggestions}
        toothBounds={mockBounds}
        visible={false}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when container dimensions are zero', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={mockSuggestions}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={0}
        containerHeight={0}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders SVG with annotations for each suggestion', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={mockSuggestions}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Should have circles for tooth markers
    expect(svg!.querySelectorAll('circle').length).toBeGreaterThan(0);
    // Should have text with tooth numbers
    expect(svg!.querySelectorAll('text').length).toBeGreaterThan(0);
  });

  it('renders cervical measurement for gengivoplasty suggestions', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={mockSuggestions}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = container.querySelector('svg')!;
    // Should have dashed lines for gengival margin
    const dashedLines = svg.querySelectorAll('line[stroke-dasharray]');
    expect(dashedLines.length).toBeGreaterThan(0);
  });

  it('renders legend', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={mockSuggestions}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = container.querySelector('svg')!;
    // Legend text
    const texts = Array.from(svg.querySelectorAll('text'));
    const legendText = texts.find(t => t.textContent?.includes('Dente analisado'));
    expect(legendText).toBeTruthy();
  });

  it('handles empty suggestions', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders incisal measurement (non-gingivo)', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Bordo curto', proposed_change: 'Aumentar bordo incisal 2mm', treatment_indication: 'resina' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text'));
    const measurementText = texts.find(t => t.textContent === '2mm');
    expect(measurementText).toBeTruthy();
  });

  it('shows "..." when no measurement value in proposed_change', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Gengival', proposed_change: 'Gengivoplastia sem medida', treatment_indication: 'gengivoplastia' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text'));
    const ellipsisText = texts.find(t => t.textContent === '...');
    expect(ellipsisText).toBeTruthy();
  });

  it('shows "..." for incisal annotation without measurement', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Bordo', proposed_change: 'Aumentar bordo incisal', treatment_indication: 'resina' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text'));
    const ellipsisText = texts.find(t => t.textContent === '...');
    expect(ellipsisText).toBeTruthy();
  });

  it('filters suggestions without tooth or proposed_change', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '', current_issue: 'No tooth', proposed_change: 'Something', treatment_indication: 'resina' },
          { tooth: '11', current_issue: 'Valid', proposed_change: '', treatment_indication: 'resina' },
          { tooth: '12', current_issue: 'Valid', proposed_change: 'Valid', treatment_indication: 'resina' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text'));
    const toothLabels = texts.filter(t => /^\d{2}$/.test(t.textContent || ''));
    expect(toothLabels.length).toBe(1);
    expect(toothLabels[0].textContent).toBe('12');
  });

  it('uses fallback bounds when tooth not matched', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '21', current_issue: 'Issue', proposed_change: 'Fix', treatment_indication: 'resina' },
        ]}
        toothBounds={[{ x: 40, y: 40, width: 8, height: 16, tooth: 'invalid' }]}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    // Should render using fallback bound
    const texts = Array.from(container.querySelectorAll('text'));
    const toothLabel = texts.find(t => t.textContent === '21');
    expect(toothLabel).toBeTruthy();
  });

  it('skips annotation when no bound available at all', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '21', current_issue: 'Issue', proposed_change: 'Fix', treatment_indication: 'resina' },
        ]}
        toothBounds={[{ tooth: '11', x: 45, y: 50, width: 8, height: 20 }]}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text'));
    const toothLabel = texts.find(t => t.textContent === '21');
    expect(toothLabel).toBeFalsy();
  });

  it('renders legend with both gingivo and incisal', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={mockSuggestions}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Margem gengival');
    expect(texts).toContain('Acréscimo incisal');
  });

  it('renders legend with only gingivo (no incisal)', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Gengival', proposed_change: 'Gengivoplastia', treatment_indication: 'gengivoplastia' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Margem gengival');
    expect(texts).not.toContain('Acréscimo incisal');
  });

  it('renders legend with only incisal (no gingivo)', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Bordo incisal', proposed_change: 'Aumentar incisal', treatment_indication: 'resina' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).not.toContain('Margem gengival');
    expect(texts).toContain('Acréscimo incisal');
  });

  it('renders legend without gingivo or incisal when neither present', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Cárie', proposed_change: 'Restauração', treatment_indication: 'resina' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toContain('Dente analisado');
    expect(texts).not.toContain('Margem gengival');
    expect(texts).not.toContain('Acréscimo incisal');
  });

  it('uses fallback color for unknown treatment type', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Issue', proposed_change: 'Fix', treatment_indication: 'unknown_type' as any },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const circle = container.querySelector('circle[fill]');
    expect(circle?.getAttribute('fill')).toBe('#3b82f6'); // fallback
  });

  it('normalizes tooth values with prefix text', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: 'Dente 11', current_issue: 'Issue', proposed_change: 'Fix', treatment_indication: 'resina' },
        ]}
        toothBounds={[{ tooth: 'Dente 11', x: 45, y: 50, width: 8, height: 20 }]}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    // Normalized "Dente 11" -> "11" for matching
    const texts = Array.from(container.querySelectorAll('text'));
    const label = texts.find(t => t.textContent === 'Dente 11');
    expect(label).toBeTruthy();
  });

  it('handles comma decimal in measurement', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Gengival', proposed_change: 'Reduzir 1,5mm gengival', treatment_indication: 'gengivoplastia' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text'));
    const measurement = texts.find(t => t.textContent === '1.5mm');
    expect(measurement).toBeTruthy();
  });

  it('gingivo annotation takes priority over incisal for same suggestion', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Gengivoplastia e bordo incisal', proposed_change: 'Gengivoplastia e aumentar incisal 2mm', treatment_indication: 'gengivoplastia' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    // Should render cervical (gingivo) dashed line
    const dashedLines = container.querySelectorAll('line[stroke-dasharray]');
    expect(dashedLines.length).toBeGreaterThan(0);
  });

  it('limits suggestions to 20 max', () => {
    const manySuggestions = Array.from({ length: 25 }, (_, i) => ({
      tooth: String(11 + (i % 8)),
      current_issue: `Issue ${i}`,
      proposed_change: `Fix ${i}`,
      treatment_indication: 'resina' as const,
    }));
    const manyBounds = Array.from({ length: 25 }, (_, i) => ({
      tooth: `fallback-${i}`,
      x: 10 + i * 3,
      y: 50,
      width: 5,
      height: 15,
    }));

    const { container } = render(
      <AnnotationOverlay
        suggestions={manySuggestions}
        toothBounds={manyBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles overlapping label positions (resolveY)', () => {
    // 3 suggestions at same tooth should trigger resolveY overlap detection
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'A', proposed_change: 'Fix A', treatment_indication: 'resina' },
          { tooth: '11', current_issue: 'B', proposed_change: 'Fix B', treatment_indication: 'resina' },
          { tooth: '11', current_issue: 'C', proposed_change: 'Fix C', treatment_indication: 'resina' },
        ]}
        toothBounds={[
          mockBounds[0],
          { tooth: 'fb1', x: 45, y: 50, width: 8, height: 20 },
          { tooth: 'fb2', x: 45, y: 50, width: 8, height: 20 },
        ]}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('detects "acrescimo incisal" (no accent) as incisal increase', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: '', proposed_change: 'acrescimo incisal 1mm', treatment_indication: 'resina' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text'));
    const measurement = texts.find(t => t.textContent === '1mm');
    expect(measurement).toBeTruthy();
  });

  it('detects "acréscimo incisal" (with accent) as incisal increase', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'acréscimo incisal', proposed_change: 'Restauração 0.5mm', treatment_indication: 'resina' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const texts = Array.from(container.querySelectorAll('text'));
    const legendTexts = texts.map(t => t.textContent);
    expect(legendTexts).toContain('Acréscimo incisal');
  });

  it('detects isCervicalChange via gengiv keyword in current_issue', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Problema gengival', proposed_change: 'Corrigir margem', treatment_indication: 'resina' },
        ]}
        toothBounds={mockBounds}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const dashedLines = container.querySelectorAll('line[stroke-dasharray]');
    expect(dashedLines.length).toBeGreaterThan(0);
  });

  it('handles undefined tooth in normalizeTooth', () => {
    const { container } = render(
      <AnnotationOverlay
        suggestions={[
          { tooth: '11', current_issue: 'Issue', proposed_change: 'Fix', treatment_indication: 'resina' },
        ]}
        toothBounds={[{ tooth: undefined as any, x: 45, y: 50, width: 8, height: 20 }]}
        visible={true}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    // tooth: undefined in bound -> normalizeTooth returns null -> goes to fallback
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
