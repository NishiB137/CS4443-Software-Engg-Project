import React from 'react';

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-start max-w-full mb-10 overflow-x-auto pb-4 px-2 snap-x">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className={`flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-xs transition-colors
                ${isActive ? 'bg-blue-600 text-white border-blue-600' : 
                  isCompleted ? 'bg-white text-blue-600 border-blue-600' : 'bg-white text-gray-400 border-gray-200'}`}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-10 sm:w-16 h-[2px] mx-3 rounded-full flex-shrink-0 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};