'use client';

import { WizardContainer } from '@/components/wizard';
import { useLPStore } from '@/store/lpStore';
import {
  MaterialImageStep,
  ReferenceImageStep,
  TextInputStep,
  ColorSettingsStep,
  GenerationSettingsStep,
  GenerateStep,
} from '@/components/steps';

const stepComponents = [
  MaterialImageStep,
  ReferenceImageStep,
  TextInputStep,
  ColorSettingsStep,
  GenerationSettingsStep,
  GenerateStep,
];

export default function Home() {
  const { wizard } = useLPStore();
  const StepComponent = stepComponents[wizard.currentStep];

  return (
    <WizardContainer>
      <StepComponent />
    </WizardContainer>
  );
}
