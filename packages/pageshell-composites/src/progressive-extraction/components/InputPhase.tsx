/**
 * ProgressiveExtractionPage Input Phase
 *
 * Text input phase component for ProgressiveExtractionPage.
 *
 * @module progressive-extraction/components/InputPhase
 */

'use client';

import * as React from 'react';
import { Button, Label, Textarea, resolveIcon } from '@pageshell/primitives';
import { pageToast } from '@pageshell/core';
import { Sparkles, Loader2 } from 'lucide-react';

import type { InputPhaseConfig, ProgressiveExtractionPageSlots } from '../types';
import { progressiveExtractionPageDefaults } from '../utils';

// =============================================================================
// Types
// =============================================================================

export interface InputPhaseProps {
  /** Input phase configuration */
  config: InputPhaseConfig;
  /** Callback when input is complete */
  onComplete: (id: string) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Optional slots */
  slots?: ProgressiveExtractionPageSlots;
}

// =============================================================================
// Component
// =============================================================================

export function InputPhase({ config, onComplete, onCancel, slots }: InputPhaseProps) {
  const [text, setText] = React.useState('');

  // Use createEndpoint mutation if provided
  const mutation = config.createEndpoint?.useMutation();

  const minLength =
    config.minLength ?? progressiveExtractionPageDefaults.inputPhase.minLength;
  const rows = config.rows ?? progressiveExtractionPageDefaults.inputPhase.rows;
  const submitLabel =
    config.submitLabel ??
    progressiveExtractionPageDefaults.inputPhase.submitLabel;
  const SubmitIcon = resolveIcon(config.submitIcon) ?? Sparkles;
  const isPending = config.isSubmitting ?? mutation?.isPending ?? false;

  const handleSubmit = async () => {
    if (text.length < minLength) return;

    try {
      let id: string;

      if (config.onSubmit) {
        // Direct onSubmit handler
        id = await config.onSubmit(text);
      } else if (mutation && config.getIdFromResult) {
        // tRPC endpoint pattern
        const result = await mutation.mutateAsync({ rawText: text });
        id = config.getIdFromResult(result);
        if (config.successMessage) {
          pageToast.success(config.successMessage);
        }
      } else {
        throw new Error('InputPhase: Either onSubmit or createEndpoint + getIdFromResult must be provided');
      }

      onComplete(id);
    } catch (error) {
      // Let tRPC/React Query handle the error display
      throw error;
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col flex-1 min-h-0">
      {slots?.beforeInput}

      <div className="flex-1 flex flex-col min-h-0 space-y-2">
        <Label htmlFor="input-text">{config.label}</Label>
        <Textarea
          id="input-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={config.placeholder}
          rows={rows}
          className="flex-1 min-h-[200px] md:min-h-[300px] resize-none"
        />
        {config.hint && (
          <p className="text-sm text-muted-foreground">{config.hint}</p>
        )}
      </div>

      {slots?.afterInput}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 mt-auto">
        <Button
          variant="outline"
          className="h-11"
          onClick={onCancel ?? (() => window.history.back())}
        >
          Cancel
        </Button>
        <Button
          className="h-11"
          onClick={handleSubmit}
          disabled={text.length < minLength || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SubmitIcon className="size-4 mr-2" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

InputPhase.displayName = 'InputPhase';
