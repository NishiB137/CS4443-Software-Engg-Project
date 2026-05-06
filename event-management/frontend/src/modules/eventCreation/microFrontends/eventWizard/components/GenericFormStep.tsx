import React from 'react';
import { LIMITS } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import type { WizardStepProps, StepErrors } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { uploadApi } from '@/services/api';
import { DateTimePicker } from '@/modules/eventCreation/microFrontends/eventWizard/components/DateTimePicker';
import { TimezoneSelector } from '@/modules/eventCreation/microFrontends/eventWizard/components/TimezoneSelector';

interface GenericFormStepProps extends WizardStepProps {
  formName: string;
}

const inputCls = (hasError?: boolean) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:outline-none transition ${hasError
    ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50'
    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
  }`;

const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {msg}
    </p>
  ) : null;

const CharCount = ({ current, max }: { current: number; max: number }) => {
  const near = current > max * 0.85;
  const over = current > max;
  return (
    <p className={`text-xs mt-1 text-right ${over ? 'text-red-500 font-medium' : near ? 'text-amber-500' : 'text-gray-400'}`}>
      {current}/{max}
    </p>
  );
};

export const GenericFormStep = ({ formName, data, updateData, errors = {} }: GenericFormStepProps) => {
  const typedErrors: StepErrors = errors;
  const [uploadingField, setUploadingField] = React.useState<string | null>(null);
  const fields = data.templateFields.filter((f) => f.form === formName);

  const getSystemValue = (key: string): string => {
    if (key.startsWith('venue_')) return data.venue[key.replace('venue_', '') as keyof typeof data.venue] ?? '';
    if (key === 'refundPolicy' || key === 'cancellationPolicy' || key === 'attendeeMinAge') return data.policies[key as keyof typeof data.policies] as string;
    if (key === 'shareOnlineLinkLater') return data.venue.shareOnlineLinkLater ?? '';
    if (key === 'onlineLink') return data.venue.onlineLink ?? '';
    return (data as unknown as Record<string, unknown>)[key] as string;
  };

  const setSystemValue = (key: string, value: string) => {
    if (key.startsWith('venue_')) {
      updateData({ venue: { ...data.venue, [key.replace('venue_', '')]: value } });
      return;
    }
    if (key === 'onlineLink' || key === 'shareOnlineLinkLater') {
      updateData({ venue: { ...data.venue, [key]: value } });
      return;
    }
    if (key === 'refundPolicy' || key === 'cancellationPolicy' || key === 'attendeeMinAge') {
      updateData({ policies: { ...data.policies, [key]: value } });
      return;
    }
    updateData({ [key]: value } as Partial<typeof data>);
  };

  const getCustomValue = (key: string): string => data.customFieldValues[key] ?? '';
  const setCustomValue = (key: string, value: string) => updateData({ customFieldValues: { ...data.customFieldValues, [key]: value } });

  const systemFieldKeys = new Set([
    'title', 'description', 'shortDescription', 'eventType', 'format', 'isPaid',
    'startDate', 'startTime', 'endDate', 'endTime', 'timezone', 'maxCapacity',
    'venue_name', 'venue_address', 'venue_city', 'venue_state', 'venue_country',
    'onlineLink', 'shareOnlineLinkLater', 'refundPolicy', 'cancellationPolicy', 'attendeeMinAge',
    'coverImage', 'bannerImage', 'videoUrl', 'secondaryImages'
  ]);

  // For array fields (like secondaryImages) we bypass the string-typed setVal path
  const setArraySystemValue = (key: string, value: string[]) => {
    updateData({ [key]: value } as Partial<typeof data>);
  };

  const getArraySystemValue = (key: string): string[] => {
    if (key === 'secondaryImages') return Array.isArray(data.secondaryImages) ? data.secondaryImages : [];
    return [];
  };

  const arrayFieldKeys = new Set(['secondaryImages']);

  const categories = data.templateLayout?.forms?.find((f) => f.name === formName)?.categories || [];
  const categoriesMap = fields.reduce<Record<string, typeof fields>>((acc, f) => {
    const cat = f.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const sortedCategoryNames = Object.keys(categoriesMap).sort((a: string, b: string) => {
    const c1 = categories.find((c) => c.name === a);
    const c2 = categories.find((c) => c.name === b);

    const orderA = c1?.order ?? categoriesMap[a][0]?.categoryOrder ?? 999;
    const orderB = c2?.order ?? categoriesMap[b][0]?.categoryOrder ?? 999;

    return orderA - orderB || a.localeCompare(b);
  });

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{formName}</h2>

      <div className="space-y-8">
        {sortedCategoryNames.map((categoryName) => {
          const catFields = categoriesMap[categoryName];
          return (
            <div key={categoryName} className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm relative group">
              <div className="mb-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{categoryName}</h3>
              </div>
              <div className="space-y-5">
                {catFields.map((f) => {
                  if (f.key === 'startTime' || f.key === 'endTime') return null;

                  const isSystem = systemFieldKeys.has(f.key);
                  const isArrayField = arrayFieldKeys.has(f.key);
                  const val = (isArrayField
                    ? getArraySystemValue(f.key)
                    : isSystem ? getSystemValue(f.key) : getCustomValue(f.key)) as string | string[];

                  const setVal = (v: string) => isSystem ? setSystemValue(f.key, v) : setCustomValue(f.key, v);
                  const setArrVal = (v: string[]) => setArraySystemValue(f.key, v);
                  const hasError = !!typedErrors[f.key];

                  const resolvedMin = typeof f.min === 'number' ? f.min : (LIMITS as Record<string, { min?: number; max?: number }>)[f.key]?.min;
                  const resolvedMax = f.maxLength || f.max || (LIMITS as Record<string, { min?: number; max?: number }>)[f.key]?.max;

                  const common = {
                    className: inputCls(hasError),
                    value: val,
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setVal(e.target.value),
                  };

                  return (
                    <div key={f.key}>
                      <label className={labelCls}>
                        {f.key === 'startDate' ? 'Start Date & Time' : f.key === 'endDate' ? 'End Date & Time' : f.label}
                        {f.required && <span className="text-red-500"> *</span>}
                      </label>

                      {f.helpText && <p className="text-xs text-gray-400 mb-1">{f.helpText}</p>}
                      {(f.fieldType === 'text' || f.fieldType === 'textarea') && resolvedMax && (
                        <p className="text-xs text-gray-400 mb-2 italic">
                          {resolvedMin ? `Min: ${resolvedMin} chars, ` : ''}Max: {resolvedMax} chars
                        </p>
                      )}

                      {/* Special rendering for certain UI hints */}
                      {f.key === 'timezone' ? (
                        <div>
                          <TimezoneSelector
                            id={f.key}
                            value={val as string}
                            onChange={(tz) => setVal(tz)}
                          />
                          <FieldError msg={typedErrors[f.key]} />
                        </div>
                      ) : f.fieldType === 'textarea' ? (
                        <div>
                          <textarea rows={5} placeholder={f.placeholder} maxLength={f.maxLength} {...common} />
                          <div className="flex items-start justify-between">
                            <FieldError msg={typedErrors[f.key]} />
                            {f.maxLength && <CharCount current={val.length} max={f.maxLength} />}
                          </div>
                        </div>
                      ) : f.fieldType === 'select' ? (
                        <div>
                          <select {...common}>
                            <option value="">Select</option>
                            {(f.options ?? []).map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {f.key === 'eventType' && val === 'other' && (
                            <input
                              type="text"
                              placeholder="Specify custom event type"
                              className={`mt-2 ${inputCls()}`}
                              value={data.customEventType || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData({ customEventType: e.target.value })}
                            />
                          )}
                          <FieldError msg={typedErrors[f.key]} />
                        </div>
                      ) : f.fieldType === 'toggle' ? (
                        <div>
                          <div className="flex items-center mt-1">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={val === 'true'}
                              onClick={() => setVal(val === 'true' ? 'false' : 'true')}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${val === 'true' ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                              <span className="sr-only">Toggle {f.label}</span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${val === 'true' ? 'translate-x-5' : 'translate-x-0'}`}
                              />
                            </button>
                            <span className="ml-3 text-sm font-medium text-gray-900">{val === 'true' ? 'Yes' : 'No'}</span>
                          </div>
                          <FieldError msg={typedErrors[f.key]} />
                        </div>
                      ) : f.fieldType === 'file_image_multiple' ? (
                        <div>
                          {Array.isArray(val) && val.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-3">
                              {(val as string[]).map((url: string, idx: number) => (
                                <div key={idx} className="relative group w-32 h-24">
                                  <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = [...(val as string[])];
                                      newVal.splice(idx, 1);
                                      setArrVal(newVal);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {(!Array.isArray(val) || (val as string[]).length < 5) && (
                            <label className="block w-full cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 border-dashed rounded-lg px-4 py-3 text-center transition">
                              <span className="text-sm font-medium text-blue-600">
                                {uploadingField === f.key ? 'Uploading to S3...' : 'Upload Additional Image (Max 5)'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={!!uploadingField}
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (!files.length) return;
                                  try {
                                    setUploadingField(f.key);
                                    const currentArr = Array.isArray(val) ? (val as string[]) : [];
                                    const remainingSlots = 5 - currentArr.length;
                                    const toUpload = files.slice(0, remainingSlots);
                                    const newUrls = await Promise.all(toUpload.map(file => uploadApi.uploadFile(file as File)));
                                    setArrVal([...currentArr, ...newUrls]);
                                  } catch (err: unknown) {
                                    alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
                                  } finally {
                                    setUploadingField(null);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          )}
                          <FieldError msg={typedErrors[f.key]} />
                        </div>
                      ) : f.fieldType === 'file_image' || f.fieldType === 'file_video' ? (
                        <div>
                          {typeof val === 'string' && val && (
                            <div className="mb-3">
                              {f.fieldType === 'file_image' ? (
                                <img src={val} alt="Preview" className="w-32 h-24 object-cover rounded-lg border border-gray-200 shadow-sm" />
                              ) : (
                                <div className="w-32 h-24 bg-gray-100 flex items-center justify-center rounded border border-gray-200 overflow-hidden">
                                  <video src={val} className="w-full h-full object-cover opacity-50" />
                                </div>
                              )}
                            </div>
                          )}
                          <label className="block w-full cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 border-dashed rounded-lg px-4 py-3 text-center transition">
                            <span className="text-sm font-medium text-blue-600">
                              {uploadingField === f.key ? 'Uploading to S3...' : (val ? 'Change File' : `Upload ${f.fieldType === 'file_image' ? 'Image' : 'Video'}`)}
                            </span>
                            <input
                              type="file"
                              accept={f.fieldType === 'file_image' ? 'image/*' : 'video/mp4,video/webm'}
                              className="hidden"
                              disabled={!!uploadingField}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setUploadingField(f.key);
                                  const url = await uploadApi.uploadFile(file as File);
                                  setVal(url);
                                } catch (err: unknown) {
                                  alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
                                } finally {
                                  setUploadingField(null);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                          <FieldError msg={typedErrors[f.key]} />
                        </div>
                      ) : f.key === 'startDate' || f.key === 'endDate' ? (
                        <div>
                          <DateTimePicker
                            id={f.key}
                            dateValue={val as string}
                            timeValue={f.key === 'startDate' ? getSystemValue('startTime') : getSystemValue('endTime')}
                            onChange={(d, t) => {
                              setVal(d);
                              setSystemValue(f.key === 'startDate' ? 'startTime' : 'endTime', t);
                            }}
                            className={hasError ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500 hover:bg-gray-50 bg-white'}
                          />
                          <FieldError msg={typedErrors[f.key] || typedErrors[f.key === 'startDate' ? 'startTime' : 'endTime']} />
                        </div>
                      ) : (
                        <div>
                          <input
                            type={
                              f.fieldType === 'number' ? 'number'
                                : f.fieldType === 'url' ? 'url'
                                  : f.fieldType === 'email' ? 'email'
                                    : f.fieldType === 'phone' ? 'tel'
                                      : f.fieldType === 'date' ? 'date'
                                        : 'text'
                            }
                            placeholder={f.placeholder}
                            maxLength={f.maxLength}
                            min={f.fieldType === 'number' || f.fieldType === 'date' ? f.min : undefined}
                            max={f.fieldType === 'number' || f.fieldType === 'date' ? f.max : undefined}
                            {...common}
                          />
                          <div className="flex items-start justify-between">
                            <FieldError msg={typedErrors[f.key]} />
                            {f.maxLength && f.fieldType !== 'date' && f.fieldType !== 'time' && <CharCount current={(val as string).length || 0} max={f.maxLength} />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
