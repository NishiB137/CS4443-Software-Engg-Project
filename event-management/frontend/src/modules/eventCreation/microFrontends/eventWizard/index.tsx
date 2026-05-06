import { useBlocker } from 'react-router-dom';
import { useEventWizard } from '@/modules/eventCreation/microFrontends/eventWizard/hooks/useEventWizard';
import { Stepper } from '@/modules/eventCreation/components/Stepper.tsx';
import { Step1Template } from '@/modules/eventCreation/microFrontends/eventWizard/components/Step1Template';
import { GenericFormStep } from '@/modules/eventCreation/microFrontends/eventWizard/components/GenericFormStep';
import { Step3Visibility } from '@/modules/eventCreation/microFrontends/eventWizard/components/Step3Visibility';
import { StepRegistration } from '@/modules/eventCreation/microFrontends/eventWizard/components/StepRegistration';
import { Step4Sessions } from '@/modules/eventCreation/microFrontends/eventWizard/components/Step4Sessions';
import { Step5Faq } from '@/modules/eventCreation/microFrontends/eventWizard/components/Step5Faq';
import { Step4Review } from '@/modules/eventCreation/microFrontends/eventWizard/components/Step4Review';
import { TicketingTiersStep } from '@/modules/eventCreation/microFrontends/eventWizard/components/TicketingTiersStep';
import { StepTeamReview } from '@/modules/eventCreation/microFrontends/eventWizard/components/StepTeamReview';

import type { ApiEvent } from '@/services/api';

export const EventWizardMFE: React.FC<{ initialEventData?: ApiEvent | null; eventId?: string }> = ({ initialEventData, eventId }) => {
  const {
    currentStep,
    totalSteps,
    steps,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    submitEvent,
    isSubmitting,
    submitError,
    stepErrors,
    saveAsTemplate,
    isDirty,
    setIsDirty,
    originalStatus,
  } = useEventWizard({ initialEventData, eventId });

  const isEditingPublished = !!eventId && originalStatus === 'published';

  // ─── Block navigation if there are unsaved changes ─────────
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname
  );

  const renderStepContent = () => {
    const props = {
      data: formData,
      updateData: updateFormData,
      errors: stepErrors as Record<string, string>,
    };
    
    const stepDef = steps[currentStep - 1];
    if (!stepDef) return null;

    switch (stepDef.type) {
      case 'template': return <Step1Template {...props} />;
      case 'form': return <GenericFormStep formName={stepDef.formName!} {...props} />;
      case 'visibility': return <Step3Visibility {...props} />;
      case 'registration': return <StepRegistration {...props} />;
      case 'ticketingTiers': return <TicketingTiersStep {...props} />;
      case 'sessions': return <Step4Sessions {...props} />;
      case 'faq': return <Step5Faq {...props} />;
      case 'team_review': return <StepTeamReview {...props} />;
      case 'review': return <Step4Review {...props} />;
      default: return null;
    }
  };

  const hasErrors = Object.keys(stepErrors).length > 0;
  const stepTitles = steps.map(s => s.title);

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 pb-36 relative min-h-screen flex flex-col">

      {currentStep > 1 && (
        <Stepper currentStep={currentStep} steps={stepTitles} />
      )}

      {/* Unsaved Changes Blocker Modal */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-gray-600 mb-6">
              You have unsaved progress in the event wizard. Are you sure you want to leave? Your changes will be lost if you discard them.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => blocker.reset()}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsDirty(false); // Clear dirty state so we can navigate
                  setTimeout(() => blocker.proceed(), 0);
                }}
                className="px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition"
              >
                Discard Changes
              </button>
              <button
                onClick={async () => {
                  blocker.reset();
                  await submitEvent(true);
                }}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition flex items-center justify-center"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-level error summary banner */}
      {hasErrors && (
        <div className="mt-4 mb-2 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5 text-sm text-red-700">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="font-semibold">Please fix the following before continuing:</p>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {Object.values(stepErrors).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {submitError && (() => {
        const lines = submitError.split('\n').filter(Boolean);
        return (
          <div className="mt-3 mb-3 sticky top-2 z-20 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2 max-h-56 overflow-auto">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {lines.length > 1 ? (
              <ul className="list-disc list-inside space-y-0.5">
                {lines.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            ) : (
              <span>{submitError}</span>
            )}
          </div>
        );
      })()}

      <div className="mt-6 mb-24">
        {renderStepContent()}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 w-full bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-between items-center px-6 sm:px-10">
        <button
          onClick={prevStep}
          disabled={currentStep === 1 || isSubmitting}
          className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium disabled:opacity-50 hover:bg-gray-50 transition text-sm"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={saveAsTemplate}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition disabled:opacity-50 text-sm"
          >
            Save as Template
          </button>

          {!isEditingPublished && (
            <button
              onClick={() => submitEvent(true)}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50 text-sm flex items-center gap-2"
            >
              {isSubmitting && formData.submitAs === 'draft' && (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
              )}
              {isSubmitting && formData.submitAs === 'draft'
                ? 'Saving...'
                : 'Save as Draft'}
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm text-sm"
            >
              Continue
              <svg className="w-4 h-4 inline-block ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => submitEvent(false)}
              disabled={isSubmitting}
              className={`px-8 py-2.5 text-white rounded-lg font-bold transition shadow-md disabled:opacity-60 text-sm flex items-center gap-2 ${
                isEditingPublished ? 'bg-blue-600 hover:bg-blue-700' : 'bg-violet-600 hover:bg-violet-700'
              }`}
            >
              {isSubmitting && formData.submitAs !== 'draft' ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {isEditingPublished ? 'Saving...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {isEditingPublished 
                    ? 'Save & Keep Published' 
                    : (!!eventId && originalStatus === 'review' && formData.reviewerId === localStorage.getItem('userId'))
                      ? 'Approve Event'
                      : (formData.requiresReview && formData.reviewerId ? 'Submit for Review' : 'Publish Event')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
