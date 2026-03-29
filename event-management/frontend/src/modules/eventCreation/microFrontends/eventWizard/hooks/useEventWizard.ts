import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EventFormData, StepErrors, StepDef } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { validateStep } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { eventApi } from '@/services/api';

const INITIAL_DATA: EventFormData = {
  template: '',
  templateName: '',
  templateFields: [],
  sessionTemplates: [],
  customFieldValues: {},
  title: '',
  shortDescription: '',
  description: '',
  eventType: 'other',
  format: 'physical',
  isFree: true,
  tags: [],
  notes: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  timezone: 'Asia/Kolkata',
  maxCapacity: '',
  venue: { name: '', address: '', city: '', state: '', country: '', onlineLink: '' },
  visibility: 'public',
  policies: { refundPolicy: '', cancellationPolicy: '', attendeeMinAge: '0' },
  organizerName: '',
  pocDetails: { name: '', email: '', phone: '' },
  faqs: [],
  sessions: [],
  submitAs: 'draft',
};

// ─── Safe ISO conversion ──────────────────────────────────────────────────────
const safeISO = (date: string, time: string): string | null => {
  if (!date.trim() || !time.trim()) return null;
  const combined = `${date}T${time}`;
  const d = new Date(combined);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() < 2000) return null;   // epoch / garbage guard
  return d.toISOString();
};

export const formatLocalDatetime = (date: string, time: string): string => {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  const d = new Date(
    year, month - 1, day,
    time ? Number(time.split(':')[0]) : 0,
    time ? Number(time.split(':')[1]) : 0,
  );
  return d.toLocaleString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

export const useEventWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep]   = useState(1);
  const [formData, setFormData]         = useState<EventFormData>(INITIAL_DATA);
  const [stepErrors, setStepErrors]     = useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);

  const steps = useMemo<StepDef[]>(() => {
    const s: StepDef[] = [{ id: 'template', title: 'Template', type: 'template' }];
    if (formData.template) {
      s.push({ id: 'remarks', title: 'Remarks', type: 'remarks' });
      // Identify distinct forms from template fields. Keep original defined order.
      const forms = Array.from(new Set(formData.templateFields.map(f => f.form ?? 'Basic Info')));
      forms.forEach(form => {
        s.push({ id: `form-${form}`, title: form, type: 'form', formName: form });
      });
      s.push({ id: 'visibility', title: 'Visibility', type: 'visibility' });
      s.push({ id: 'sessions', title: 'Sessions', type: 'sessions' });
      s.push({ id: 'review', title: 'Review & Publish', type: 'review' });
    }
    return s;
  }, [formData.template, formData.templateFields]);
  
  const totalSteps = steps.length;

  const collectAllErrors = (data: EventFormData): StepErrors => {
    return steps.reduce<StepErrors>((acc, step) => ({ ...acc, ...validateStep(step, data) }), {});
  };

  const updateFormData = (fields: Partial<EventFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    const updatedKeys = Object.keys(fields);
    setStepErrors((prev) => {
      const next = { ...prev };
      updatedKeys.forEach((k) => delete next[k]);
      return next;
    });
  };

  const nextStep = () => {
    const currentStepDef = steps[currentStep - 1];
    const errors = currentStepDef ? validateStep(currentStepDef, formData) : {};
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStepErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStepErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const submitEvent = async (asDraft = false) => {
    // ── Run ALL step validators before touching the API ──────────────────────
    const allErrors = collectAllErrors(formData);
    if (Object.keys(allErrors).length > 0) {
      setStepErrors(allErrors);
      // Navigate back to the first step that has errors so the user sees them
      const stepWithError = steps.findIndex((step) => Object.keys(validateStep(step, formData)).length > 0);
      if (stepWithError >= 0) setCurrentStep(stepWithError + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSubmitError('Please fix the highlighted errors before submitting.');
      return;
    }

    // ── Convert date+time to ISO — abort if conversion fails ─────────────────
    const startISO = safeISO(formData.startDate, formData.startTime);
    const endISO   = safeISO(formData.endDate,   formData.endTime);

    if (!startISO) {
      setStepErrors({ startDate: 'Start date and time are invalid or incomplete.' });
      setCurrentStep(2);
      setSubmitError('Start date/time is invalid. Please re-enter it.');
      return;
    }
    if (!endISO) {
      setStepErrors({ endDate: 'End date and time are invalid or incomplete.' });
      setCurrentStep(2);
      setSubmitError('End date/time is invalid. Please re-enter it.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // ── Build payload ────────────────────────────────────────────────────
      const payload = {
        title:            formData.title.trim(),
        shortDescription: formData.shortDescription.trim() || undefined,
        description:      formData.description.trim(),
        eventType:        formData.eventType,
        format:           formData.format,
        isFree:           formData.isFree,
        tags:             formData.tags,
        notes:            formData.notes.trim() || undefined,
        startDate:        startISO,
        endDate:          endISO,
        timezone:         formData.timezone,
        maxCapacity:      formData.maxCapacity ? Number(formData.maxCapacity) : undefined,
        templateId:       formData.template || undefined,
        venue: formData.format !== 'virtual' ? {
          name:       formData.venue.name.trim()      || undefined,
          address:    formData.venue.address.trim()   || undefined,
          city:       formData.venue.city.trim()      || undefined,
          state:      formData.venue.state.trim()     || undefined,
          country:    formData.venue.country.trim()   || undefined,
          onlineLink: formData.venue.onlineLink.trim() || undefined,
        } : {
          onlineLink: formData.venue.onlineLink.trim() || undefined,
        },
        visibility: formData.visibility,
        status:     asDraft ? 'draft' as const : 'published' as const,
        organizerName: formData.organizerName.trim() || undefined,
        pocDetails: formData.pocDetails.email.trim() ? {
          name:  formData.pocDetails.name.trim()  || 'POC',
          email: formData.pocDetails.email.trim(),
          phone: formData.pocDetails.phone.trim() || undefined,
        } : undefined,
        policies: formData.policies.refundPolicy ? {
          refundPolicy:       formData.policies.refundPolicy,
          cancellationPolicy: formData.policies.cancellationPolicy.trim() || undefined,
          attendeeMinAge:     Number(formData.policies.attendeeMinAge) || 0,
        } : undefined,
        faqs: formData.faqs.length > 0 ? formData.faqs : undefined,
        customFields: (() => {
          const customSpecs = formData.templateFields
            .filter(f => f.section === 'custom' || f.section === 'policies')
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const out = customSpecs
            .map((s) => ({
              key: s.key,
              label: s.label,
              value: formData.customFieldValues[s.key],
            }))
            .filter((x) => x.value !== undefined && String(x.value).trim() !== '');
          return out.length > 0 ? out : undefined;
        })(),
      };

      const response = await eventApi.create({
        ...payload,
        sessions: formData.sessions.map((session, idx) => {
          const sStart = safeISO(session.startDate, session.startTime);
          const sEnd = safeISO(session.endDate, session.endTime);
          return {
            title: session.title.trim(),
            description: session.description.trim() || undefined,
            notes: session.notes.trim() || undefined,
            sessionType: session.sessionType,
            startTime: sStart || '',
            endTime: sEnd || '',
            room: session.room.trim() || undefined,
            streamUrl: session.streamUrl.trim() || undefined,
            maxAttendees: session.maxAttendees ? Number(session.maxAttendees) : undefined,
            speakers: session.speakers.length > 0 ? session.speakers : undefined,
            tags: session.tags.length > 0 ? session.tags : undefined,
            order: idx,
          };
        }),
      } as any);
      const eventId = response.data._id;

      navigate(`/event?id=${eventId}`, {
        state: { justCreated: true, status: asDraft ? 'draft' : 'published' },
      });

    } catch (err) {
      // ── Event creation itself failed — nothing was written to DB ─────────
      const raw = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      // Backend pipe-delimited errors → show as list
      const parts = raw.split(' | ').map((s) => s.trim()).filter(Boolean);
      setSubmitError(parts.length > 1 ? parts.join('\n') : raw);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};
