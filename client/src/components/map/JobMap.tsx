import React, { useEffect, useRef, useState } from 'react';
import { Job } from '../../types';
import L from 'leaflet';

interface JobMapProps {
  jobs: Job[];
  userLocation?: { lat: number; lng: number };
  onSelectJob?: (job: Job) => void;
  height?: string;
}

const validPoint = (lat: unknown, lng: unknown): lat is number =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) &&
  Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const JobMap: React.FC<JobMapProps> = ({
  jobs,
  userLocation: suppliedLocation,
  onSelectJob,
  height = '420px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(suppliedLocation || null);
  const [locationMessage, setLocationMessage] = useState('Requesting your location…');

  useEffect(() => {
    if (suppliedLocation && validPoint(suppliedLocation.lat, suppliedLocation.lng)) {
      setGpsLocation(suppliedLocation);
      setLocationMessage('Using your selected location');
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser. Showing job pins only.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        setGpsLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationMessage('Your live location is shown on this device only.');
      },
      () => setLocationMessage('Location permission was not granted. Showing job pins only.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [suppliedLocation?.lat, suppliedLocation?.lng]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const validJobs = jobs.filter(job => validPoint(job.location?.coordinates?.lat, job.location?.coordinates?.lng));
    const fallback = validJobs[0]?.location?.coordinates;
    const center: [number, number] = gpsLocation
      ? [gpsLocation.lat, gpsLocation.lng]
      : fallback ? [Number(fallback.lat), Number(fallback.lng)] : [28.6139, 77.2090];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: gpsLocation || fallback ? 13 : 5,
      scrollWheelZoom: false
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (gpsLocation) {
      L.marker([gpsLocation.lat, gpsLocation.lng])
        .addTo(map)
        .bindPopup('<strong>Your current location</strong><br/>Visible only on this device');
    }

    validJobs.forEach(job => {
      const coords = job.location!.coordinates!;
      const destination = `${Number(coords.lat)},${Number(coords.lng)}`;
      const originParam = gpsLocation ? `&origin=${gpsLocation.lat},${gpsLocation.lng}` : '';
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}${originParam}&travelmode=driving`;
      const title = escapeHtml(job.title);
      const company = escapeHtml(job.companyName);
      const area = escapeHtml(job.location?.area || job.location?.city || 'Worksite');
      const wage = escapeHtml(job.offeredWage);
      const category = escapeHtml(job.category || 'Local work');
      const popup = `
        <div style="font-family:Arial,sans-serif;min-width:190px">
          <strong>${title}</strong>
          <div style="font-size:12px;color:#64748b;margin:4px 0">${company} · ${area}</div>
          <div style="font-size:13px;font-weight:700;color:#145c48">₹${wage}/${escapeHtml(job.wageType || 'day')}</div>
          <div style="font-size:11px;margin:5px 0">${category}</div>
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;margin-top:5px;padding:7px 10px;background:#145c48;color:#fff;border-radius:7px;text-decoration:none;font-weight:700">
             Open directions in Google Maps
          </a>
          <div style="font-size:10px;color:#64748b;margin-top:5px">Google Maps calculates the road route and travel distance.</div>
        </div>`;
      const marker = L.marker([Number(coords.lat), Number(coords.lng)]).addTo(map).bindPopup(popup);
      marker.on('click', () => onSelectJob?.(job));
    });

    if (gpsLocation && validJobs.length) {
      const bounds = L.latLngBounds([[gpsLocation.lat, gpsLocation.lng], ...validJobs.map(job => [
        Number(job.location!.coordinates!.lat), Number(job.location!.coordinates!.lng)
      ] as [number, number])]);
      map.fitBounds(bounds.pad(0.15), { maxZoom: 14 });
    } else if (validJobs.length > 1) {
      const bounds = L.latLngBounds(validJobs.map(job => [
        Number(job.location!.coordinates!.lat), Number(job.location!.coordinates!.lng)
      ] as [number, number]));
      map.fitBounds(bounds.pad(0.15));
    }

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [jobs, gpsLocation, onSelectJob]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-brand-border shadow-sm">
      <div ref={mapContainerRef} style={{ height }} />
      <div className="absolute top-3 left-3 z-[1000] max-w-[85%] bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-brand-border shadow text-[11px] text-brand-dark">
        {locationMessage}
      </div>
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-brand-border shadow text-[11px] text-brand-dark">
        Distances shown by Google Maps are road-route estimates. Missing worksite pins cannot be routed.
      </div>
    </div>
  );
};
