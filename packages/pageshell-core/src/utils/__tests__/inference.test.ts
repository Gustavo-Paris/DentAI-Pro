import { describe, it, expect } from 'vitest';
import {
  inferRowActionDefaults,
  applyRowActionsDefaults,
  inferColumnDefaults,
  applyColumnsDefaults,
  normalizeFilterOptions,
  applyFilterDefaults,
  applyFiltersDefaults,
  inferStatDefaults,
  applyStatsDefaults,
  type RowActionConfig,
  type InferColumnConfig,
  type InferFilterConfig,
  type StatConfig,
} from '../inference';

describe('inferRowActionDefaults', () => {
  describe('variant inference', () => {
    it('should infer destructive variant for delete action', () => {
      const config: RowActionConfig<unknown> = { label: 'Excluir' };
      const result = inferRowActionDefaults('delete', config);
      expect(result.variant).toBe('destructive');
    });

    it('should infer destructive variant for remove action', () => {
      const config: RowActionConfig<unknown> = { label: 'Remover' };
      const result = inferRowActionDefaults('remove', config);
      expect(result.variant).toBe('destructive');
    });

    it('should infer destructive variant for archive action', () => {
      const config: RowActionConfig<unknown> = { label: 'Arquivar' };
      const result = inferRowActionDefaults('archive', config);
      expect(result.variant).toBe('destructive');
    });

    it('should not override explicit variant', () => {
      const config: RowActionConfig<unknown> = { label: 'Excluir', variant: 'default' };
      const result = inferRowActionDefaults('delete', config);
      expect(result.variant).toBe('default');
    });

    it('should not infer variant for unknown action', () => {
      const config: RowActionConfig<unknown> = { label: 'Edit' };
      const result = inferRowActionDefaults('edit', config);
      expect(result.variant).toBeUndefined();
    });
  });

  describe('confirmation inference', () => {
    it('should auto-add confirmation for delete action', () => {
      const config: RowActionConfig<unknown> = { label: 'Excluir' };
      const result = inferRowActionDefaults('delete', config);
      expect(result.confirm).toEqual({
        title: 'Excluir item?',
        description: 'Esta ação não pode ser desfeita.',
        variant: 'destructive',
        confirmText: 'Excluir',
      });
    });

    it('should expand confirm: true for delete action', () => {
      const config: RowActionConfig<unknown> = { label: 'Excluir', confirm: true };
      const result = inferRowActionDefaults('delete', config);
      expect(result.confirm).toEqual({
        title: 'Excluir item?',
        description: 'Esta ação não pode ser desfeita.',
        variant: 'destructive',
        confirmText: 'Excluir',
      });
    });

    it('should expand confirm: true for remove action', () => {
      const config: RowActionConfig<unknown> = { label: 'Remover', confirm: true };
      const result = inferRowActionDefaults('remove', config);
      expect(result.confirm).toEqual({
        title: 'Remover item?',
        description: 'Esta ação não pode ser desfeita.',
        variant: 'destructive',
        confirmText: 'Remover',
      });
    });

    it('should expand confirm: true for archive action', () => {
      const config: RowActionConfig<unknown> = { label: 'Arquivar', confirm: true };
      const result = inferRowActionDefaults('archive', config);
      expect(result.confirm).toEqual({
        title: 'Arquivar item?',
        description: 'O item será movido para arquivados.',
        variant: 'warning',
        confirmText: 'Arquivar',
      });
    });

    it('should not override explicit confirm object', () => {
      const customConfirm = { title: 'Custom title', variant: 'default' as const };
      const config: RowActionConfig<unknown> = { label: 'Excluir', confirm: customConfirm };
      const result = inferRowActionDefaults('delete', config);
      expect(result.confirm).toEqual(customConfirm);
    });

    it('should not add confirmation for non-delete actions', () => {
      const config: RowActionConfig<unknown> = { label: 'Editar' };
      const result = inferRowActionDefaults('edit', config);
      expect(result.confirm).toBeUndefined();
    });

    it('should respect confirm: false', () => {
      const config: RowActionConfig<unknown> = { label: 'Excluir', confirm: false };
      const result = inferRowActionDefaults('delete', config);
      expect(result.confirm).toBe(false);
    });
  });
});

describe('applyRowActionsDefaults', () => {
  it('should return empty array for undefined actions', () => {
    const result = applyRowActionsDefaults(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty object', () => {
    const result = applyRowActionsDefaults({});
    expect(result).toEqual([]);
  });

  it('should apply defaults to all actions', () => {
    const actions: Record<string, RowActionConfig<unknown>> = {
      edit: { label: 'Editar' },
      delete: { label: 'Excluir' },
    };
    const result = applyRowActionsDefaults(actions);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ key: 'edit', label: 'Editar' });
    expect(result[1]).toMatchObject({
      key: 'delete',
      label: 'Excluir',
      variant: 'destructive',
    });
  });

  it('should add key property to each action', () => {
    const actions = {
      view: { label: 'Ver' },
      edit: { label: 'Editar' },
    };
    const result = applyRowActionsDefaults(actions);

    expect(result[0]!.key).toBe('view');
    expect(result[1]!.key).toBe('edit');
  });
});

describe('inferColumnDefaults', () => {
  describe('format inference', () => {
    it('should infer date format for createdAt', () => {
      const column: InferColumnConfig<unknown> = { key: 'createdAt' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('date');
    });

    it('should infer date format for updatedAt', () => {
      const column: InferColumnConfig<unknown> = { key: 'updatedAt' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('date');
    });

    it('should infer date format for publishedAt', () => {
      const column: InferColumnConfig<unknown> = { key: 'publishedAt' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('date');
    });

    it('should infer date format for keys ending with Date', () => {
      const column: InferColumnConfig<unknown> = { key: 'birthDate' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('date');
    });

    it('should infer currency format for price', () => {
      const column: InferColumnConfig<unknown> = { key: 'price' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('currency');
    });

    it('should infer currency format for amount', () => {
      const column: InferColumnConfig<unknown> = { key: 'amount' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('currency');
    });

    it('should infer currency format for revenue', () => {
      const column: InferColumnConfig<unknown> = { key: 'revenue' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('currency');
    });

    it('should infer status format for status', () => {
      const column: InferColumnConfig<unknown> = { key: 'status' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('status');
    });

    it('should infer boolean format for isActive', () => {
      const column: InferColumnConfig<unknown> = { key: 'isActive' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('boolean');
    });

    it('should infer boolean format for hasPermission', () => {
      const column: InferColumnConfig<unknown> = { key: 'hasPermission' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('boolean');
    });

    it('should infer boolean format for enabled', () => {
      const column: InferColumnConfig<unknown> = { key: 'enabled' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('boolean');
    });

    it('should infer number format for count', () => {
      const column: InferColumnConfig<unknown> = { key: 'count' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('number');
    });

    it('should infer number format for quantity', () => {
      const column: InferColumnConfig<unknown> = { key: 'quantity' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('number');
    });

    it('should infer percent format for percent', () => {
      const column: InferColumnConfig<unknown> = { key: 'percent' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('percent');
    });

    it('should infer percent format for conversionRate', () => {
      const column: InferColumnConfig<unknown> = { key: 'conversionRate' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('percent');
    });

    it('should not override explicit format', () => {
      const column: InferColumnConfig<unknown> = { key: 'createdAt', format: 'text' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBe('text');
    });

    it('should not infer format for unknown keys', () => {
      const column: InferColumnConfig<unknown> = { key: 'name' };
      const result = inferColumnDefaults(column);
      expect(result.format).toBeUndefined();
    });
  });

  describe('alignment inference', () => {
    it('should infer right alignment for currency format', () => {
      const column: InferColumnConfig<unknown> = { key: 'price' };
      const result = inferColumnDefaults(column);
      expect(result.align).toBe('right');
    });

    it('should infer right alignment for number format', () => {
      const column: InferColumnConfig<unknown> = { key: 'count' };
      const result = inferColumnDefaults(column);
      expect(result.align).toBe('right');
    });

    it('should infer center alignment for boolean format', () => {
      const column: InferColumnConfig<unknown> = { key: 'isActive' };
      const result = inferColumnDefaults(column);
      expect(result.align).toBe('center');
    });

    it('should infer left alignment for date format', () => {
      const column: InferColumnConfig<unknown> = { key: 'createdAt' };
      const result = inferColumnDefaults(column);
      expect(result.align).toBe('left');
    });

    it('should not override explicit alignment', () => {
      const column: InferColumnConfig<unknown> = { key: 'price', align: 'left' };
      const result = inferColumnDefaults(column);
      expect(result.align).toBe('left');
    });

    it('should not infer alignment without format', () => {
      const column: InferColumnConfig<unknown> = { key: 'name' };
      const result = inferColumnDefaults(column);
      expect(result.align).toBeUndefined();
    });
  });
});

describe('applyColumnsDefaults', () => {
  it('should return empty array for empty input', () => {
    const result = applyColumnsDefaults([]);
    expect(result).toEqual([]);
  });

  it('should apply defaults to all columns', () => {
    const columns: InferColumnConfig<unknown>[] = [
      { key: 'name', label: 'Nome' },
      { key: 'price' },
      { key: 'createdAt' },
    ];
    const result = applyColumnsDefaults(columns);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ key: 'name', label: 'Nome' });
    expect(result[1]).toMatchObject({ key: 'price', format: 'currency', align: 'right' });
    expect(result[2]).toMatchObject({ key: 'createdAt', format: 'date', align: 'left' });
  });
});

describe('normalizeFilterOptions', () => {
  it('should convert string options to FilterOption', () => {
    const options = ['all', 'active', 'inactive'];
    const result = normalizeFilterOptions(options);

    expect(result).toEqual([
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ]);
  });

  it('should preserve FilterOption objects', () => {
    const options = [
      { value: 'custom', label: 'Custom Label' },
      { value: 'other', label: 'Other Label' },
    ];
    const result = normalizeFilterOptions(options);

    expect(result).toEqual(options);
  });

  it('should add label to FilterOption if missing', () => {
    // Testing runtime behavior - function handles objects without label property
    const options = [
      { value: 'pending' },
      { value: 'completed' },
    ] as Array<string | { value: string; label: string }>;
    const result = normalizeFilterOptions(options);

    expect(result).toEqual([
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'Completed' },
    ]);
  });

  it('should handle mixed string and object options', () => {
    const options = [
      'all',
      { value: 'custom', label: 'Custom Label' },
      'standard',
    ];
    const result = normalizeFilterOptions(options);

    expect(result).toEqual([
      { value: 'all', label: 'All' },
      { value: 'custom', label: 'Custom Label' },
      { value: 'standard', label: 'Standard' },
    ]);
  });

  it('should return empty array for empty input', () => {
    const result = normalizeFilterOptions([]);
    expect(result).toEqual([]);
  });
});

describe('applyFilterDefaults', () => {
  it('should apply defaults to filter config', () => {
    const config: InferFilterConfig = {
      options: ['all', 'active', 'inactive'],
    };
    const result = applyFilterDefaults('status', config);

    expect(result).toMatchObject({
      key: 'status',
      label: 'Status',
      defaultValue: 'all',
    });
    expect(result.options).toEqual([
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ]);
  });

  it('should not override explicit label', () => {
    const config: InferFilterConfig = {
      label: 'Custom Status',
      options: ['all'],
    };
    const result = applyFilterDefaults('status', config);

    expect(result.label).toBe('Custom Status');
  });

  it('should not override explicit defaultValue', () => {
    const config: InferFilterConfig = {
      options: ['all', 'active'],
      defaultValue: 'active',
    };
    const result = applyFilterDefaults('status', config);

    expect(result.defaultValue).toBe('active');
  });

  it('should preserve render function', () => {
    const render = () => null;
    const config: InferFilterConfig = {
      options: ['all'],
      render,
    };
    const result = applyFilterDefaults('status', config);

    expect(result.render).toBe(render);
  });
});

describe('applyFiltersDefaults', () => {
  it('should return empty array for undefined filters', () => {
    const result = applyFiltersDefaults(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty object', () => {
    const result = applyFiltersDefaults({});
    expect(result).toEqual([]);
  });

  it('should apply defaults to all filters', () => {
    const filters: Record<string, InferFilterConfig> = {
      status: { options: ['all', 'active', 'inactive'] },
      type: { options: ['all', 'course', 'module'], label: 'Tipo' },
    };
    const result = applyFiltersDefaults(filters);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ key: 'status', label: 'Status' });
    expect(result[1]).toMatchObject({ key: 'type', label: 'Tipo' });
  });
});

describe('inferStatDefaults', () => {
  // Note: The implementation uses case-sensitive includes() check
  // So 'revenue' matches but 'Revenue' does not

  it('should infer currency format for keys containing revenue (lowercase)', () => {
    const stat: StatConfig = { key: 'total_revenue', label: 'Receita Total' };
    const result = inferStatDefaults(stat);
    expect(result.format).toBe('currency');
  });

  it('should infer currency format for keys containing price (lowercase)', () => {
    const stat: StatConfig = { key: 'average_price', label: 'Preço Médio' };
    const result = inferStatDefaults(stat);
    expect(result.format).toBe('currency');
  });

  it('should infer currency format for keys containing amount (lowercase)', () => {
    const stat: StatConfig = { key: 'total_amount', label: 'Total' };
    const result = inferStatDefaults(stat);
    expect(result.format).toBe('currency');
  });

  it('should infer percent format for keys containing percent (lowercase)', () => {
    const stat: StatConfig = { key: 'completion_percent', label: 'Conclusão' };
    const result = inferStatDefaults(stat);
    expect(result.format).toBe('percent');
  });

  it('should infer percent format for keys containing rate (lowercase)', () => {
    const stat: StatConfig = { key: 'conversion_rate', label: 'Taxa de Conversão' };
    const result = inferStatDefaults(stat);
    expect(result.format).toBe('percent');
  });

  it('should not infer format for camelCase keys (case-sensitive matching)', () => {
    // The implementation is case-sensitive, so camelCase keys don't match
    const stat: StatConfig = { key: 'totalRevenue', label: 'Receita' };
    const result = inferStatDefaults(stat);
    expect(result.format).toBeUndefined();
  });

  it('should not override explicit format', () => {
    const stat: StatConfig = { key: 'total_revenue', label: 'Receita', format: 'number' };
    const result = inferStatDefaults(stat);
    expect(result.format).toBe('number');
  });

  it('should not infer format for unknown keys', () => {
    const stat: StatConfig = { key: 'totalUsers', label: 'Usuários' };
    const result = inferStatDefaults(stat);
    expect(result.format).toBeUndefined();
  });

  it('should preserve other properties', () => {
    const MockIcon = () => null;
    const stat: StatConfig = { key: 'total_revenue', label: 'Receita', icon: MockIcon };
    const result = inferStatDefaults(stat);
    expect(result.icon).toBe(MockIcon);
  });
});

describe('applyStatsDefaults', () => {
  it('should return empty array for undefined stats', () => {
    const result = applyStatsDefaults(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty array', () => {
    const result = applyStatsDefaults([]);
    expect(result).toEqual([]);
  });

  it('should apply defaults to all stats', () => {
    const stats: StatConfig[] = [
      { key: 'total_revenue', label: 'Receita' },
      { key: 'conversion_rate', label: 'Conversão' },
      { key: 'totalUsers', label: 'Usuários' },
    ];
    const result = applyStatsDefaults(stats);

    expect(result).toHaveLength(3);
    expect(result[0]!.format).toBe('currency');
    expect(result[1]!.format).toBe('percent');
    expect(result[2]!.format).toBeUndefined();
  });
});
