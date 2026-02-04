/**
 * Visual color mapping for VITA shade guide
 * Colors are approximate representations for UI display
 * Based on VITA Classical shade guide
 */

// VITA shade to approximate hex color mapping
export const vitaShadeColors: Record<string, string> = {
  // A shades (Yellow-brown hue)
  'A1': '#F5E6D3',
  'A2': '#EBDAC8',
  'A3': '#E0CEBD',
  'A3.5': '#D5C2B0',
  'A4': '#C9B5A3',
  
  // B shades (Yellow hue, lighter)
  'B1': '#F7EBD9',
  'B2': '#F0E2CD',
  'B3': '#E5D6C0',
  'B4': '#D8C9B4',
  
  // C shades (Gray hue)
  'C1': '#EAE4DC',
  'C2': '#DED8D0',
  'C3': '#D1CBC4',
  'C4': '#C4BEB8',
  
  // D shades (Red-gray hue)
  'D2': '#E8DFD5',
  'D3': '#DCD3C9',
  'D4': '#CFC6BC',
  
  // Bleach shades (Ultra-white)
  'BL1': '#FFFFFF',
  'BL2': '#FEFEFE',
  'BL3': '#FCFCFA',
  'BL4': '#FAF8F5',
  'OM1': '#FDFDF8',
  'OM2': '#F9F9F3',
  'OM3': '#F5F5ED',
  
  // Effect resins (translucent/opaquer)
  'Trans': 'linear-gradient(135deg, #E8F4FC 0%, #D0E8F7 100%)',
  'Trans20': 'linear-gradient(135deg, #E8F4FC 0%, #D0E8F7 100%)',
  'Trans30': 'linear-gradient(135deg, #DCF0FB 0%, #C5E4F5 100%)',
  'OA1': '#F5E9DC',
  'OA2': '#EBE0D4',
  'OA3': '#E0D6CB',
  'OA3.5': '#D5CAC0',
  'OB1': '#F7EDD9',
  'OB2': '#EFE4CD',
  'OB3': '#E4D9C2',
  
  // Opaque shades
  'White Opaquer': '#FCFCFC',
  'WO': '#FCFCFC',
  'OP': '#F8F5F0',
  
  // Cervical/Body (amber tones)
  'Cervical': '#D9C4A8',
  'CV': '#D9C4A8',
  'Body': '#E5D9C8',
  
  // Incisal/Translucent effect
  'I': '#F0F5F8',
  'IT': 'linear-gradient(135deg, #ECF4FA 0%, #DFE9F0 100%)',
  'CT': 'linear-gradient(135deg, #E5F0F8 0%, #D5E5F2 100%)',
  'GT': 'linear-gradient(135deg, #E8E8EC 0%, #DCDCE2 100%)',
  'BT': 'linear-gradient(135deg, #E0EEF8 0%, #D0E2F0 100%)',
  'YT': 'linear-gradient(135deg, #F5F2E8 0%, #EDE8D8 100%)',
  'OT': 'linear-gradient(135deg, #F5EFE5 0%, #EBE2D5 100%)',
  
  // Empress Direct / IPS specific
  'Dentin A1': '#F5E6D3',
  'Dentin A2': '#EBDAC8',
  'Dentin A3': '#E0CEBD',
  'Dentin A3.5': '#D5C2B0',
  'Dentin A4': '#C9B5A3',
  'Enamel': '#F0F5FA',
  
  // Estelite specific
  'PA1': '#F6E8D5',
  'PA2': '#ECE0CD',
  'PA3': '#E2D5C3',
  'PB1': '#F7EBD9',
  'PB2': '#F0E4CF',
  'PB3': '#E6DAC5',
  'WE': '#FAFAFA',
  'CE': '#F0F3F6',
  'OE': '#F8F5EE',
  'HE': '#F2EFE8',
};

/**
 * Get the visual color for a shade
 * Returns hex color or CSS gradient string
 */
export function getVitaShadeColor(shade: string): string {
  // Direct match
  if (vitaShadeColors[shade]) {
    return vitaShadeColors[shade];
  }
  
  // Try uppercase
  const upperShade = shade.toUpperCase();
  if (vitaShadeColors[upperShade]) {
    return vitaShadeColors[upperShade];
  }
  
  // Try to find partial match (e.g., "A2 Dentina" should match A2)
  const baseShade = shade.split(' ')[0];
  if (vitaShadeColors[baseShade]) {
    return vitaShadeColors[baseShade];
  }
  
  // Extract shade code from variations (e.g., "EA2" -> "A2")
  const extracted = shade.match(/([A-D][1-4](?:\.5)?)/i);
  if (extracted && vitaShadeColors[extracted[1].toUpperCase()]) {
    return vitaShadeColors[extracted[1].toUpperCase()];
  }
  
  // Default neutral color for unknown shades
  return '#E8E5E0';
}

/**
 * Check if a color value is a gradient
 */
export function isGradient(color: string): boolean {
  return color.includes('linear-gradient');
}

/**
 * Get contrast text color (dark or light) based on background
 * Simple luminance check for solid colors
 */
export function getContrastTextColor(bgColor: string): string {
  if (isGradient(bgColor)) {
    return '#374151'; // Dark text for gradients (usually light)
  }
  
  // Remove # if present
  const hex = bgColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, light text for dark
  return luminance > 0.6 ? '#374151' : '#FAFAFA';
}
