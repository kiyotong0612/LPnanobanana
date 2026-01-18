'use client';

import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StepIndicator } from './StepIndicator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ApiKeySettings } from '@/components/ApiKeySettings';
import { useLPStore } from '@/store/lpStore';
import { cn } from '@/lib/utils';

interface WizardContainerProps {
  children: ReactNode;
}

export function WizardContainer({ children }: WizardContainerProps) {
  const {
    wizard,
    nextStep,
    prevStep,
    setCurrentStep,
    canProceedToNext,
    getStepValidationMessage,
    isStepComplete,
  } = useLPStore();
  const { currentStep, steps, canGoBack } = wizard;

  const isLastStep = currentStep === steps.length - 1;
  const currentStepConfig = steps[currentStep];
  const canProceed = canProceedToNext();
  const validationMessage = getStepValidationMessage(currentStep);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--banana)] flex items-center justify-center glow-banana-sm">
              <span className="text-xl">🍌</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LP Generator</h1>
              <p className="text-xs text-muted-foreground">Powered by Nano Banana</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ApiKeySettings />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Step Indicator */}
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => {
            if (step < currentStep) {
              setCurrentStep(step);
            }
          }}
          isStepComplete={isStepComplete}
        />

        {/* Current Step Header */}
        <div className="text-center mb-8 page-transition" key={currentStep}>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">
            {currentStepConfig?.title}
          </h2>
          <p className="text-muted-foreground">
            {currentStepConfig?.description}
          </p>
        </div>

        {/* Step Content */}
        <Card className="glass border-border/50 p-6 md:p-8 page-transition" key={`content-${currentStep}`}>
          {children}
        </Card>

        {/* Validation Message */}
        {validationMessage && !canProceed && (
          <div className="mt-4 text-center">
            <p className="text-sm text-amber-500 dark:text-amber-400">
              {validationMessage}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={!canGoBack}
            className={cn(
              'gap-2 transition-all',
              !canGoBack && 'opacity-0 pointer-events-none'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            戻る
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{currentStep + 1}</span>
            <span>/</span>
            <span>{steps.length}</span>
          </div>

          <Button
            onClick={nextStep}
            disabled={isLastStep || !canProceed}
            className={cn(
              'gap-2 bg-[var(--banana)] text-[var(--banana-foreground)] hover:bg-[var(--banana)]/90',
              'glow-banana-sm transition-all',
              isLastStep && 'opacity-0 pointer-events-none'
            )}
          >
            次へ
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p>© 2024 LP Generator. Built with Nano Banana API.</p>
      </footer>
    </div>
  );
}
