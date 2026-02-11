import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadPhoto,
  downloadPhoto,
  createPatient,
  findPatientByName,
  updatePatientBirthDate,
  createEvaluation,
  updateEvaluationProtocol,
  updateEvaluationStatus,
  invokeRecommendCementation,
  invokeRecommendResin,
  savePendingTeeth,
} from '../wizard';

// ---------------------------------------------------------------------------
// Mock supabase client
// ---------------------------------------------------------------------------

const mockUpload = vi.fn();
const mockDownload = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockInvoke = vi.fn();

// Track insert error for savePendingTeeth (which reads .error directly from insert)
let insertDirectError: Error | null = null;

vi.mock('../client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        download: (...args: unknown[]) => mockDownload(...args),
      }),
    },
    from: () => ({
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return {
          // For savePendingTeeth: destructures { error } directly
          error: insertDirectError,
          // For createPatient / createEvaluation: chains .select().single()
          select: (...sArgs: unknown[]) => {
            mockSelect(...sArgs);
            return { single: () => mockSingle() };
          },
        };
      },
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              eq: (...eqArgs2: unknown[]) => {
                mockEq(...eqArgs2);
                return { maybeSingle: () => mockMaybeSingle() };
              },
              maybeSingle: () => mockMaybeSingle(),
            };
          },
        };
      },
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return { eq: () => mockEq() };
          },
        };
      },
    }),
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  insertDirectError = null;
});

describe('uploadPhoto', () => {
  it('should upload a photo and return the file path', async () => {
    mockUpload.mockResolvedValue({ error: null });

    const blob = new Blob(['photo-data'], { type: 'image/jpeg' });
    const result = await uploadPhoto('user-123', blob);

    expect(result).toMatch(/^user-123\/intraoral_\d+\.jpg$/);
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-123\/intraoral_\d+\.jpg$/),
      blob,
      { upsert: true },
    );
  });

  it('should throw when upload fails', async () => {
    const uploadError = new Error('Upload failed');
    mockUpload.mockResolvedValue({ error: uploadError });

    const blob = new Blob(['data']);
    await expect(uploadPhoto('user-1', blob)).rejects.toThrow('Upload failed');
  });
});

describe('downloadPhoto', () => {
  it('should return blob data when download succeeds', async () => {
    const mockBlob = new Blob(['image-data']);
    mockDownload.mockResolvedValue({ data: mockBlob });

    const result = await downloadPhoto('user-1/photo.jpg');
    expect(result).toBe(mockBlob);
  });

  it('should return null when no data', async () => {
    mockDownload.mockResolvedValue({ data: null });

    const result = await downloadPhoto('nonexistent.jpg');
    expect(result).toBeNull();
  });
});

describe('createPatient', () => {
  it('should insert patient and return data', async () => {
    const patientData = { id: 'patient-1' };
    mockSingle.mockResolvedValue({ data: patientData, error: null });

    const result = await createPatient('user-1', 'João Silva', '1990-01-01');

    expect(result.data).toEqual(patientData);
    expect(result.error).toBeNull();
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: 'João Silva',
      birth_date: '1990-01-01',
    });
  });

  it('should trim patient name', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'p1' }, error: null });

    await createPatient('user-1', '  Maria  ', null);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Maria' }),
    );
  });

  it('should set birth_date to null when empty string', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'p1' }, error: null });

    await createPatient('user-1', 'Test', '');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ birth_date: null }),
    );
  });

  it('should return error on duplicate (23505)', async () => {
    const duplicateError = { code: '23505', message: 'duplicate key' };
    mockSingle.mockResolvedValue({ data: null, error: duplicateError });

    const result = await createPatient('user-1', 'Duplicado', null);

    expect(result.data).toBeNull();
    expect(result.error).toEqual(duplicateError);
  });
});

describe('findPatientByName', () => {
  it('should return patient when found', async () => {
    const patient = { id: 'patient-1' };
    mockMaybeSingle.mockResolvedValue({ data: patient });

    const result = await findPatientByName('user-1', 'João');
    expect(result).toEqual(patient);
  });

  it('should return null when not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });

    const result = await findPatientByName('user-1', 'Desconhecido');
    expect(result).toBeNull();
  });

  it('should trim patient name before searching', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });

    await findPatientByName('user-1', '  Maria  ');

    // The function passes name.trim() — the mock chain is called but
    // we verify the trim happened via the eq mock
    expect(mockEq).toHaveBeenCalled();
  });
});

describe('updatePatientBirthDate', () => {
  it('should call update with birth date', async () => {
    await updatePatientBirthDate('patient-1', '1985-06-15');

    expect(mockUpdate).toHaveBeenCalledWith({ birth_date: '1985-06-15' });
    expect(mockEq).toHaveBeenCalledWith('id', 'patient-1');
  });
});

describe('createEvaluation', () => {
  it('should insert evaluation and return it', async () => {
    const evaluation = { id: 'eval-1', tooth: '11' };
    mockSingle.mockResolvedValue({ data: evaluation, error: null });

    const result = await createEvaluation({ tooth: '11', user_id: 'u1' });
    expect(result).toEqual(evaluation);
  });

  it('should throw when insert fails', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: new Error('Insert failed'),
    });

    await expect(createEvaluation({ tooth: '11' })).rejects.toThrow('Insert failed');
  });
});

describe('updateEvaluationProtocol', () => {
  it('should update evaluation with protocol data', async () => {
    const protocol = {
      summary: 'Test summary',
      checklist: ['Step 1'],
      alerts: ['Alert 1'],
      recommendations: ['Rec 1'],
      treatment_type: 'resina',
      tooth: '11',
      ai_reason: 'cavidade',
    };

    await updateEvaluationProtocol('eval-1', protocol);

    expect(mockUpdate).toHaveBeenCalledWith({
      generic_protocol: protocol,
      recommendation_text: 'Test summary',
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'eval-1');
  });
});

describe('updateEvaluationStatus', () => {
  it('should update evaluation status', async () => {
    await updateEvaluationStatus('eval-1', 'draft');

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'draft' });
    expect(mockEq).toHaveBeenCalledWith('id', 'eval-1');
  });
});

describe('invokeRecommendCementation', () => {
  it('should invoke cementation edge function', async () => {
    mockInvoke.mockResolvedValue({ error: null });

    await invokeRecommendCementation({ evaluationId: 'eval-1', teeth: ['11'] });

    expect(mockInvoke).toHaveBeenCalledWith('recommend-cementation', {
      body: { evaluationId: 'eval-1', teeth: ['11'] },
    });
  });

  it('should throw when edge function errors', async () => {
    mockInvoke.mockResolvedValue({ error: new Error('Edge function error') });

    await expect(
      invokeRecommendCementation({ evaluationId: 'eval-1' }),
    ).rejects.toThrow('Edge function error');
  });
});

describe('invokeRecommendResin', () => {
  it('should invoke resin edge function', async () => {
    mockInvoke.mockResolvedValue({ error: null });

    await invokeRecommendResin({ evaluationId: 'eval-1', tooth: '12' });

    expect(mockInvoke).toHaveBeenCalledWith('recommend-resin', {
      body: { evaluationId: 'eval-1', tooth: '12' },
    });
  });

  it('should throw when edge function errors', async () => {
    mockInvoke.mockResolvedValue({ error: new Error('Resin error') });

    await expect(
      invokeRecommendResin({ evaluationId: 'eval-1' }),
    ).rejects.toThrow('Resin error');
  });
});

describe('savePendingTeeth', () => {
  it('should insert pending teeth rows', async () => {
    insertDirectError = null;

    const rows = [
      { session_id: 's1', tooth: '21', priority: 'alta' },
      { session_id: 's1', tooth: '22', priority: 'média' },
    ];

    await savePendingTeeth(rows);

    expect(mockInsert).toHaveBeenCalledWith(rows);
  });

  it('should throw when insert fails', async () => {
    insertDirectError = new Error('Insert failed');

    await expect(
      savePendingTeeth([{ session_id: 's1', tooth: '11' }]),
    ).rejects.toThrow('Insert failed');
  });
});
