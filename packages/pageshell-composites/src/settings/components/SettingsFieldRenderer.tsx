/**
 * SettingsPage Field Renderer
 *
 * Form field renderer for SettingsPage.
 *
 * @module settings/components/SettingsFieldRenderer
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import {
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Switch,
} from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface SettingsFieldConfig {
  /** Field name */
  name: string;
  /** Field type */
  type: string;
  /** Field label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Field description */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Options for select fields */
  options?: (string | { value: string; label: string })[];
}

export interface SettingsFieldRendererProps {
  /** Field configuration */
  field: SettingsFieldConfig;
  /** Current value */
  value: unknown;
  /** Error message */
  error?: string;
  /** Change handler */
  onChange: (value: unknown) => void;
}

// =============================================================================
// Component
// =============================================================================

export const SettingsFieldRenderer = React.memo(function SettingsFieldRenderer({
  field,
  value,
  error,
  onChange,
}: SettingsFieldRendererProps) {
  const handleChange = (newValue: unknown) => {
    onChange(newValue);
  };

  const labelContent = (
    <label
      htmlFor={field.name}
      className="block text-sm font-medium text-foreground mb-1"
    >
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );

  switch (field.type) {
    case 'text':
    case 'email':
    case 'password':
    case 'number':
      return (
        <div className="space-y-1">
          {labelContent}
          <Input
            id={field.name}
            type={field.type}
            value={(value as string) ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && 'border-destructive')}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-1">
          {labelContent}
          <Textarea
            id={field.name}
            value={(value as string) ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && 'border-destructive')}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    case 'switch':
      return (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label
              htmlFor={field.name}
              className="text-sm font-medium text-foreground"
            >
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
          <Switch
            id={field.name}
            checked={!!value}
            onCheckedChange={handleChange}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1">
          {labelContent}
          <Select
            value={(value as string) ?? ''}
            onValueChange={handleChange}
          >
            <SelectTrigger
              id={field.name}
              className={cn(error && 'border-destructive')}
            >
              <SelectValue placeholder={field.placeholder ?? 'Selecione...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => {
                const option =
                  typeof opt === 'string' ? { value: opt, label: opt } : opt;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );

    default:
      return null;
  }
});

SettingsFieldRenderer.displayName = 'SettingsFieldRenderer';
