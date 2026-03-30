import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EventFormData, StepErrors, StepDef } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { validateStep } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { eventApi, templateApi } from '@/services/api';
import { mergeSystemFields } from '@/shared/template/systemFields';

const INITIAL_DATA: EventFormData = {
  template: '',
  templateName: '',
  templateFields: [],
  sessionTemplates: [],
  customFieldValues: {},
  title: '',
  shortDescription: '',
  description: '',
  coverImage: '',
  secondaryImages: [],
  videoUrl: '',
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

import { useEffect } from 'react';
import type { ApiEvent } from '@/services/api';

export const useEventWizard = ({ initialEventData, eventId }: { initialEventData?: ApiEvent | null; eventId?: string } = {}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep]   = useState(1);
  const [formData, setFormData]         = useState<EventFormData>(INITIAL_DATA);
  const [stepErrors, setStepErrors]     = useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);

  useEffect(() => {
    if (initialEventData) {
      setFormData((prev) => {
        const parseIsoToLocal = (iso?: string) => {
          if (!iso) return { date: '', time: '' };
          const d = new Date(iso);
          if (isNaN(d.getTime())) return { date: '', time: '' };
          return {
            date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          };
        };

        const startParsed = parseIsoToLocal(initialEventData.startDate);
        const endParsed = parseIsoToLocal(initialEventData.endDate);

        return {
          ...prev,
          title: initialEventData.title || '',
          shortDescription: initialEventData.shortDescription || '',
          description: initialEventData.description || '',
          coverImage: initialEventData.coverImage || '',
          secondaryImages: (initialEventData as any).secondaryImages || [],
          videoUrl: initialEventData.media?.videoUrl || '',
          eventType: initialEventData.eventType || 'other',
          format: initialEventData.format || 'physical',
          isFree: initialEventData.isFree ?? true,
          tags: initialEventData.tags?.map((t: any) => typeof t === 'string' ? t : t._id) || [],
          notes: (initialEventData as any).notes || '',
          startDate: startParsed.date,
          startTime: startParsed.time,
          endDate: endParsed.date,
          endTime: endParsed.time,
          timezone: initialEventData.timezone || 'Asia/Kolkata',
          maxCapacity: initialEventData.maxCapacity != null ? String(initialEventData.maxCapacity) : '',
          venue: {
            name: initialEventData.venue?.name || '',
            address: initialEventData.venue?.address || '',
            city: initialEventData.venue?.city || '',
            state: initialEventData.venue?.state || '',
            country: initialEventData.venue?.country || '',
            onlineLink: initialEventData.venue?.onlineLink || '',
          },
          visibility: initialEventData.visibility || 'public',
          policies: {
            refundPolicy: (initialEventData.policies as any)?.refundPolicy || 'no_refund',
            cancellationPolicy: (initialEventData.policies as any)?.cancellationPolicy || '',
            attendeeMinAge: String((initialEventData.policies as any)?.attendeeMinAge || '0'),
          },
          organizerName: initialEventData.organizerName || '',
          pocDetails: {
            name: (initialEventData as any).pocDetails?.name || '',
            email: (initialEventData as any).pocDetails?.email || '',
            phone: (initialEventData as any).pocDetails?.phone || '',
          },
          faqs: initialEventData.faqs || [],
          template: (initialEventData as any).templateId || '',
          customFieldValues: (initialEventData as any).customFields?.reduce((acc: any, field: any) => ({ ...acc, [field.key]: field.value }), {}) || {},
          sessions: (initialEventData.sessions as any[])?.map((s: any) => {
            const sStart = parseIsoToLocal(s.startTime);
            const sEnd = parseIsoToLocal(s.endTime);
            return {
              id: s._id || Math.random().toString(),
              title: s.title || '',
              description: s.description || '',
              notes: s.notes || '',
              sessionType: s.sessionType || 'talk',
              startDate: sStart.date,
              startTime: sStart.time,
              endDate: sEnd.date,
              endTime: sEnd.time,
              room: s.room || '',
              streamUrl: s.streamUrl || '',
              maxAttendees: s.maxAttendees != null ? String(s.maxAttendees) : '',
              speakers: s.speakers || [],
              tags: s.tags || [],
              customFieldValues: s.customFields?.reduce((acc: any, field: any) => ({ ...acc, [field.key]: field.value }), {}) || {}
            };
          }) || [],
        };
      });
      
      const tId = (initialEventData as any).templateId;
      if (tId) {
        templateApi.getById(tId).then(res => {
          const tpl = res.data;
          setFormData(prev => ({
            ...prev,
            templateName: tpl.name,
            templateFields: mergeSystemFields(tpl.fields || []),
            sessionTemplates: tpl.sessionTemplates || [],
          }));
        }).catch(() => {
          // ignore error, just won't render fields
        });
      }
    }
  }, [initialEventData]);

  const steps = useMemo<StepDef[]>(() => {
    const s: StepDef[] = [{ id: 'template', title: 'Template', type: 'template' }];
    if (formData.template) {
      // Identity distinct forms from template fields. Keep original defined order.
      const forms = Array.from(new Set(formData.templateFields.map(f => f.form ?? 'Basic Info')));
      forms.forEach(form => {
        s.push({ id: `form-${form}`, title: form, type: 'form', formName: form });
      });
      s.push({ id: 'visibility', title: 'Visibility', type: 'visibility' });
      s.push({ id: 'sessions', title: 'Sessions', type: 'sessions' });
      s.push({ id: 'faq', title: 'FAQs', type: 'faq' });
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
    updateFormData({ submitAs: asDraft ? 'draft' : 'published' });

    // ── Run validator conditionally ──────────────────────
    if (!asDraft) {
      const allErrors = collectAllErrors(formData);
      if (Object.keys(allErrors).length > 0) {
        setStepErrors(allErrors);
        const stepWithError = steps.findIndex((step) => Object.keys(validateStep(step, formData)).length > 0);
        if (stepWithError >= 0) setCurrentStep(stepWithError + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setSubmitError('Please fix the highlighted errors before submitting.');
        return;
      }
    }

    // ── Convert date+time to ISO — abort if conversion fails ─────────────────
    const startISO = safeISO(formData.startDate, formData.startTime);
    const endISO   = safeISO(formData.endDate,   formData.endTime);

    if (!asDraft) {
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
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // ── Build payload ────────────────────────────────────────────────────
      const payload = {
        title:            formData.title.trim(),
        shortDescription: formData.shortDescription.trim() || undefined,
        description:      formData.description.trim(),
        coverImage:       formData.coverImage.trim() || undefined,
        secondaryImages:  formData.secondaryImages.length > 0 ? formData.secondaryImages : undefined,
        media:            { videoUrl: formData.videoUrl.trim() || undefined },
        eventType:        formData.eventType,
        format:           formData.format,
        isFree:           formData.isFree,
        tags:             formData.tags,
        notes:            formData.notes.trim() || undefined,
        startDate:        startISO || new Date().toISOString(),
        endDate:          endISO || new Date(Date.now() + 86400000).toISOString(),
        timezone:         formData.timezone,
        maxCapacity:      formData.maxCapacity ? Number(formData.maxCapacity) : undefined,
        templateId:       formData.template || undefined,
        venue: formData.format !== 'virtual' ? {
          name:       formData.venue.name.trim()      || undefined,
          address:    formData.venue.address.trim()   || undefined,
          city:       formData.venue.city.trim()      || undefined,
          state:      formData.venue.state.trim()     || undefined,
          country:    formData.venue.country.trim()   || undefined,
          onlineLink: (formData.venue.onlineLink || '').trim() || undefined,
        } : {
          onlineLink: (formData.venue.onlineLink || '').trim() || undefined,
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

      const finalPayload = {
        ...payload,
        sessions: formData.sessions.map((session, idx) => {
          const sStart = safeISO(session.startDate, session.startTime);
          const sEnd = safeISO(session.endDate, session.endTime);
          return {
            title: session.title.trim(),
            description: session.description.trim() || undefined,
            notes: session.notes.trim() || undefined,
            sessionType: session.sessionType,
            startTime: sStart || undefined,
            endTime: sEnd || undefined,
            room: session.room.trim() || undefined,
            streamUrl: session.streamUrl.trim() || undefined,
            maxAttendees: session.maxAttendees ? Number(session.maxAttendees) : undefined,
            speakers: session.speakers.length > 0 ? session.speakers : undefined,
            tags: session.tags.length > 0 ? session.tags : undefined,
            order: idx,
          };
        }),
      } as any;

      let responseId = eventId;
      if (eventId) {
        await eventApi.update(eventId, finalPayload);
      } else {
        const response = await eventApi.create(finalPayload);
        responseId = response.data._id;
      }

      navigate(`/event?id=${responseId}`, {
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
