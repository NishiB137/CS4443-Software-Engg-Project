import React from 'react';

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center w-full mb-10 overflow-x-auto">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className={`flex flex-col items-center relative`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-colors
                ${isActive ? 'bg-blue-600 text-white border-blue-600' : 
                  isCompleted ? 'bg-white text-blue-600 border-blue-600' : 'bg-white text-gray-400 border-gray-300'}`}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className={`absolute top-12 text-xs font-medium w-24 text-center ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-2 -translate-y-3 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};