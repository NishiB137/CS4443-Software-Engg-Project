import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { LIMITS, todayDate } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { mergeSystemFields } from '@/shared/template/systemFields';

const EVENT_TYPES = [
  { value: 'conference',  label: 'Conference' },
  { value: 'workshop',    label: 'Workshop' },
  { value: 'hackathon',   label: 'Hackathon' },
  { value: 'concert',     label: 'Concert / Performance' },
  { value: 'exhibition',  label: 'Exhibition' },
  { value: 'summit',      label: 'Summit' },
  { value: 'festival',    label: 'Festival' },
  { value: 'competition', label: 'Competition' },
  { value: 'webinar',     label: 'Webinar' },
  { value: 'other',       label: 'Other' },
];

const TIMEZONES = [
  { value: 'Asia/Kolkata',        label: 'IST – Asia/Kolkata (UTC+5:30)' },
  { value: 'America/New_York',    label: 'EST – New York (UTC-5)' },
  { value: 'America/Chicago',     label: 'CST – Chicago (UTC-6)' },
  { value: 'America/Denver',      label: 'MST – Denver (UTC-7)' },
  { value: 'America/Los_Angeles', label: 'PST – Los Angeles (UTC-8)' },
  { value: 'Europe/London',       label: 'GMT – London (UTC+0)' },
  { value: 'Europe/Paris',        label: 'CET – Paris (UTC+1)' },
  { value: 'Asia/Singapore',      label: 'SGT – Singapore (UTC+8)' },
  { value: 'Asia/Tokyo',          label: 'JST – Tokyo (UTC+9)' },
  { value: 'Australia/Sydney',    label: 'AEST – Sydney (UTC+10)' },
  { value: 'UTC',                 label: 'UTC' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:outline-none transition ${
    hasError
      ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50'
      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
  }`;

const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {msg}
    </p>
  ) : null;

const CharCount: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const near = current > max * 0.85;
  const over = current > max;
  return (
    <p className={`text-xs mt-1 text-right ${over ? 'text-red-500 font-medium' : near ? 'text-amber-500' : 'text-gray-400'}`}>
      {current}/{max}
    </p>
  );
};

// ─── Date + Time split picker ─────────────────────────────────────────────────

interface DateTimePickerProps {
  dateValue: string;
  timeValue: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  minDate?: string;
  dateError?: string;
  timeError?: string;
  required?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  dateValue, timeValue, onDateChange, onTimeChange, minDate, dateError, timeError, required,
}) => (
  <div className="flex gap-2">
    <div className="flex-1">
      <input
        type="date"
        className={inputCls(!!dateError)}
        value={dateValue}
        min={minDate ?? todayDate()}
        required={required}
        onChange={(e) => onDateChange(e.target.value)}
      />
    </div>
    <div className="w-32">
      <input
        type="time"
        className={inputCls(!!timeError || !!dateError)}
        value={timeValue}
        required={required}
        onChange={(e) => onTimeChange(e.target.value)}
      />
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const Step2BasicDetails: React.FC<WizardStepProps> = ({ data, updateData, errors = {} }) => {
  const isVirtual      = data.format === 'virtual';
  const isHybrid       = data.format === 'hybrid';
  const needsOnlineLink = isVirtual || isHybrid;

  const templateFields = mergeSystemFields(data.templateFields ?? []);
  const fieldKeys = new Set(templateFields.map((f) => f.key));

  const templateCustomFields = templateFields
    .filter((f) => f.section === 'custom')
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const hasOrganizerFields = templateFields.some((f) =>
    ['organizerName', 'pocName', 'pocEmail', 'pocPhone'].includes(f.key)
  );

  const hasVenueFields = templateFields.some((f) => f.section === 'venue');
  const hasCapacity = fieldKeys.has('maxCapacity');
  const hasDates = templateFields.some((f) => f.section === 'datetime');

  const updateVenue = (fields: Partial<typeof data.venue>) => {
    updateData({ venue: { ...data.venue, ...fields } });
  };

  const updateCustomField = (key: string, value: string) => {
    updateData({ customFieldValues: { ...data.customFieldValues, [key]: value } });
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Basic Event Information</h2>
      <p className="text-gray-500 text-sm mb-6">Fill in the essential details about your event</p>

      <div className="space-y-5">

        {/* ── Event Name ── */}
        {fieldKeys.has('title') && (
          <div>
          <label className={labelCls}>
            Event Name <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">({LIMITS.title.min}–{LIMITS.title.max} chars)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Tech Innovation Summit 2026"
            className={inputCls(!!errors['title'])}
            value={data.title}
            maxLength={LIMITS.title.max}
            onChange={(e) => updateData({ title: e.target.value })}
          />
          <div className="flex items-start justify-between">
            <FieldError msg={errors['title']} />
            <CharCount current={data.title.length} max={LIMITS.title.max} />
          </div>
          </div>
        )}

        {/* ── Short Description ── */}
        {fieldKeys.has('shortDescription') && (
          <div>
          <label className={labelCls}>
            Short Description
            <span className="text-gray-400 font-normal ml-1">(shown on event cards)</span>
          </label>
          <input
            type="text"
            placeholder="One-liner that captures your event"
            maxLength={LIMITS.shortDescription.max}
            className={inputCls(!!errors['shortDescription'])}
            value={data.shortDescription}
            onChange={(e) => updateData({ shortDescription: e.target.value })}
          />
          <div className="flex items-start justify-between">
            <FieldError msg={errors['shortDescription']} />
            <CharCount current={data.shortDescription.length} max={LIMITS.shortDescription.max} />
          </div>
          </div>
        )}

        {/* ── Full Description ── */}
        {fieldKeys.has('description') && (
          <div>
          <label className={labelCls}>
            Full Description <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(min {LIMITS.description.min} chars)</span>
          </label>
          <textarea
            rows={5}
            placeholder="Describe what your event is about, who it's for, and what attendees can expect..."
            className={inputCls(!!errors['description'])}
            value={data.description}
            maxLength={LIMITS.description.max}
            onChange={(e) => updateData({ description: e.target.value })}
          />
          <div className="flex items-start justify-between">
            <FieldError msg={errors['description']} />
            <CharCount current={data.description.length} max={LIMITS.description.max} />
          </div>
          </div>
        )}

        {/* ── Type, Format, Pricing ── */}
        {(fieldKeys.has('eventType') || fieldKeys.has('format') || fieldKeys.has('isFree')) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fieldKeys.has('eventType') && (
            <div>
            <label className={labelCls}>Event Type <span className="text-red-500">*</span></label>
            <select
              className={inputCls()}
              value={data.eventType}
              onChange={(e) => updateData({ eventType: e.target.value })}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            </div>
          )}

          {fieldKeys.has('format') && (
            <div>
            <label className={labelCls}>Format <span className="text-red-500">*</span></label>
            <select
              className={inputCls()}
              value={data.format}
              onChange={(e) => updateData({ format: e.target.value as typeof data.format })}
            >
              <option value="physical">Physical (in-person)</option>
              <option value="virtual">Virtual (online)</option>
              <option value="hybrid">Hybrid</option>
            </select>
            </div>
          )}

          {fieldKeys.has('isFree') && (
            <div>
            <label className={labelCls}>Pricing</label>
            <div className="flex gap-2 mt-0.5">
              <button
                type="button"
                onClick={() => updateData({ isFree: true })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                  data.isFree
                    ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-400'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => updateData({ isFree: false })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                  !data.isFree
                    ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-400'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Paid
              </button>
            </div>
            </div>
          )}
          </div>
        )}

        {/* ── Start & End Date/Time ── */}
        {hasDates && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Start Date & Time <span className="text-red-500">*</span>
            </label>
            <DateTimePicker
              dateValue={data.startDate}
              timeValue={data.startTime}
              onDateChange={(v) => updateData({ startDate: v })}
              onTimeChange={(v) => updateData({ startTime: v })}
              minDate={todayDate()}
              dateError={errors['startDate']}
              required
            />
            <FieldError msg={errors['startDate']} />
          </div>

          <div>
            <label className={labelCls}>
              End Date & Time <span className="text-red-500">*</span>
            </label>
            <DateTimePicker
              dateValue={data.endDate}
              timeValue={data.endTime}
              onDateChange={(v) => updateData({ endDate: v })}
              onTimeChange={(v) => updateData({ endTime: v })}
              minDate={data.startDate || todayDate()}
              dateError={errors['endDate']}
              required
            />
            <FieldError msg={errors['endDate']} />
          </div>
          </div>
        )}

        {/* ── Timezone ── */}
        {fieldKeys.has('timezone') && (
          <div className="max-w-sm">
          <label className={labelCls}>Timezone</label>
          <select
            className={inputCls()}
            value={data.timezone}
            onChange={(e) => updateData({ timezone: e.target.value })}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          </div>
        )}

        {/* ── Max Capacity ── */}
        {hasCapacity && (
          <div className="max-w-xs">
          <label className={labelCls}>
            Maximum Capacity
            <span className="text-gray-400 font-normal ml-1">(1 – {LIMITS.maxCapacity.max.toLocaleString()})</span>
          </label>
          <input
            type="number"
            min={LIMITS.maxCapacity.min}
            max={LIMITS.maxCapacity.max}
            step={1}
            placeholder="Leave blank for unlimited"
            className={inputCls(!!errors['maxCapacity'])}
            value={data.maxCapacity}
            onChange={(e) => updateData({ maxCapacity: e.target.value })}
          />
          <FieldError msg={errors['maxCapacity']} />
          </div>
        )}

        {/* ── Physical Venue ── */}
        {hasVenueFields && (data.format === 'physical' || isHybrid) && (
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              Venue Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Venue Name</label>
                <input
                  type="text"
                  placeholder="e.g. Convention Center"
                  className={inputCls(!!errors['venue_name'])}
                  value={data.venue.name}
                  maxLength={LIMITS.venueField.max}
                  onChange={(e) => updateVenue({ name: e.target.value })}
                />
                <FieldError msg={errors['venue_name']} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Street Address</label>
                <input
                  type="text"
                  placeholder="123 Main St"
                  className={inputCls(!!errors['venue_address'])}
                  value={data.venue.address}
                  maxLength={LIMITS.venueField.max}
                  onChange={(e) => updateVenue({ address: e.target.value })}
                />
                <FieldError msg={errors['venue_address']} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input
                  type="text"
                  placeholder="City"
                  className={inputCls(!!errors['venue_city'])}
                  value={data.venue.city}
                  maxLength={LIMITS.venueField.max}
                  onChange={(e) => updateVenue({ city: e.target.value })}
                />
                <FieldError msg={errors['venue_city']} />
              </div>
              <div>
                <label className={labelCls}>State / Province</label>
                <input
                  type="text"
                  placeholder="State"
                  className={inputCls(!!errors['venue_state'])}
                  value={data.venue.state}
                  maxLength={LIMITS.venueField.max}
                  onChange={(e) => updateVenue({ state: e.target.value })}
                />
                <FieldError msg={errors['venue_state']} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input
                  type="text"
                  placeholder="Country"
                  className={inputCls(!!errors['venue_country'])}
                  value={data.venue.country}
                  maxLength={LIMITS.venueField.max}
                  onChange={(e) => updateVenue({ country: e.target.value })}
                />
                <FieldError msg={errors['venue_country']} />
              </div>
            </div>
          </div>
        )}

        {/* ── Online Link ── */}
        {needsOnlineLink && (
          <div>
            <label className={labelCls}>
              Online Event Link <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              placeholder="https://zoom.us/j/... or similar"
              className={inputCls(!!errors['onlineLink'])}
              value={data.venue.onlineLink}
              onChange={(e) => updateVenue({ onlineLink: e.target.value })}
            />
            <FieldError msg={errors['onlineLink']} />
          </div>
        )}

        {/* ── Organizer / Contact (template-driven) ── */}
        {hasOrganizerFields && (
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Organizer & Contact (optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Organizer Name</label>
                <input
                  type="text"
                  placeholder="e.g. TechCon Global"
                  className={inputCls(!!errors['organizerName'])}
                  value={data.organizerName}
                  onChange={(e) => updateData({ organizerName: e.target.value })}
                />
                <FieldError msg={errors['organizerName']} />
              </div>
              <div>
                <label className={labelCls}>POC Name</label>
                <input
                  type="text"
                  placeholder="Point of contact name"
                  className={inputCls(!!errors['pocName'])}
                  value={data.pocDetails.name}
                  onChange={(e) => updateData({ pocDetails: { ...data.pocDetails, name: e.target.value } })}
                />
                <FieldError msg={errors['pocName']} />
              </div>
              <div>
                <label className={labelCls}>POC Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className={inputCls(!!errors['pocEmail'])}
                  value={data.pocDetails.email}
                  onChange={(e) => updateData({ pocDetails: { ...data.pocDetails, email: e.target.value } })}
                />
                <FieldError msg={errors['pocEmail']} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>POC Phone</label>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  className={inputCls(!!errors['pocPhone'])}
                  value={data.pocDetails.phone}
                  onChange={(e) => updateData({ pocDetails: { ...data.pocDetails, phone: e.target.value } })}
                />
                <FieldError msg={errors['pocPhone']} />
              </div>
            </div>
          </div>
        )}

        {/* ── Template Custom Fields ── */}
        {templateCustomFields.length > 0 && (
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Additional Details</h3>
            <div className="space-y-4">
              {templateCustomFields.map((f) => {
                const value = data.customFieldValues?.[f.key] ?? '';
                const common = {
                  key: f.key,
                  className: inputCls(!!errors[f.key]),
                  value,
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                    updateCustomField(f.key, e.target.value),
                };

                return (
                  <div key={f.key}>
                    <label className={labelCls}>
                      {f.label}
                      {f.required && <span className="text-red-500"> *</span>}
                      {f.maxLength && <span className="text-gray-400 font-normal ml-1">(max {f.maxLength})</span>}
                    </label>

                    {f.helpText && <p className="text-xs text-gray-400 mb-1">{f.helpText}</p>}

                    {f.fieldType === 'textarea' ? (
                      <textarea
                        rows={3}
                        placeholder={f.placeholder}
                        maxLength={f.maxLength}
                        {...common}
                      />
                    ) : f.fieldType === 'select' ? (
                      <select {...common}>
                        <option value="">Select</option>
                        {(f.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : f.fieldType === 'toggle' ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={value === 'true'}
                          onChange={(e) => updateCustomField(f.key, e.target.checked ? 'true' : 'false')}
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-gray-600">{value === 'true' ? 'Yes' : 'No'}</span>
                      </div>
                    ) : (
                      <input
                        type={
                          f.fieldType === 'number' ? 'number'
                            : f.fieldType === 'url' ? 'url'
                              : f.fieldType === 'email' ? 'email'
                                : f.fieldType === 'phone' ? 'tel'
                                  : 'text'
                        }
                        placeholder={f.placeholder}
                        maxLength={f.maxLength}
                        min={typeof f.min === 'number' ? f.min : undefined}
                        max={typeof f.max === 'number' ? f.max : undefined}
                        {...common}
                      />
                    )}

                    <FieldError msg={errors[f.key]} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
