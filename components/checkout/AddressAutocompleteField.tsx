'use client';

import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SHIPPING_REGIONS } from '@/lib/region-data';

type AddressSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    state?: string;
    province?: string;
    county?: string;
    district?: string;
    city?: string;
    municipality?: string;
    town?: string;
    village?: string;
  };
};

function normalizePlaceText(value?: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/\b(province|district|metropolitan city|sub-metropolitan city|rural municipality|municipality)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferProvinceDistrict(suggestion: AddressSuggestion): { province?: string; district?: string } {
  const candidates = [
    suggestion.address?.state,
    suggestion.address?.province,
    suggestion.address?.county,
    suggestion.address?.district,
    suggestion.address?.city,
    suggestion.address?.municipality,
    suggestion.address?.town,
    suggestion.address?.village,
    ...suggestion.display_name.split(','),
  ]
    .map(normalizePlaceText)
    .filter(Boolean);

  let province: string | undefined;
  const provinces = Object.keys(SHIPPING_REGIONS);

  for (const currentProvince of provinces) {
    const normalizedProvince = normalizePlaceText(currentProvince);
    if (candidates.some((candidate) => candidate.includes(normalizedProvince) || normalizedProvince.includes(candidate))) {
      province = currentProvince;
      break;
    }
  }

  const districtPool = province ? SHIPPING_REGIONS[province] : provinces.flatMap((currentProvince) => SHIPPING_REGIONS[currentProvince]);

  let district: string | undefined;
  for (const currentDistrict of districtPool) {
    const normalizedDistrict = normalizePlaceText(currentDistrict);
    if (candidates.some((candidate) => candidate.includes(normalizedDistrict) || normalizedDistrict.includes(candidate))) {
      district = currentDistrict;
      break;
    }
  }

  if (!province && district) {
    province = provinces.find((currentProvince) => SHIPPING_REGIONS[currentProvince].includes(district));
  }

  return { province, district };
}

type Props = {
  value: string;
  placeholder: string;
  hint: string;
  couldntFetchAddress: string;
  locationSaved: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onProvinceDetected: (value: string) => void;
  onDistrictDetected: (value: string) => void;
};

export default function AddressAutocompleteField({
  value,
  placeholder,
  hint,
  couldntFetchAddress,
  locationSaved,
  error,
  onChange,
  onBlur,
  onProvinceDetected,
  onDistrictDetected,
}: Props) {
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressHintError, setAddressHintError] = useState('');
  const [selectedLatLon, setSelectedLatLon] = useState<{ lat: string; lon: string } | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const addressAbortRef = useRef<AbortController | null>(null);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressCacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map());

  const fetchAddressSuggestions = (query: string) => {
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);

    if (query.trim().length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setIsAddressLoading(false);
      setAddressHintError('');
      return;
    }

    addressDebounceRef.current = setTimeout(async () => {
      const normalized = query.trim().toLowerCase();
      if (addressCacheRef.current.has(normalized)) {
        const cached = addressCacheRef.current.get(normalized) || [];
        setAddressSuggestions(cached);
        setShowSuggestions(cached.length > 0);
        setAddressHintError('');
        return;
      }

      addressAbortRef.current?.abort();
      const controller = new AbortController();
      addressAbortRef.current = controller;
      setIsAddressLoading(true);
      setAddressHintError('');

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Address lookup failed');
        const data = (await response.json()) as AddressSuggestion[];
        addressCacheRef.current.set(normalized, data);
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setAddressHintError(couldntFetchAddress);
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setIsAddressLoading(false);
      }
    }, 500);
  };

  return (
    <div>
      <div className="relative">
        <input
          required
          className={`w-full p-2.5 border rounded-lg ${error ? 'border-red-300 bg-red-50/30' : 'border-stone-200'}`}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setSelectedLatLon(null);
            fetchAddressSuggestions(event.target.value);
          }}
          onBlur={() => {
            onBlur();
            setTimeout(() => setShowSuggestions(false), 120);
          }}
          onFocus={() => {
            if (addressSuggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
        />
        {isAddressLoading && <Loader2 className="w-4 h-4 animate-spin text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />}
        {showSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-xl max-h-64 overflow-auto">
            {addressSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-b-0"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(suggestion.display_name);
                  setSelectedLatLon({ lat: suggestion.lat, lon: suggestion.lon });
                  const inferred = inferProvinceDistrict(suggestion);
                  if (inferred.province) onProvinceDetected(inferred.province);
                  if (inferred.district) onDistrictDetected(inferred.district);
                  setShowSuggestions(false);
                  setAddressHintError('');
                  setTimeout(() => onBlur(), 50);
                }}
              >
                {suggestion.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-stone-400 mt-1">{hint}</p>
      {addressHintError && <p className="text-xs text-amber-700 mt-1">{addressHintError}</p>}
      {selectedLatLon && <p className="text-[11px] text-stone-400 mt-1">{locationSaved}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
