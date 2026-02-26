import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getContralateralTooth,
  findContralateralProtocol,
  syncGroupProtocols,
  uploadPhoto,
} from '../wizard';

// =============================================================================
// Mock supabase client
// =============================================================================

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNot = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();

// Separate terminal results for different query chains
let queryTerminalResult: unknown = { data: null, error: null };

function createBuilder(): Record<string, (...args: unknown[]) => unknown> {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};

  const chainMethod = (mockFn: ReturnType<typeof vi.fn>) => {
    return (...args: unknown[]) => {
      mockFn(...args);
      return builder;
    };
  };

  builder.select = chainMethod(mockSelect);
  builder.eq = chainMethod(mockEq);
  builder.not = chainMethod(mockNot);
  builder.in = chainMethod(mockIn);
  builder.order = chainMethod(mockOrder);
  builder.update = chainMethod(mockUpdate);
  builder.limit = (...args: unknown[]) => {
    mockLimit(...args);
    return builder;
  };
  builder.maybeSingle = () => {
    mockMaybeSingle();
    return Promise.resolve(queryTerminalResult);
  };
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
    return Promise.resolve(queryTerminalResult).then(resolve, reject);
  };

  return builder;
}

const mockUpload = vi.fn();
const mockDownload = vi.fn();

vi.mock('../client', () => ({
  supabase: {
    from: () => createBuilder(),
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        download: (...args: unknown[]) => mockDownload(...args),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// =============================================================================
// Tests
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  queryTerminalResult = { data: null, error: null };
});

// ---------------------------------------------------------------------------
// getContralateralTooth (pure function — no mocks needed)
// ---------------------------------------------------------------------------

describe('getContralateralTooth', () => {
  describe('upper jaw quadrant swapping', () => {
    it('should swap quadrant 1 to 2 (upper right to upper left)', () => {
      expect(getContralateralTooth('11')).toBe('21');
      expect(getContralateralTooth('13')).toBe('23');
      expect(getContralateralTooth('17')).toBe('27');
    });

    it('should swap quadrant 2 to 1 (upper left to upper right)', () => {
      expect(getContralateralTooth('21')).toBe('11');
      expect(getContralateralTooth('23')).toBe('13');
      expect(getContralateralTooth('28')).toBe('18');
    });
  });

  describe('lower jaw quadrant swapping', () => {
    it('should swap quadrant 3 to 4 (lower left to lower right)', () => {
      expect(getContralateralTooth('31')).toBe('41');
      expect(getContralateralTooth('34')).toBe('44');
      expect(getContralateralTooth('38')).toBe('48');
    });

    it('should swap quadrant 4 to 3 (lower right to lower left)', () => {
      expect(getContralateralTooth('41')).toBe('31');
      expect(getContralateralTooth('46')).toBe('36');
      expect(getContralateralTooth('48')).toBe('38');
    });
  });

  describe('deciduous teeth quadrant swapping', () => {
    it('should swap quadrant 5 to 6', () => {
      expect(getContralateralTooth('51')).toBe('61');
      expect(getContralateralTooth('55')).toBe('65');
    });

    it('should swap quadrant 6 to 5', () => {
      expect(getContralateralTooth('61')).toBe('51');
    });

    it('should swap quadrant 7 to 8', () => {
      expect(getContralateralTooth('71')).toBe('81');
    });

    it('should swap quadrant 8 to 7', () => {
      expect(getContralateralTooth('81')).toBe('71');
    });
  });

  describe('bidirectional symmetry', () => {
    it('should be its own inverse for all permanent teeth', () => {
      const teeth = ['11', '12', '13', '14', '15', '16', '17', '18',
        '21', '22', '23', '24', '25', '26', '27', '28',
        '31', '32', '33', '34', '35', '36', '37', '38',
        '41', '42', '43', '44', '45', '46', '47', '48'];

      for (const tooth of teeth) {
        const contra = getContralateralTooth(tooth);
        expect(contra).not.toBeNull();
        const doubleContra = getContralateralTooth(contra!);
        expect(doubleContra).toBe(tooth);
      }
    });
  });

  describe('invalid input', () => {
    it('should return null for single-character input', () => {
      expect(getContralateralTooth('1')).toBeNull();
    });

    it('should return null for three-character input', () => {
      expect(getContralateralTooth('111')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getContralateralTooth('')).toBeNull();
    });

    it('should return null for invalid quadrant (0)', () => {
      expect(getContralateralTooth('01')).toBeNull();
    });

    it('should return null for invalid quadrant (9)', () => {
      expect(getContralateralTooth('91')).toBeNull();
    });
  });

  describe('preserves tooth number', () => {
    it('should keep the second digit unchanged', () => {
      expect(getContralateralTooth('14')).toBe('24');
      expect(getContralateralTooth('14')![1]).toBe('4');
    });
  });
});

// ---------------------------------------------------------------------------
// findContralateralProtocol
// ---------------------------------------------------------------------------

describe('findContralateralProtocol', () => {
  it('should return protocol when contralateral tooth has one', async () => {
    const protocol = {
      id: 'eval-contra',
      tooth: '21',
      treatment_type: 'resina',
      generic_protocol: { summary: 'Protocol for 21', checklist: ['Step 1'] },
    };
    queryTerminalResult = { data: protocol, error: null };

    const result = await findContralateralProtocol('patient-1', '11');

    expect(result).toEqual({
      evaluationId: 'eval-contra',
      tooth: '21',
      treatmentType: 'resina',
      protocol: { summary: 'Protocol for 21', checklist: ['Step 1'] },
    });
    // Should have queried for contralateral tooth '21'
    expect(mockEq).toHaveBeenCalledWith('patient_id', 'patient-1');
    expect(mockEq).toHaveBeenCalledWith('tooth', '21');
  });

  it('should return null when contralateral tooth has no protocol', async () => {
    queryTerminalResult = { data: null, error: null };

    const result = await findContralateralProtocol('patient-1', '11');
    expect(result).toBeNull();
  });

  it('should return null when query errors', async () => {
    queryTerminalResult = { data: null, error: new Error('Query failed') };

    const result = await findContralateralProtocol('patient-1', '11');
    expect(result).toBeNull();
  });

  it('should return null for invalid tooth (no contralateral mapping)', async () => {
    const result = await findContralateralProtocol('patient-1', 'GENGIVO');
    expect(result).toBeNull();
  });

  it('should query for generic_protocol IS NOT NULL', async () => {
    queryTerminalResult = { data: null, error: null };

    await findContralateralProtocol('patient-1', '14');

    expect(mockNot).toHaveBeenCalledWith('generic_protocol', 'is', null);
  });

  it('should order by created_at descending to get the most recent', async () => {
    queryTerminalResult = { data: null, error: null };

    await findContralateralProtocol('patient-1', '11');

    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should limit to 1 result', async () => {
    queryTerminalResult = { data: null, error: null };

    await findContralateralProtocol('patient-1', '11');

    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('should look up tooth 24 when given tooth 14', async () => {
    queryTerminalResult = { data: null, error: null };

    await findContralateralProtocol('patient-1', '14');

    expect(mockEq).toHaveBeenCalledWith('tooth', '24');
  });

  it('should look up tooth 36 when given tooth 46', async () => {
    queryTerminalResult = { data: null, error: null };

    await findContralateralProtocol('patient-1', '46');

    expect(mockEq).toHaveBeenCalledWith('tooth', '36');
  });
});

// ---------------------------------------------------------------------------
// syncGroupProtocols
// ---------------------------------------------------------------------------

describe('syncGroupProtocols', () => {
  it('should not sync when fewer than 2 evaluation IDs', async () => {
    await syncGroupProtocols('session-1', ['eval-1']);

    // Should not even query Supabase
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should not sync when fewer than 2 evaluations returned', async () => {
    queryTerminalResult = {
      data: [{ id: 'eval-1', treatment_type: 'resina', stratification_protocol: {} }],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    // Should query but not update (only 1 eval returned)
    expect(mockSelect).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should not sync when query returns error', async () => {
    queryTerminalResult = { data: null, error: new Error('Query failed') };

    // Should not throw — just returns early
    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should group evaluations by treatment_type', async () => {
    queryTerminalResult = {
      data: [
        {
          id: 'eval-1',
          treatment_type: 'resina',
          cavity_class: 'III',
          stratification_protocol: { layers: 3 },
          recommended_resin_id: 'resin-1',
          recommendation_text: 'Use Z350',
        },
        {
          id: 'eval-2',
          treatment_type: 'resina',
          cavity_class: 'IV',
          stratification_protocol: null,
          recommended_resin_id: null,
        },
        {
          id: 'eval-3',
          treatment_type: 'porcelana',
          cementation_protocol: { steps: ['Step 1'] },
        },
        {
          id: 'eval-4',
          treatment_type: 'porcelana',
          cementation_protocol: null,
        },
      ],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2', 'eval-3', 'eval-4']);

    // Should have made update calls for both groups
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should not sync groups with only 1 evaluation', async () => {
    queryTerminalResult = {
      data: [
        { id: 'eval-1', treatment_type: 'resina', stratification_protocol: {} },
        { id: 'eval-2', treatment_type: 'porcelana', cementation_protocol: {} },
      ],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    // Each group has only 1 member — no sync needed
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should skip resina group when no evaluation has stratification_protocol', async () => {
    queryTerminalResult = {
      data: [
        { id: 'eval-1', treatment_type: 'resina', stratification_protocol: null },
        { id: 'eval-2', treatment_type: 'resina', stratification_protocol: null },
      ],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should skip porcelana group when no evaluation has cementation_protocol', async () => {
    queryTerminalResult = {
      data: [
        { id: 'eval-1', treatment_type: 'porcelana', cementation_protocol: null },
        { id: 'eval-2', treatment_type: 'porcelana', cementation_protocol: null },
      ],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should not sync generic treatment types (implante, coroa, etc.)', async () => {
    queryTerminalResult = {
      data: [
        { id: 'eval-1', treatment_type: 'implante' },
        { id: 'eval-2', treatment_type: 'implante' },
      ],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should treat unknown treatment_type as generic (no sync)', async () => {
    queryTerminalResult = {
      data: [
        { id: 'eval-1', treatment_type: null },
        { id: 'eval-2', treatment_type: null },
      ],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    // null treatment_type becomes "unknown" — no special sync logic
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should handle treatment types with :: suffix (legacy format)', async () => {
    queryTerminalResult = {
      data: [
        {
          id: 'eval-1',
          treatment_type: 'resina::III',
          stratification_protocol: { layers: 3 },
          recommended_resin_id: 'r1',
        },
        {
          id: 'eval-2',
          treatment_type: 'resina::III',
          stratification_protocol: null,
        },
      ],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    // resina:: prefix should trigger resina sync logic
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should handle porcelana:: suffix correctly', async () => {
    queryTerminalResult = {
      data: [
        {
          id: 'eval-1',
          treatment_type: 'porcelana::onlay',
          cementation_protocol: { steps: ['etch'] },
        },
        {
          id: 'eval-2',
          treatment_type: 'porcelana::onlay',
          cementation_protocol: null,
        },
      ],
      error: null,
    };

    await syncGroupProtocols('session-1', ['eval-1', 'eval-2']);

    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should query with correct filters (session_id + evaluation ids)', async () => {
    queryTerminalResult = { data: [], error: null };

    await syncGroupProtocols('session-abc', ['e1', 'e2']);

    expect(mockEq).toHaveBeenCalledWith('session_id', 'session-abc');
    expect(mockIn).toHaveBeenCalledWith('id', ['e1', 'e2']);
  });
});

// ---------------------------------------------------------------------------
// uploadPhoto — file validation (behavior tests)
// ---------------------------------------------------------------------------

describe('uploadPhoto file validation', () => {
  it('should reject non-image file types', async () => {
    const textBlob = new Blob(['text'], { type: 'text/plain' });

    await expect(uploadPhoto('user-1', textBlob)).rejects.toThrow(
      'Tipo de arquivo inválido',
    );
  });

  it('should reject files larger than 10MB', async () => {
    // Create a blob slightly over 10MB
    const largeData = new Uint8Array(10 * 1024 * 1024 + 1);
    const largeBlob = new Blob([largeData], { type: 'image/jpeg' });

    await expect(uploadPhoto('user-1', largeBlob)).rejects.toThrow(
      'Arquivo muito grande',
    );
  });

  it('should accept JPEG images', async () => {
    mockUpload.mockResolvedValue({ error: null });
    const blob = new Blob(['data'], { type: 'image/jpeg' });

    const result = await uploadPhoto('user-1', blob);
    expect(result).toMatch(/^user-1\/intraoral_\d+\.jpg$/);
  });

  it('should accept PNG images', async () => {
    mockUpload.mockResolvedValue({ error: null });
    const blob = new Blob(['data'], { type: 'image/png' });

    const result = await uploadPhoto('user-1', blob);
    expect(result).toMatch(/^user-1\/intraoral_\d+\.jpg$/);
  });

  it('should accept WebP images', async () => {
    mockUpload.mockResolvedValue({ error: null });
    const blob = new Blob(['data'], { type: 'image/webp' });

    const result = await uploadPhoto('user-1', blob);
    expect(result).toMatch(/^user-1\/intraoral_\d+\.jpg$/);
  });

  it('should accept HEIC images', async () => {
    mockUpload.mockResolvedValue({ error: null });
    const blob = new Blob(['data'], { type: 'image/heic' });

    const result = await uploadPhoto('user-1', blob);
    expect(result).toMatch(/^user-1\/intraoral_\d+\.jpg$/);
  });

  it('should reject PDF files', async () => {
    const pdfBlob = new Blob(['pdf'], { type: 'application/pdf' });

    await expect(uploadPhoto('user-1', pdfBlob)).rejects.toThrow(
      'Tipo de arquivo inválido',
    );
  });

  it('should reject SVG images', async () => {
    const svgBlob = new Blob(['<svg/>'], { type: 'image/svg+xml' });

    await expect(uploadPhoto('user-1', svgBlob)).rejects.toThrow(
      'Tipo de arquivo inválido',
    );
  });
});
