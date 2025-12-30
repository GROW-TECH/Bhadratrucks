import { useEffect, useRef } from 'react';

interface LocationSearchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function LocationSearchInput({
  label,
  value,
  onChange,
  placeholder,
}: LocationSearchInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // if Google not ready, just leave it as normal text input
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    if (!inputRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ['formatted_address', 'name'],
          types: ['geocode'],
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const text =
          place?.formatted_address || place?.name || inputRef.current?.value || '';
        onChange(text);
      });

      // cleanup
      return () => {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      };
    } catch (err) {
      console.error('Autocomplete init error', err);
    }
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
    </div>
  );
}
