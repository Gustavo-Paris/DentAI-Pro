import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Optional annotation overlay rendered on top of the "before" image */
  annotationOverlay?: React.ReactNode;
  /** Optional label indicating what was changed (e.g., "Gengiva reconturada") */
  changeIndicator?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  annotationOverlay,
  changeIndicator,
}: ComparisonSliderProps) {
  const { t } = useTranslation();
  const resolvedBeforeLabel = beforeLabel ?? t('components.wizard.dsd.simulationViewer.before');
  const resolvedAfterLabel = afterLabel ?? t('dsd.simulation');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchDistRef = useRef<number | null>(null);
  const pinchZoomRef = useRef(1);

  // Clamp pan to prevent going out of bounds
  const clampPan = useCallback((p: { x: number; y: number }, z: number) => {
    if (z <= 1) return { x: 0, y: 0 };
    const maxPan = ((z - 1) / z) * 50; // % based
    return {
      x: Math.max(-maxPan, Math.min(maxPan, p.x)),
      y: Math.max(-maxPan, Math.min(maxPan, p.y)),
    };
  }, []);

  // Reset pan when zoom returns to 1
  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Slider drag handling
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // Determine if a mousedown/touchstart is near the slider handle
  const isNearSliderHandle = useCallback((clientX: number): boolean => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();
    const handleX = rect.left + (sliderPosition / 100) * rect.width;
    return Math.abs(clientX - handleX) < 30; // 30px tolerance
  }, [sliderPosition]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isNearSliderHandle(e.clientX)) {
      setIsDragging(true);
    } else if (zoom > 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOriginRef.current = { ...pan };
    }
  }, [zoom, pan, isNearSliderHandle]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSliderMove(e.clientX);
      } else if (isPanning && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dx = ((e.clientX - panStartRef.current.x) / rect.width) * 100;
        const dy = ((e.clientY - panStartRef.current.y) / rect.height) * 100;
        const newPan = { x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy };
        setPan(clampPan(newPan, zoom));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsPanning(false);
    };

    if (isDragging || isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isPanning, zoom, handleSliderMove, clampPan]);

  // Touch events — handle slider drag, pan (1 finger when zoomed), pinch-to-zoom (2 fingers)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current = Math.hypot(dx, dy);
      pinchZoomRef.current = zoom;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isNearSliderHandle(touch.clientX)) {
        setIsDragging(true);
      } else if (zoom > 1) {
        setIsPanning(true);
        panStartRef.current = { x: touch.clientX, y: touch.clientY };
        panOriginRef.current = { ...pan };
      }
    }
  }, [zoom, pan, isNearSliderHandle]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchDistRef.current !== null) {
        // Pinch zoom
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scale = dist / pinchDistRef.current;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchZoomRef.current * scale));
        setZoom(newZoom);
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (isDragging) {
          handleSliderMove(touch.clientX);
        } else if (isPanning && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const dx = ((touch.clientX - panStartRef.current.x) / rect.width) * 100;
          const dy = ((touch.clientY - panStartRef.current.y) / rect.height) * 100;
          const newPan = { x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy };
          setPan(clampPan(newPan, zoom));
        }
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setIsPanning(false);
      pinchDistRef.current = null;
    };

    if (isDragging || isPanning || pinchDistRef.current !== null) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isPanning, zoom, handleSliderMove, clampPan]);

  // Scroll wheel zoom (desktop) — must use native listener with { passive: false }
  // React synthetic onWheel is passive by default, so preventDefault() would fail
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  const handleZoomOut = () => setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const imageTransform = `scale(${zoom}) translate(${pan.x / zoom}%, ${pan.y / zoom}%)`;
  const cursorStyle = isDragging ? 'cursor-ew-resize' : isPanning ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-ew-resize';

  // Keyboard handler for arrow keys
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSliderPosition(prev => Math.max(0, prev - step));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSliderPosition(prev => Math.min(100, prev + step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPosition(100);
    }
  }, []);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`relative w-full rounded-xl overflow-hidden select-none touch-none bg-secondary ${cursorStyle}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="slider"
        aria-valuenow={Math.round(sliderPosition)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('components.wizard.dsd.comparisonSlider.ariaLabel')}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* After image (in-flow, sets container height via object-contain) */}
        <img
          src={afterImage}
          alt={resolvedAfterLabel}
          className="w-full max-h-[80vh] object-contain"
          style={{ transform: imageTransform, transformOrigin: 'center center', imageRendering: zoom > 1 ? 'high-quality' : undefined }}
          draggable={false}
        />

        {/* Before image (clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt={resolvedBeforeLabel}
            className="w-full h-full object-contain"
            style={{ transform: imageTransform, transformOrigin: 'center center', imageRendering: zoom > 1 ? 'high-quality' : undefined }}
            draggable={false}
          />
          {/* Annotation overlay on the "before" side */}
          {annotationOverlay && sliderPosition > 5 && (
            <div className="absolute inset-0" style={{ transform: imageTransform, transformOrigin: 'center center' }}>
              {annotationOverlay}
            </div>
          )}
        </div>

        {/* Slider line and handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-background shadow-lg z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-background rounded-full shadow-lg flex items-center justify-center border-2 border-primary">
            <GripVertical className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
          <Button
            variant="secondary"
            size="icon"
            className="w-9 h-9 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            disabled={zoom <= MIN_ZOOM}
            aria-label={t('components.comparisonSlider.zoomOut')}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-9 h-9 bg-background/80 backdrop-blur-sm hover:bg-background text-[10px] font-mono"
            onClick={(e) => { e.stopPropagation(); handleZoomReset(); }}
            aria-label={t('components.comparisonSlider.zoomReset')}
          >
            {zoom > 1 ? <Maximize className="w-4 h-4" /> : '1:1'}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-9 h-9 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            disabled={zoom >= MAX_ZOOM}
            aria-label={t('components.comparisonSlider.zoomIn')}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom indicator */}
        {zoom > 1 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[10px] font-mono text-muted-foreground z-20">
            {zoom.toFixed(1)}x
          </div>
        )}

        {/* Labels */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-background/90 rounded text-xs font-medium z-10">
          {resolvedBeforeLabel}
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium z-10">
          {resolvedAfterLabel}
        </div>

        {/* Change indicator */}
        {changeIndicator && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-destructive/90 text-destructive-foreground rounded-full text-[10px] font-medium z-10 pointer-events-none whitespace-nowrap">
            {changeIndicator}
          </div>
        )}
      </div>
    </div>
  );
}
