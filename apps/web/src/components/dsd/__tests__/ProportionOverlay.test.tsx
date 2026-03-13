import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProportionOverlay } from '../ProportionOverlay';
import type { ProportionLines } from '@/hooks/domain/dsd/useProportionLines';

const baseLayers = new Set<'midline' | 'goldenRatio' | 'smileArc'>(['midline', 'goldenRatio', 'smileArc']);

const mockLines: ProportionLines = {
  midline: { x: 50, yStart: 10, yEnd: 90 },
  goldenRatio: [
    {
      x1: 45,
      w1: 8,
      x2: 55,
      w2: 5,
      y: 30,
      ratio: 1.6,
      ideal: 1.618,
      innerIndex: 0,
      innerTooth: '11',
      outerTooth: '12',
    },
  ],
  smileArc: [
    { x: 20, y: 60 },
    { x: 50, y: 55 },
    { x: 80, y: 60 },
  ],
};

describe('ProportionOverlay', () => {
  it('returns null when container dimensions are zero', () => {
    const { container } = render(
      <ProportionOverlay
        lines={mockLines}
        visibleLayers={baseLayers}
        containerWidth={0}
        containerHeight={0}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders SVG with midline, golden ratio, and smile arc', () => {
    render(
      <ProportionOverlay
        lines={mockLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = screen.getByLabelText('components.wizard.dsd.proportionOverlay.ariaLabel');
    expect(svg).toBeInTheDocument();
    expect(svg.querySelectorAll('line').length).toBeGreaterThan(0);
    expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('renders midline adjusted indicator', () => {
    render(
      <ProportionOverlay
        lines={mockLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
        isMidlineAdjusted
      />,
    );
    expect(screen.getByText(/components\.wizard\.dsd\.proportionOverlay\.midlineAdjusted/)).toBeInTheDocument();
  });

  it('renders drag handle when onMidlineOffsetChange is provided', () => {
    render(
      <ProportionOverlay
        lines={mockLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
        onMidlineOffsetChange={() => {}}
      />,
    );
    const svg = screen.getByLabelText('components.wizard.dsd.proportionOverlay.ariaLabel');
    // Should have circle for drag handle
    expect(svg.querySelectorAll('circle').length).toBeGreaterThan(0);
  });

  it('renders only visible layers', () => {
    const midlineOnly = new Set<'midline' | 'goldenRatio' | 'smileArc'>(['midline']);
    render(
      <ProportionOverlay
        lines={mockLines}
        visibleLayers={midlineOnly}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = screen.getByLabelText('components.wizard.dsd.proportionOverlay.ariaLabel');
    // No path for smile arc
    expect(svg.querySelectorAll('path').length).toBe(0);
  });

  it('renders golden ratio with good status (checkmark)', () => {
    const goodRatioLines: ProportionLines = {
      ...mockLines,
      goldenRatio: [
        {
          x1: 45,
          w1: 8,
          x2: 55,
          w2: 5,
          y: 30,
          ratio: 1.618,
          ideal: 1.618,
          innerIndex: 0,
          innerTooth: '11',
          outerTooth: '12',
        },
      ],
    };
    render(
      <ProportionOverlay
        lines={goodRatioLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    // checkmark char
    expect(screen.getByText(/1\.62.*\u2713/)).toBeInTheDocument();
  });

  it('renders smile arc with only 2 points (straight line)', () => {
    const twoPointLines: ProportionLines = {
      ...mockLines,
      smileArc: [
        { x: 20, y: 60 },
        { x: 80, y: 60 },
      ],
    };
    render(
      <ProportionOverlay
        lines={twoPointLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = screen.getByLabelText('components.wizard.dsd.proportionOverlay.ariaLabel');
    expect(svg.querySelector('path')).toBeInTheDocument();
  });

  it('renders golden ratio without tooth names using positional labels', () => {
    const noToothLines: ProportionLines = {
      ...mockLines,
      goldenRatio: [
        {
          x1: 45, w1: 8, x2: 55, w2: 5, y: 30,
          ratio: 1.6, ideal: 1.618, innerIndex: 0,
          // No innerTooth/outerTooth — falls back to toothPositionLabel
        },
      ],
    };
    render(
      <ProportionOverlay
        lines={noToothLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = screen.getByLabelText('components.wizard.dsd.proportionOverlay.ariaLabel');
    expect(svg).toBeInTheDocument();
  });

  it('handles golden ratio with high innerIndex (fallback label)', () => {
    const highIdxLines: ProportionLines = {
      ...mockLines,
      goldenRatio: [
        {
          x1: 45, w1: 8, x2: 55, w2: 5, y: 30,
          ratio: 1.5, ideal: 1.618, innerIndex: 5,
        },
      ],
    };
    render(
      <ProportionOverlay
        lines={highIdxLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    const svg = screen.getByLabelText('components.wizard.dsd.proportionOverlay.ariaLabel');
    expect(svg).toBeInTheDocument();
  });

  it('handles pointer events on drag handle', () => {
    // Mock setPointerCapture/releasePointerCapture for jsdom
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();

    const onOffset = vi.fn();
    render(
      <ProportionOverlay
        lines={mockLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
        onMidlineOffsetChange={onOffset}
      />,
    );
    const svg = screen.getByLabelText('components.wizard.dsd.proportionOverlay.ariaLabel');
    const circle = svg.querySelector('circle');
    expect(circle).not.toBeNull();

    // Simulate pointer down
    fireEvent.pointerDown(circle!, { clientX: 400, pointerId: 1 });
    // Simulate pointer move
    fireEvent.pointerMove(circle!, { clientX: 420, pointerId: 1 });
    expect(onOffset).toHaveBeenCalled();
    // Simulate pointer up
    fireEvent.pointerUp(circle!, { pointerId: 1 });
  });

  it('handles pointer cancel on drag', () => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();

    const onOffset = vi.fn();
    render(
      <ProportionOverlay
        lines={mockLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
        onMidlineOffsetChange={onOffset}
      />,
    );
    const svg = screen.getByLabelText('components.wizard.dsd.proportionOverlay.ariaLabel');
    const circle = svg.querySelector('circle');

    fireEvent.pointerDown(circle!, { clientX: 400, pointerId: 1 });
    fireEvent.pointerCancel(circle!, { pointerId: 1 });
  });

  it('renders smile arc with single point', () => {
    const onePointLines: ProportionLines = {
      ...mockLines,
      smileArc: [{ x: 50, y: 50 }],
    };
    const { container } = render(
      <ProportionOverlay
        lines={onePointLines}
        visibleLayers={baseLayers}
        containerWidth={800}
        containerHeight={600}
      />,
    );
    // Single point produces M but no arc visible
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
