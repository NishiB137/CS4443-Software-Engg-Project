import React, { useState } from 'react';
import type { WizardStepProps, TicketingTier } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

const inputCls = (hasError?: boolean) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:outline-none transition ${
    hasError
      ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50'
      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
  }`;

const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const EMPTY_TIER: TicketingTier = { name: '', price: 0, capacity: 1, description: '' };

interface TierRowProps {
  tier: TicketingTier;
  index: number;
  onUpdate: (t: TicketingTier) => void;
  onRemove: () => void;
}

const TierRow: React.FC<TierRowProps> = ({ tier, index, onUpdate, onRemove }) => {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const set = (patch: Partial<TicketingTier>) => {
    onUpdate({ ...tier, ...patch });
    setLocalErrors(prev => {
      const next = { ...prev };
      Object.keys(patch).forEach(k => delete next[k]);
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!tier.name.trim()) errs.name = 'Tier name is required.';
    if (tier.price <= 0) errs.price = 'Price must be greater than 0.';
    if (!Number.isInteger(tier.capacity) || tier.capacity < 1) errs.capacity = 'Capacity must be at least 1.';
    setLocalErrors(errs);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative group">
      {/* Tier badge */}
      <div className="absolute -top-3 left-4">
        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          Tier {index + 1}
        </span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
        title="Remove tier"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3" onBlur={validate}>
        {/* Name */}
        <div className="sm:col-span-2">
          <label className={labelCls}>
            Tier Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Early Bird, VIP, General Admission"
            className={inputCls(!!localErrors.name)}
            value={tier.name}
            onChange={e => set({ name: e.target.value })}
            maxLength={100}
          />
          {localErrors.name && <p className="mt-1 text-xs text-red-600">{localErrors.name}</p>}
        </div>

        {/* Price */}
        <div>
          <label className={labelCls}>
            Price (₹ / $) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min={0.01}
              step={0.01}
              placeholder="0.00"
              className={`pl-7 ${inputCls(!!localErrors.price)}`}
              value={tier.price === 0 ? '' : tier.price}
              onChange={e => set({ price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          {localErrors.price && <p className="mt-1 text-xs text-red-600">{localErrors.price}</p>}
        </div>

        {/* Capacity */}
        <div>
          <label className={labelCls}>
            Available Tickets <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            step={1}
            placeholder="100"
            className={inputCls(!!localErrors.capacity)}
            value={tier.capacity === 0 ? '' : tier.capacity}
            onChange={e => set({ capacity: parseInt(e.target.value) || 0 })}
          />
          {localErrors.capacity && <p className="mt-1 text-xs text-red-600">{localErrors.capacity}</p>}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className={labelCls}>Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. Includes lunch and networking dinner"
            className={inputCls()}
            value={tier.description ?? ''}
            onChange={e => set({ description: e.target.value })}
            maxLength={300}
          />
        </div>
      </div>
    </div>
  );
};

export const TicketingTiersStep: React.FC<WizardStepProps> = ({ data, updateData }) => {
  const tiers = data.ticketingTiers ?? [];

  const addTier = () => {
    updateData({ ticketingTiers: [...tiers, { ...EMPTY_TIER }] });
  };

  const updateTier = (idx: number, t: TicketingTier) => {
    const next = [...tiers];
    next[idx] = t;
    updateData({ ticketingTiers: next });
  };

  const removeTier = (idx: number) => {
    updateData({ ticketingTiers: tiers.filter((_, i) => i !== idx) });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-3">
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Ticketing Tiers</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Define different ticket types for your paid event — e.g. Early Bird, General, VIP
        </p>
      </div>

      {tiers.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center bg-gray-50/50">
          <div className="text-4xl mb-3">🎟️</div>
          <p className="text-sm font-medium text-gray-700 mb-1">No ticketing tiers added yet</p>
          <p className="text-xs text-gray-400 mb-6">Add at least one tier so attendees can purchase tickets</p>
          <button
            type="button"
            onClick={addTier}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            + Add First Tier
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {tiers.map((tier, idx) => (
            <TierRow
              key={idx}
              tier={tier}
              index={idx}
              onUpdate={t => updateTier(idx, t)}
              onRemove={() => removeTier(idx)}
            />
          ))}

          {/* Price summary */}
          {tiers.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between text-sm">
              <span className="text-blue-700 font-medium">
                {tiers.length} tier{tiers.length > 1 ? 's' : ''} · {tiers.reduce((acc, t) => acc + (t.capacity || 0), 0).toLocaleString()} total tickets
              </span>
              <span className="text-blue-700 font-medium">
                ${Math.min(...tiers.map(t => t.price)).toFixed(2)} – ${Math.max(...tiers.map(t => t.price)).toFixed(2)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={addTier}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
          >
            + Add Another Tier
          </button>
        </div>
      )}
    </div>
  );
};
