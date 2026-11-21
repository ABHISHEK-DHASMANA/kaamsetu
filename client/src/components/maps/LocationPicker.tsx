import React from 'react';
import { MapPin, LocateFixed } from 'lucide-react';

export interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  coordinates: Coordinates;
  onChange: (coordinates: Coordinates) => void;
  title?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ coordinates, onChange, title = 'Saved map location' }) => {
  const requestLocation = () => {
    if (!navigator.geolocation) {
      window.alert('Location is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => onChange({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => window.alert('Location permission was not granted. You can update the location later.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const mapUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=' +
    [coordinates.lng - 0.008, coordinates.lat - 0.008, coordinates.lng + 0.008, coordinates.lat + 0.008].join('%2C') +
    '&layer=mapnik&marker=' + coordinates.lat + '%2C' + coordinates.lng;
  const openUrl = 'https://www.openstreetmap.org/?mlat=' + coordinates.lat + '&mlon=' + coordinates.lng +
    '#map=16/' + coordinates.lat + '/' + coordinates.lng;

  return (
    <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-brand-dark flex items-center gap-2"><MapPin className="w-4 h-4" />{title}</label>
        <button type="button" onClick={requestLocation} className="text-xs font-bold text-brand-primary inline-flex items-center gap-1">
          <LocateFixed className="w-3.5 h-3.5" /> Use current location
        </button>
      </div>
      <iframe title={title} src={mapUrl} loading="lazy" className="w-full h-44 rounded-xl border-0" />
      <div className="flex items-center justify-between gap-2 text-[11px] text-brand-muted">
        <span>{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</span>
        <a href={openUrl} target="_blank" rel="noreferrer" className="text-brand-primary underline">Open full map</a>
      </div>
      <p className="text-[11px] text-brand-muted">Location permission is optional. Your exact personal location is used for matching and should not be shared publicly.</p>
    </section>
  );
};
