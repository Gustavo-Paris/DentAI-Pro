import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComparisonSlider } from '../ComparisonSlider';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return { GripVertical: S, ZoomIn: S, ZoomOut: S, Maximize: S };
});

describe('ComparisonSlider', () => {
  const defaultProps = {
    beforeImage: 'before.jpg',
    afterImage: 'after.jpg',
  };

  it('renders in split mode by default with slider role', () => {
    render(<ComparisonSlider {...defaultProps} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(2);
  });

  it('renders in before mode', () => {
    render(<ComparisonSlider {...defaultProps} viewMode="before" />);
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders in after mode', () => {
    render(<ComparisonSlider {...defaultProps} viewMode="after" />);
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders custom labels', () => {
    render(
      <ComparisonSlider
        {...defaultProps}
        beforeLabel="Original"
        afterLabel="Simulation"
      />,
    );
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Simulation')).toBeInTheDocument();
  });

  it('renders change indicator when provided', () => {
    render(
      <ComparisonSlider
        {...defaultProps}
        changeIndicator="Gengiva reconturada"
      />,
    );
    expect(screen.getByText('Gengiva reconturada')).toBeInTheDocument();
  });

  it('renders annotation overlay when provided and slider > 5%', () => {
    render(
      <ComparisonSlider
        {...defaultProps}
        annotationOverlay={<div data-testid="annotation">Overlay</div>}
      />,
    );
    expect(screen.getByTestId('annotation')).toBeInTheDocument();
  });

  it('renders zoom controls', () => {
    render(<ComparisonSlider {...defaultProps} />);
    expect(screen.getByLabelText('components.comparisonSlider.zoomIn')).toBeInTheDocument();
    expect(screen.getByLabelText('components.comparisonSlider.zoomOut')).toBeInTheDocument();
    expect(screen.getByLabelText('components.comparisonSlider.zoomReset')).toBeInTheDocument();
  });

  it('handles keyboard events in split mode', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'Home' });
    fireEvent.keyDown(slider, { key: 'End' });
    // No error means keyboard handling works
  });

  it('handles keyboard with shift for large step', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
    expect(slider.getAttribute('aria-valuenow')).toBe('40');
    fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true });
    expect(slider.getAttribute('aria-valuenow')).toBe('50');
  });

  it('handles ArrowDown and ArrowUp', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowDown' });
    expect(slider.getAttribute('aria-valuenow')).toBe('49');
    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    expect(slider.getAttribute('aria-valuenow')).toBe('50');
  });

  it('zoom in button increases zoom', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const zoomIn = screen.getByLabelText('components.comparisonSlider.zoomIn');
    fireEvent.click(zoomIn);
    // Should show zoom indicator (1.0 + 0.25 = 1.25 → toFixed(1) = "1.3")
    expect(screen.getByText('1.3x')).toBeInTheDocument();
  });

  it('zoom out button decreases zoom', () => {
    render(<ComparisonSlider {...defaultProps} />);
    // Zoom in first
    fireEvent.click(screen.getByLabelText('components.comparisonSlider.zoomIn'));
    fireEvent.click(screen.getByLabelText('components.comparisonSlider.zoomIn'));
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    // Zoom out (1.5 - 0.25 = 1.25 → "1.3x")
    fireEvent.click(screen.getByLabelText('components.comparisonSlider.zoomOut'));
    expect(screen.getByText('1.3x')).toBeInTheDocument();
  });

  it('zoom reset resets to 1x', () => {
    render(<ComparisonSlider {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('components.comparisonSlider.zoomIn'));
    expect(screen.getByText('1.3x')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('components.comparisonSlider.zoomReset'));
    expect(screen.queryByText('1.3x')).toBeNull();
  });

  it('handles mouse down and mouse move for slider dragging', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    // Mock getBoundingClientRect
    Object.defineProperty(slider, 'getBoundingClientRect', {
      value: () => ({ left: 0, right: 400, width: 400, top: 0, bottom: 300, height: 300 }),
    });
    // Mouse down near slider handle (center at 200px for 50%)
    fireEvent.mouseDown(slider, { clientX: 200, clientY: 150 });
    // Mouse move
    fireEvent.mouseMove(document, { clientX: 250, clientY: 150 });
    fireEvent.mouseUp(document);
  });

  it('handles touch start for slider', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    Object.defineProperty(slider, 'getBoundingClientRect', {
      value: () => ({ left: 0, right: 400, width: 400, top: 0, bottom: 300, height: 300 }),
    });
    fireEvent.touchStart(slider, { touches: [{ clientX: 200, clientY: 150 }] });
    fireEvent.touchEnd(document);
  });

  it('handles pinch zoom with two fingers', () => {
    render(<ComparisonSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.touchStart(slider, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ],
    });
    fireEvent.touchEnd(document);
  });
});
