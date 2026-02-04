import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal } from '../useModal';

interface TestUser {
  id: number;
  name: string;
}

describe('useModal', () => {
  describe('initial state', () => {
    it('should start closed', () => {
      const { result } = renderHook(() => useModal());
      expect(result.current.isOpen).toBe(false);
    });

    it('should start with undefined data', () => {
      const { result } = renderHook(() => useModal<TestUser>());
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('open', () => {
    it('should open the modal', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should open with data', () => {
      const { result } = renderHook(() => useModal<TestUser>());
      const user = { id: 1, name: 'John' };

      act(() => {
        result.current.open(user);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(user);
    });

    it('should open without data when none provided', () => {
      const { result } = renderHook(() => useModal<TestUser>());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('close', () => {
    it('should close the modal', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should clear data when closing', () => {
      const { result } = renderHook(() => useModal<TestUser>());
      const user = { id: 1, name: 'John' };

      act(() => {
        result.current.open(user);
      });
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('toggle', () => {
    it('should open when closed', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close when open', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should set data when toggling open', () => {
      const { result } = renderHook(() => useModal<TestUser>());
      const user = { id: 1, name: 'John' };

      act(() => {
        result.current.toggle(user);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(user);
    });

    it('should clear data when toggling closed', () => {
      const { result } = renderHook(() => useModal<TestUser>());
      const user = { id: 1, name: 'John' };

      act(() => {
        result.current.open(user);
      });
      act(() => {
        result.current.toggle();
      });

      expect(result.current.data).toBeUndefined();
    });
  });

  describe('setData', () => {
    it('should update data without changing open state', () => {
      const { result } = renderHook(() => useModal<TestUser>());
      const user1 = { id: 1, name: 'John' };
      const user2 = { id: 2, name: 'Jane' };

      act(() => {
        result.current.open(user1);
      });
      act(() => {
        result.current.setData(user2);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(user2);
    });

    it('should update data when modal is closed', () => {
      const { result } = renderHook(() => useModal<TestUser>());
      const user = { id: 1, name: 'John' };

      act(() => {
        result.current.setData(user);
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.data).toEqual(user);
    });
  });

  describe('type safety', () => {
    it('should work with primitive types', () => {
      const { result } = renderHook(() => useModal<string>());

      act(() => {
        result.current.open('hello');
      });

      expect(result.current.data).toBe('hello');
    });

    it('should work with array types', () => {
      const { result } = renderHook(() => useModal<number[]>());
      const data = [1, 2, 3];

      act(() => {
        result.current.open(data);
      });

      expect(result.current.data).toEqual(data);
    });

    it('should work without generic type parameter', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid toggles', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.toggle();
        result.current.toggle();
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should handle closing already closed modal', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should handle opening already open modal', () => {
      const { result } = renderHook(() => useModal<TestUser>());
      const user1 = { id: 1, name: 'John' };
      const user2 = { id: 2, name: 'Jane' };

      act(() => {
        result.current.open(user1);
      });
      act(() => {
        result.current.open(user2);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(user2);
    });
  });
});
