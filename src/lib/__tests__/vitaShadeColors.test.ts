import { describe, it, expect } from 'vitest';
import {
  vitaShadeColors,
  getVitaShadeColor,
  isGradient,
  getContrastTextColor,
} from '../vitaShadeColors';

describe('vitaShadeColors map', () => {
  it('should contain all classic A shades', () => {
    expect(vitaShadeColors['A1']).toBeDefined();
    expect(vitaShadeColors['A2']).toBeDefined();
    expect(vitaShadeColors['A3']).toBeDefined();
    expect(vitaShadeColors['A3.5']).toBeDefined();
    expect(vitaShadeColors['A4']).toBeDefined();
  });

  it('should contain B, C, and D shades', () => {
    expect(vitaShadeColors['B1']).toBeDefined();
    expect(vitaShadeColors['C1']).toBeDefined();
    expect(vitaShadeColors['D2']).toBeDefined();
  });

  it('should have hex color values', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    expect(vitaShadeColors['A1']).toMatch(hexRegex);
    expect(vitaShadeColors['B2']).toMatch(hexRegex);
  });
});

describe('getVitaShadeColor', () => {
  it('should return color for exact shade match', () => {
    expect(getVitaShadeColor('A2')).toBe(vitaShadeColors['A2']);
  });

  it('should match case-insensitively', () => {
    expect(getVitaShadeColor('a2')).toBe(vitaShadeColors['A2']);
  });

  it('should handle shade with suffix (e.g. "A2 Dentina")', () => {
    expect(getVitaShadeColor('A2 Dentina')).toBe(vitaShadeColors['A2']);
  });

  it('should extract shade code from variations (e.g. "EA2")', () => {
    expect(getVitaShadeColor('EA2')).toBe(vitaShadeColors['A2']);
  });

  it('should return default color for unknown shades', () => {
    expect(getVitaShadeColor('Z99')).toBe('#E8E5E0');
  });

  it('should handle A3.5 fractional shade', () => {
    expect(getVitaShadeColor('A3.5')).toBe(vitaShadeColors['A3.5']);
  });
});

describe('isGradient', () => {
  it('should return true for gradient strings', () => {
    expect(isGradient('linear-gradient(to right, #fff, #000)')).toBe(true);
  });

  it('should return false for hex colors', () => {
    expect(isGradient('#F5E6D3')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isGradient('')).toBe(false);
  });
});

describe('getContrastTextColor', () => {
  it('should return dark text for light backgrounds', () => {
    expect(getContrastTextColor('#FFFFFF')).toBe('#374151');
    expect(getContrastTextColor('#F5E6D3')).toBe('#374151');
  });

  it('should return light text for dark backgrounds', () => {
    expect(getContrastTextColor('#000000')).toBe('#FAFAFA');
    expect(getContrastTextColor('#1A1A1A')).toBe('#FAFAFA');
  });

  it('should return dark text for gradients', () => {
    expect(getContrastTextColor('linear-gradient(to right, #fff, #eee)')).toBe('#374151');
  });

  it('should handle hex without #', () => {
    // The function removes # — passing without it should also work
    expect(getContrastTextColor('FFFFFF')).toBe('#374151');
  });
});
