import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleError, handleApiError, handleSupabaseError, withErrorHandler } from '../errorHandler';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock logger to prevent console output during tests
vi.mock('../logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('handleError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show fallback message when no error info available', () => {
    const result = handleError({}, 'Fallback message');
    
    expect(result).toBe('Fallback message');
    expect(toast.error).toHaveBeenCalledWith('Fallback message', { duration: 5000 });
  });

  it('should map database error code 23505 to duplicate record message', () => {
    const result = handleError({ code: '23505' });
    
    expect(result).toBe('Este registro já existe. Verifique os dados.');
    expect(toast.error).toHaveBeenCalledWith(
      'Este registro já existe. Verifique os dados.',
      { duration: 5000 }
    );
  });

  it('should map database error code 23503 to reference error message', () => {
    const result = handleError({ code: '23503' });
    
    expect(result).toBe('Erro de referência. Dados relacionados não encontrados.');
  });

  it('should map auth error invalid_credentials', () => {
    const result = handleError({ code: 'invalid_credentials' });
    
    expect(result).toBe('Email ou senha incorretos.');
  });

  it('should detect network error from message', () => {
    const result = handleError({ message: 'Failed to fetch data from server' });
    
    expect(result).toBe('Erro de conexão. Verifique sua internet.');
  });

  it('should detect JWT/token error from message', () => {
    const result = handleError({ message: 'JWT token is expired' });
    
    expect(result).toBe('Sessão expirada. Faça login novamente.');
  });

  it('should detect duplicate key error from message', () => {
    const result = handleError({ message: 'duplicate key value violates unique constraint' });
    
    expect(result).toBe('Este registro já existe. Verifique os dados.');
  });

  it('should use original message if short enough', () => {
    const result = handleError({ message: 'Custom error message' });
    
    expect(result).toBe('Custom error message');
  });

  it('should use fallback for very long messages', () => {
    const longMessage = 'A'.repeat(150);
    const result = handleError({ message: longMessage }, 'Fallback');
    
    expect(result).toBe('Fallback');
  });

  it('should handle Error objects', () => {
    const error = new Error('Standard error');
    const result = handleError(error);
    
    expect(result).toBe('Standard error');
  });
});

describe('handleApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show network error for fetch failures', () => {
    handleApiError({ message: 'Failed to fetch' }, 'carregar dados');
    
    expect(toast.error).toHaveBeenCalledWith(
      'Erro de conexão. Verifique sua internet.',
      { duration: 5000 }
    );
  });

  it('should show network error for network-related errors', () => {
    handleApiError({ message: 'Network request failed' }, 'salvar');
    
    expect(toast.error).toHaveBeenCalledWith(
      'Erro de conexão. Verifique sua internet.',
      { duration: 5000 }
    );
  });

  it('should use context in fallback message', () => {
    handleApiError({}, 'salvar paciente');
    
    expect(toast.error).toHaveBeenCalledWith(
      'Erro ao salvar paciente',
      { duration: 5000 }
    );
  });
});

describe('handleSupabaseError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when no error', () => {
    const result = handleSupabaseError(null, 'test');
    
    expect(result).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should return true and show toast when error exists', () => {
    const result = handleSupabaseError({ code: '23505' }, 'criar registro');
    
    expect(result).toBe(true);
    expect(toast.error).toHaveBeenCalled();
  });

  it('should use error message when no code match', () => {
    const result = handleSupabaseError(
      { message: 'Custom Supabase error' },
      'buscar dados'
    );
    
    expect(result).toBe(true);
    expect(toast.error).toHaveBeenCalledWith('Custom Supabase error', { duration: 5000 });
  });

  it('should use context as fallback', () => {
    const result = handleSupabaseError({}, 'atualizar perfil');
    
    expect(result).toBe(true);
    expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar perfil', { duration: 5000 });
  });
});

describe('withErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return result on success', async () => {
    const operation = vi.fn().mockResolvedValue({ data: 'test' });
    
    const result = await withErrorHandler(operation, 'test operation');
    
    expect(result).toEqual({ data: 'test' });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should return null and show toast on error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    
    const result = await withErrorHandler(operation, 'processar dados');
    
    expect(result).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle network errors in wrapped operations', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    
    const result = await withErrorHandler(operation, 'carregar');
    
    expect(result).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      'Erro de conexão. Verifique sua internet.',
      { duration: 5000 }
    );
  });
});
