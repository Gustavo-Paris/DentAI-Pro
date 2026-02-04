/**
 * LinearFlowPage Tests
 */

/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinearFlowPage } from '../LinearFlowPage';
import type { StepConfig } from '../types';

const steps: StepConfig[] = [
  { id: 'step1', label: 'First Step' },
  { id: 'step2', label: 'Second Step' },
  { id: 'step3', label: 'Third Step' },
];

describe('LinearFlowPage', () => {
  describe('accessibility', () => {
    it('renders step buttons with type="button"', () => {
      render(
        <LinearFlowPage
          title="Test Flow"
          steps={steps}
          currentStep="step2"
        >
          {() => <div>Content</div>}
        </LinearFlowPage>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Skip navigation buttons (Back, Continue)
        if (!button.textContent?.match(/Back|Continue/)) {
          expect(button).toHaveAttribute('type', 'button');
        }
      });
    });

    it('marks current step with aria-current="step"', () => {
      render(
        <LinearFlowPage
          title="Test Flow"
          steps={steps}
          currentStep="step2"
        >
          {() => <div>Content</div>}
        </LinearFlowPage>
      );

      const currentStepButton = screen.getByRole('button', { name: /Second Step/i });
      expect(currentStepButton).toHaveAttribute('aria-current', 'step');
    });

    it('renders progress group with aria-label', () => {
      render(
        <LinearFlowPage
          title="Test Flow"
          steps={steps}
          currentStep="step2"
        >
          {() => <div>Content</div>}
        </LinearFlowPage>
      );

      const progressGroup = screen.getByRole('group', { name: /progresso|progress/i });
      expect(progressGroup).toBeInTheDocument();
    });

    it('applies aria-disabled to non-clickable steps', () => {
      render(
        <LinearFlowPage
          title="Test Flow"
          steps={steps}
          currentStep="step2"
          allowStepNavigation={false}
        >
          {() => <div>Content</div>}
        </LinearFlowPage>
      );

      const stepButtons = screen.getAllByRole('button').filter(
        (btn) => !btn.textContent?.match(/Back|Continue/)
      );

      stepButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-disabled', 'true');
      });
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to container div', () => {
      const ref = { current: null as HTMLDivElement | null };

      render(
        <LinearFlowPage
          ref={ref}
          title="Test Flow"
          steps={steps}
          currentStep="step1"
        >
          {() => <div>Content</div>}
        </LinearFlowPage>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('max-w-4xl');
    });
  });
});
