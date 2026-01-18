'use client';

import { Check, ImagePlus, Palette, Type, Settings, Sparkles, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepConfig } from '@/types';

interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const stepIcons = [
  ImagePlus,
  Eye,
  Type,
  Palette,
  Settings,
  Sparkles,
];

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2 z-0">
          <div
            className="h-full bg-[var(--banana)] transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const Icon = stepIcons[index] || Sparkles;
          const isCompleted = step.isComplete;
          const isActive = index === currentStep;
          const isPast = index < currentStep;

          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(index)}
              disabled={!isPast && !isActive}
              className={cn(
                'relative z-10 flex flex-col items-center gap-2 group',
                'transition-all duration-300',
                (isPast || isActive) && 'cursor-pointer',
                !isPast && !isActive && 'cursor-not-allowed opacity-50'
              )}
            >
              {/* Step circle */}
              <div
                className={cn(
                  'relative w-12 h-12 rounded-full flex items-center justify-center',
                  'transition-all duration-300 transform',
                  'border-2',
                  isActive && 'step-active bg-[var(--banana)] border-[var(--banana)] scale-110',
                  isCompleted && !isActive && 'bg-[var(--banana)] border-[var(--banana)]',
                  !isCompleted && !isActive && 'bg-card border-border',
                  'group-hover:scale-105'
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-5 h-5 text-[var(--banana-foreground)]" />
                ) : (
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-[var(--banana-foreground)]' : 'text-muted-foreground'
                    )}
                  />
                )}
              </div>

              {/* Step label */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isActive && 'text-[var(--banana)]',
                    isCompleted && !isActive && 'text-foreground',
                    !isCompleted && !isActive && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
