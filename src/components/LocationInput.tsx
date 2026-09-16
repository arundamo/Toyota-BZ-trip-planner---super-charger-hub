import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Loader2, 
  X, 
  Building2, 
  Zap, 
  MapPinned, 
  Compass,
  AlertCircle,
  Check
} from 'lucide-react';
import { LatLng } from '../types';

export interface AddressSuggestion {
  id: string;
  displayName: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
  type: 'city' | 'address' | 'poi' | 'supercharger';
}

interface LocationInputProps {
  id: string;
  label: string;
  labelColorClass?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  value: string;
  onChange: (value: string, coords?: LatLng | null) => void;
  onSelectLocation?: (name: string, coords: LatLng) => void;
  accentBorderClass?: string;
  disabled?: boolean;
  required?: boolean;
  enableCurrentLocation?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  labelColorClass = 'text-cyan-500',
  icon,
  placeholder = 'Enter city or address...',
  value,
  onChange,
  onSelectLocation,
  accentBorderClass = 'focus-within:border-cyan-500',
  disabled = false,
  required = false,
  enableCurrentLocation = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Query address lookup API with debouncing
  const fetchSuggestions = useCallback(async (queryText: string) => {
    if (!queryText || queryText.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/address-lookup?q=${encodeURIComponent(queryText.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue, null); // Clear explicit coordinates when user types manually
    setGeoError(null);
    setSelectedIndex(-1);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 220);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.displayName, { lat: suggestion.lat, lng: suggestion.lng });
    if (onSelectLocation) {
      onSelectLocation(suggestion.displayName, { lat: suggestion.lat, lng: suggestion.lng });
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Browser GPS Geolocation handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingUser(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          // Reverse geocode to get a user-friendly city or address name
          const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
          if (response.ok) {
            const data = await response.json();
            const displayName = data.displayName || `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            onChange(displayName, { lat, lng });
            if (onSelectLocation) {
              onSelectLocation(displayName, { lat, lng });
            }
          } else {
            const fallbackName = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            onChange(fallbackName, { lat, lng });
            if (onSelectLocation) {
              onSelectLocation(fallbackName, { lat, lng });
            }
          }
        } catch (err) {
          const fallbackName = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          onChange(fallbackName, { lat, lng });
          if (onSelectLocation) {
            onSelectLocation(fallbackName, { lat, lng });
          }
        } finally {
          setLocatingUser(false);
          setIsOpen(false);
        }
      },
      (err) => {
        setLocatingUser(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access denied. Please enable location permission in browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Location info currently unavailable.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Location request timed out. Please try again.');
        } else {
          setGeoError('Unable to retrieve current location.');
        }
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    const totalOptions = suggestions.length + (enableCurrentLocation ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex === 0 && enableCurrentLocation) {
        handleUseCurrentLocation();
      } else if (selectedIndex > 0 && enableCurrentLocation) {
        const suggestion = suggestions[selectedIndex - 1];
        if (suggestion) handleSelectSuggestion(suggestion);
      } else if (selectedIndex >= 0 && !enableCurrentLocation) {
        const suggestion = suggestions[selectedIndex];
        if (suggestion) handleSelectSuggestion(suggestion);
      } else if (suggestions.length > 0) {
        // Pick first suggestion if none highlighted
        handleSelectSuggestion(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', null);
    setGeoError(null);
    setSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderBadge = (type: AddressSuggestion['type']) => {
    switch (type) {
      case 'city':
        return (
          <span className="text-[9px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40 px-1.5 py-0.5 rounded uppercase">
            City
          </span>
        );
      case 'supercharger':
        return (
          <span className="text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/40 px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-400" /> Supercharger
          </span>
        );
      case 'poi':
        return (
          <span className="text-[9px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-800/40 px-1.5 py-0.5 rounded uppercase">
            POI
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-800 px-1.5 py-0.5 rounded uppercase">
            Address
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input container wrapper */}
      <div 
        className={`relative w-full bg-slate-50/90 dark:bg-[#111624] border border-slate-300 dark:border-slate-800 rounded-2xl transition-all duration-150 shadow-sm focus-within:ring-2 focus-within:ring-cyan-500/25 ${accentBorderClass} ${
          isOpen ? 'ring-2 ring-cyan-500/30 border-cyan-500' : ''
        }`}
      >
        <label 
          htmlFor={id} 
          className={`absolute left-3.5 top-2 text-[8.5px] font-mono font-bold uppercase tracking-wider block ${labelColorClass}`}
        >
          {label}
        </label>

        {/* Left icon */}
        <div className="absolute left-3.5 bottom-3 pointer-events-none">
          {icon || <MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            if (value.trim().length >= 2 && suggestions.length === 0) {
              fetchSuggestions(value);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className="w-full bg-transparent pt-6 pb-2.5 pl-10 pr-20 text-xs font-semibold tracking-tight text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
        />

        {/* Right action icons (Clear button & GPS button) */}
        <div className="absolute right-2.5 bottom-2 flex items-center space-x-1.5">
          {/* Loading spinner */}
          {loading && (
            <div className="p-1 text-cyan-600 dark:text-cyan-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          )}

          {/* Clear button */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Current GPS Location trigger button */}
          {enableCurrentLocation && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locatingUser || disabled}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                locatingUser
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600 dark:text-cyan-300'
                  : 'bg-white dark:bg-slate-900/90 border-slate-300 dark:border-slate-800 hover:border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 shadow-sm'
              }`}
              title="Use current GPS location"
              aria-label="Use current location"
            >
              {locatingUser ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 hover:scale-110 transition-transform" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Geolocation feedback error banner */}
      {geoError && (
        <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 flex items-center space-x-2 text-[10px] text-rose-800 dark:text-rose-300 animate-fadeIn">
          <AlertCircle className="w-3 h-3 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{geoError}</span>
          <button 
            type="button" 
            onClick={() => setGeoError(null)} 
            className="ml-auto text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-white font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Autocomplete / Lookup Suggestions Popover Dropdown */}
      {isOpen && (
        <div 
          id={`${id}-suggestions`}
          className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fadeIn max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850"
        >
          {/* Quick Option 1: "Use Current Location" option row */}
          {enableCurrentLocation && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locatingUser}
              className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors cursor-pointer group ${
                selectedIndex === 0 
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-slate-900 dark:text-white' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/90 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:text-slate-950 transition-colors">
                  {locatingUser ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Crosshair className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 group-hover:text-cyan-800 dark:group-hover:text-cyan-300 flex items-center gap-1.5">
                    <span>Use Current Location</span>
                    {locatingUser && (
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-normal animate-pulse">
                        (Acquiring GPS...)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Detect exact GPS coordinates & nearest address
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400/80 bg-cyan-100 dark:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/30">
                GPS
              </span>
            </button>
          )}

          {/* Lookup Suggestions Results */}
          {suggestions.length > 0 ? (
            <div className="py-1">
              <div className="px-3.5 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Matching Addresses & Locations
              </div>
              {suggestions.map((item, idx) => {
                const itemIndex = enableCurrentLocation ? idx + 1 : idx;
                const isSelected = selectedIndex === itemIndex;

                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer group ${
                      isSelected 
                        ? 'bg-cyan-50 dark:bg-cyan-500/15 text-slate-900 dark:text-white' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0 pr-2">
                      <div className="mt-0.5 w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:border-cyan-400 dark:group-hover:border-cyan-500/40 transition-colors shrink-0">
                        {item.type === 'city' ? (
                          <Building2 className="w-3 h-3" />
                        ) : item.type === 'supercharger' ? (
                          <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                        ) : (
                          <MapPinned className="w-3 h-3" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                          {item.mainText}
                        </div>
                        {item.secondaryText && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-sans mt-0.5">
                            {item.secondaryText}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      {renderBadge(item.type)}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : value.trim().length >= 2 && !loading ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 font-sans">
              <Compass className="w-5 h-5 mx-auto mb-1.5 text-slate-400 dark:text-slate-500" />
              <span>No exact address matches found. Press Search to plan with direct corridor routing.</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
