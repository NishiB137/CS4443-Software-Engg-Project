import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EventFormData, StepErrors, StepDef, SessionFormData } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { validateStep } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { eventApi, templateApi } from '@/services/api';
import type { CreateEventPayload, FieldSpec } from '@/services/api';
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
  isPaid: false,
  currency: 'INR',
  tags: [],
  notes: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  timezone: (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  })(),
  maxCapacity: '',
  venue: { name: '', address: '', city: '', state: '', country: '', onlineLink: '' },
  visibility: 'public',
  requiresRegistration: false,
  registrationFields: [],
  entrySettings: {
    enableAttendanceManagement: true,
    scannerType: 'qr' as 'qr' | 'none',
    requireSpecificTime: false,
    entryStartTime: '',
    entryEndTime: '',
  },
  policies: { refundPolicy: '', cancellationPolicy: '', attendeeMinAge: '0' },
  organizerName: '',
  pocDetails: { name: '', email: '', phone: '' },
  ticketingTiers: [],
  faqs: [],
  sessions: [],
  submitAs: 'draft',
  team: [],
  requiresReview: false,
  reviewerId: '',
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
  const [isDirty, setIsDirty]           = useState(false);
  // Track original status so we know if we're editing a published event
  const [originalStatus, setOriginalStatus] = useState<string>('draft');

  useEffect(() => {
    if (initialEventData) {
      setFormData((prev: EventFormData) => {
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

        const VALID_TYPES = ['conference','workshop','hackathon','concert','exhibition','summit','festival','competition','webinar','other'];
        const activeType = initialEventData.eventType || 'other';
        const isStandardType = VALID_TYPES.includes(activeType);

        return {
          ...prev,
          title: initialEventData.title || '',
          shortDescription: initialEventData.shortDescription || '',
          description: initialEventData.description || '',
          coverImage: initialEventData.coverImage || '',
          secondaryImages: initialEventData.secondaryImages || [],
          videoUrl: initialEventData.media?.videoUrl || '',
          eventType: isStandardType ? activeType : 'other',
          customEventType: isStandardType ? '' : activeType,
          format: initialEventData.format || 'physical',
          isPaid: initialEventData.isFree === false,
          currency: initialEventData.currency || 'INR',
          tags: initialEventData.tags?.map((t) => typeof t === 'string' ? t : t._id) || [],
          notes: initialEventData.notes || '',
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
          visibility: (initialEventData.visibility === 'restricted' ? 'public' : (initialEventData.visibility || 'public')) as 'public' | 'hidden_link' | 'hidden_authenticated',
          requiresRegistration: (initialEventData as any).requiresRegistration === true,
          registrationFields: (initialEventData as any).registrationFields || [],
          // ✓ KEY FIX: persist ticketing tiers on edit/duplicate
          ticketingTiers: (initialEventData as any).ticketingTiers || [],
          entrySettings: {
            enableAttendanceManagement: (initialEventData as any).entrySettings?.enableAttendanceManagement ?? true,
            scannerType: ((initialEventData as any).entrySettings?.scannerType || 'qr') as 'qr' | 'none',
            requireSpecificTime: (initialEventData as any).entrySettings?.requireSpecificTime || false,
            entryStartTime: (initialEventData as any).entrySettings?.entryStartTime || '',
            entryEndTime: (initialEventData as any).entrySettings?.entryEndTime || '',
          },
          policies: {
            refundPolicy: (initialEventData.policies?.['refundPolicy'] as 'full' | 'partial' | 'no_refund' | '') || 'no_refund',
            cancellationPolicy: (initialEventData.policies?.['cancellationPolicy'] as string) || '',
            attendeeMinAge: String(initialEventData.policies?.['attendeeMinAge'] ?? '0'),
          },
          organizerName: initialEventData.organizerName || '',
          pocDetails: {
            name: (initialEventData.pocDetails as Record<string, string> | undefined)?.name || '',
            email: (initialEventData.pocDetails as Record<string, string> | undefined)?.email || '',
            phone: (initialEventData.pocDetails as Record<string, string> | undefined)?.phone || '',
          },
          faqs: initialEventData.faqs || [],
          template: '',
          customFieldValues: Object.fromEntries(
            (initialEventData.customFields || []).map((f: { key: string; value: unknown }) => [
              f.key,
              String(f.value ?? '')
            ])
          ),
          team: ((initialEventData as any).team || []).map((m: any) => ({
            _id: typeof m.user === 'object' ? m.user._id || m.user : m.user,
            username: typeof m.user === 'object' ? (m.user.username || '') : (m.username || ''),
            name: typeof m.user === 'object' ? (m.user.name || '') : (m.name || ''),
            email: typeof m.user === 'object' ? (m.user.email || '') : (m.email || ''),
            role: m.role || 'event_manager',
          })),
          requiresReview: (initialEventData as any).requiresReview ?? false,
          reviewerId: (() => {
            const rev = (initialEventData as any).reviewer;
            if (!rev) return '';
            return typeof rev === 'object' ? (rev._id || '') : rev;
          })(),
          sessions: (initialEventData.sessions as Array<Record<string, unknown>>)?.map((s) => {
            const sStart = parseIsoToLocal(s.startTime as string | undefined);
            const sEnd = parseIsoToLocal(s.endTime as string | undefined);
            return {
              title: (s.title as string) || '',
              description: (s.description as string) || '',
              notes: (s.notes as string) || '',
              sessionType: (s.sessionType as SessionFormData['sessionType']) || 'other',
              startDate: sStart.date,
              startTime: sStart.time,
              endDate: sEnd.date,
              endTime: sEnd.time,
              room: (s.room as string) || '',
              timezone: (s.timezone as string) || 'Asia/Kolkata',
              streamUrl: (s.streamUrl as string) || '',
              maxAttendees: s.maxAttendees != null ? String(s.maxAttendees) : '',
              speakers: (s.speakers as SessionFormData['speakers']) || [],
              tags: (s.tags as string[]) || [],
              customFieldValues: Object.fromEntries(
                ((s.customFields as Array<{ key: string; value: unknown }>) || []).map(
                  (cf) => [cf.key, String(cf.value ?? '')]
                )
              )
            };
          }) || [],
        };
      });
      
      // Track the original status of the event being edited
      setOriginalStatus(initialEventData.status || 'draft');
      
      const tId = initialEventData.templateId;
      if (tId) {
        templateApi.getById(tId).then(res => {
          const tpl = res.data;
          setFormData((prev: EventFormData) => ({
            ...prev,
            template: tId,
            templateName: tpl.name,
            templateFields: mergeSystemFields(tpl.fields || []),
            sessionTemplates: tpl.sessionTemplates || [],
            templateLayout: tpl.layout,
            // Pre-populate ticketing tiers and registration fields from template when editing
            ticketingTiers: prev.ticketingTiers.length === 0 && tpl.defaultTicketingTiers?.length
              ? tpl.defaultTicketingTiers
              : prev.ticketingTiers,
            registrationFields: prev.registrationFields.length === 0 && tpl.defaultRegistrationFields?.length
              ? tpl.defaultRegistrationFields
              : prev.registrationFields,
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
      // Skip the "Registration" form here — it gets its own dedicated step.
      const forms = Array.from(new Set(
        formData.templateFields
          .filter(f => (f.form ?? 'Basic Info') !== 'Registration')
          .map(f => f.form ?? 'Basic Info')
      ));
      forms.forEach((form) => {
        s.push({ id: `form-${form}`, title: form as string, type: 'form', formName: form as string });
      });
      s.push({ id: 'visibility', title: 'Visibility', type: 'visibility' });
      // Always add a dedicated Registration step after Visibility
      s.push({ id: 'registration', title: 'Registration', type: 'registration' });
      // Add Ticketing Tiers step only for paid events
      const eventIsPaid = formData.isPaid === true || String(formData.isPaid) === 'true';
      if (eventIsPaid) {
        s.push({ id: 'ticketingTiers', title: 'Ticketing Tiers', type: 'ticketingTiers' });
      }
      s.push({ id: 'sessions', title: 'Sessions', type: 'sessions' });
      s.push({ id: 'faq', title: 'FAQs', type: 'faq' });
      s.push({ id: 'team_review', title: 'Team & Review', type: 'team_review' });
      s.push({ id: 'review', title: 'Review & Publish', type: 'review' });
    }
    return s;
  }, [formData.template, formData.templateFields, formData.isPaid]);
  
  const totalSteps = steps.length;

  const collectAllErrors = (data: EventFormData): StepErrors => {
    return steps.reduce<StepErrors>((acc: StepErrors, step: StepDef) => ({ ...acc, ...validateStep(step, data) }), {});
  };

  const updateFormData = (patch: Partial<EventFormData>) => {
    setIsDirty(true);
    setFormData((prev: EventFormData) => {
      const next = { ...prev, ...patch };
      // ── Enforce: paid events must always have registration enabled ──
      const isPaid = next.isPaid === true || String(next.isPaid) === 'true';
      if (isPaid && !next.requiresRegistration) {
        next.requiresRegistration = true;
        // Ensure attendeeName and attendeeEmail are always in the fields for paid events
        const hasName  = next.registrationFields.some(f => f.key === 'attendeeName');
        const hasEmail = next.registrationFields.some(f => f.key === 'attendeeEmail');
        if (!hasName)
          next.registrationFields = [{ key: 'attendeeName', label: 'Full Name', fieldType: 'text' as const, required: true, order: 0, category: 'Contact Info', categoryOrder: 0 } as any, ...next.registrationFields];
        if (!hasEmail)
          next.registrationFields = [...next.registrationFields, { key: 'attendeeEmail', label: 'Email Address', fieldType: 'email' as const, required: true, order: 1, category: 'Contact Info', categoryOrder: 0 } as any];
      }
      return next;
    });
    const updatedKeys = Object.keys(patch);
    setStepErrors((prev: StepErrors) => {
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
    setCurrentStep((prev: number) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStepErrors({});
    setCurrentStep((prev: number) => Math.max(prev - 1, 1));
  };

  const submitEvent = async (asDraft = false) => {
    // When editing a published event and saving as draft → demote to draft status
    // When editing a published event and clicking "Save Changes" → keep published status
    // Otherwise: submit for review (approval workflow)
    const isEditingPublished = !!eventId && originalStatus === 'published';

    const currentUserId = localStorage.getItem('userId');
    const isReviewerApproving = !!eventId && originalStatus === 'review' && formData.reviewerId === currentUserId;

    // Determine target status based on review settings
    const targetStatus = asDraft
      ? 'draft'
      : isEditingPublished
        ? 'published'
        : isReviewerApproving
          ? 'approved'
          : formData.requiresReview && formData.reviewerId
            ? 'review'
            : 'published';
    updateFormData({ submitAs: targetStatus });

    // ── Run validator conditionally ──────────────────────
    if (!asDraft) {
      const allErrors = collectAllErrors(formData);
      if (Object.keys(allErrors).length > 0) {
        setStepErrors(allErrors);
        const stepWithError = steps.findIndex((step: StepDef) => Object.keys(validateStep(step, formData)).length > 0);
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
      const userId = localStorage.getItem('userId');
      const payload = {
        title:            formData.title.trim(),
        shortDescription: formData.shortDescription.trim() || undefined,
        description:      formData.description.trim(),
        coverImage:       formData.coverImage.trim() || undefined,
        secondaryImages:  formData.secondaryImages.length > 0 ? formData.secondaryImages : undefined,
        media:            { videoUrl: formData.videoUrl.trim() || undefined },
        eventType:        formData.eventType === 'other' && formData.customEventType ? formData.customEventType.trim() : formData.eventType,
        format:           formData.format,
        isFree:           !(formData.isPaid === true || String(formData.isPaid) === 'true'),
        currency:         formData.currency,
        tags:             formData.tags,
        notes:            formData.notes.trim() || undefined,
        startDate:        startISO || new Date().toISOString(),
        endDate:          endISO || new Date(Date.now() + 86400000).toISOString(),
        timezone:         formData.timezone,
        maxCapacity:      formData.maxCapacity ? Number(formData.maxCapacity) : undefined,
        templateId:       formData.template || undefined,
        createdBy:        userId || undefined,
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
        requiresRegistration: formData.requiresRegistration,
        registrationFields: formData.requiresRegistration
          ? formData.registrationFields.map((f, idx) => ({
              ...f,
              order: (f as any).order ?? idx,
              categoryOrder: (f as any).categoryOrder ?? 0,
            }))
          : [],
        entrySettings: formData.entrySettings,
        ticketingTiers: (formData.isPaid === true || String(formData.isPaid) === 'true') && formData.ticketingTiers.length > 0
          ? formData.ticketingTiers
              .filter(t => t.name && t.name.trim() !== '')
              .map(t => ({
              name: t.name.trim(),
              price: t.price,
              capacity: t.capacity,
              description: t.description?.trim() || undefined,
            }))
          : [],
        status:     targetStatus as 'draft' | 'published',
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
            .filter((f) => f.section === 'custom' || f.section === 'policies')
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
        team: formData.team.length > 0
          ? formData.team.map((m) => ({ user: m._id, role: m.role }))
          : undefined,
        // Review workflow
        requiresReview: formData.requiresReview,
        reviewer: formData.requiresReview && formData.reviewerId ? formData.reviewerId : undefined,
      };

      const finalPayload = {
        ...payload,
        sessions: (() => {
          const sessionErrors: string[] = [];
          const mapped = formData.sessions.map((session, idx) => {
            const sStart = safeISO(session.startDate, session.startTime);
            const sEnd = safeISO(session.endDate, session.endTime);

            if (!asDraft) {
              if (!sStart) sessionErrors.push(`Session ${idx + 1}: start date/time is required or invalid.`);
              if (!sEnd)   sessionErrors.push(`Session ${idx + 1}: end date/time is required or invalid.`);
            }

            return {
              title: session.title.trim(),
              description: session.description.trim() || undefined,
              notes: session.notes.trim() || undefined,
              sessionType: session.sessionType,
              startTime: sStart || startISO || new Date().toISOString(),
              endTime: sEnd || endISO || new Date(Date.now() + 86400000).toISOString(),
              room: session.room.trim() || undefined,
              streamUrl: session.streamUrl.trim() || undefined,
              maxAttendees: session.maxAttendees ? Number(session.maxAttendees) : undefined,
              speakers: session.speakers.length > 0 ? session.speakers : undefined,
              tags: session.tags.length > 0 ? session.tags : undefined,
              order: idx,
            };
          });
          if (sessionErrors.length > 0) throw new Error(sessionErrors.join(' | '));
          return mapped;
        })(),
      };

      let responseId = eventId;
      if (eventId) {
        await eventApi.update(eventId, finalPayload);
      } else {
        const response = await eventApi.create(finalPayload as unknown as CreateEventPayload);
        responseId = response.data._id;
      }

      setIsDirty(false); // Clear dirty state on success

      if (asDraft && isEditingPublished) {
        // Saved published event as a separate draft: navigate to organizer
        navigate('/organizer/events', {
          state: { message: 'Your changes have been saved as a draft. The published event remains live.' },
        });
      } else {
        navigate(`/event?id=${responseId}`, {
          state: { justCreated: true, status: targetStatus },
        });
      }

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

  const saveAsTemplate = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Build a lookup of current field values from formData so we can set them as defaults
      const getSystemDefaultValue = (key: string): string | undefined => {
        const sysMap: Record<string, string> = {
          title: formData.title,
          shortDescription: formData.shortDescription,
          description: formData.description,
          coverImage: formData.coverImage,
          videoUrl: formData.videoUrl,
          eventType: formData.eventType === 'other' && formData.customEventType ? formData.customEventType : formData.eventType,
          format: formData.format,
          isPaid: String(formData.isPaid),
          currency: formData.currency,
          startDate: formData.startDate,
          startTime: formData.startTime,
          endDate: formData.endDate,
          endTime: formData.endTime,
          timezone: formData.timezone,
          maxCapacity: formData.maxCapacity,
          venue_name: formData.venue.name,
          venue_address: formData.venue.address,
          venue_city: formData.venue.city,
          venue_state: formData.venue.state,
          venue_country: formData.venue.country,
          onlineLink: formData.venue.onlineLink,
          refundPolicy: formData.policies.refundPolicy,
          cancellationPolicy: formData.policies.cancellationPolicy,
          attendeeMinAge: formData.policies.attendeeMinAge,
          organizerName: formData.organizerName,
        };
        return sysMap[key];
      };

      // Stamp each template field with the current filled value as its defaultValue
      const fieldsWithDefaults = formData.templateFields.map(f => {
        const sysVal = getSystemDefaultValue(f.key);
        const customVal = formData.customFieldValues[f.key];
        const defaultValue = sysVal !== undefined ? sysVal : customVal;
        return {
          ...f,
          ...(defaultValue !== undefined && defaultValue !== '' ? { defaultValue } : {}),
        };
      });

      // Also append Registration form fields as part of the template (with form: 'Registration')
      const regFormFields = formData.registrationFields.map((rf, idx) => ({
        key: rf.key,
        label: rf.label,
        fieldType: rf.fieldType,
        required: rf.required,
        form: 'Registration',
        section: 'custom' as const,
        order: idx,
        ...(rf.options ? { options: rf.options } : {}),
      }));

      // Merge: remove any existing Registration fields from template then add the current ones
      const nonRegFields = fieldsWithDefaults.filter(f => f.form !== 'Registration');
      const mergedFields = [...nonRegFields, ...regFormFields];

      const payload = {
        name: `${formData.title.trim() || 'Untitled'} Template`,
        description: formData.shortDescription.trim() || undefined,
        eventType: formData.eventType === 'other' && formData.customEventType ? formData.customEventType.trim() : formData.eventType,
        format: formData.format,
        isFree: !(formData.isPaid === true || String(formData.isPaid) === 'true'),
        defaultCurrency: formData.currency,
        defaultTicketingTiers: !(formData.isPaid === true || String(formData.isPaid) === 'true') ? [] : formData.ticketingTiers.filter(t => t.name && t.name.trim() !== ''),
        fields: mergedFields.length > 0 ? (mergedFields.map(f => ({ ...f })) as unknown as FieldSpec[]) : undefined,
        sessionTemplates: formData.sessionTemplates.length > 0 ? formData.sessionTemplates.map(s => ({ ...s, defaultFields: s.defaultFields ?? [] })) : undefined,
        layout: formData.templateLayout,
      };

      await templateApi.create(payload);
      alert('Event saved as template! The current field values are pre-set as defaults.');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to save template.';
      setSubmitError(raw);
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
    saveAsTemplate,
    isDirty,
    setIsDirty,
    originalStatus,
  };
};
