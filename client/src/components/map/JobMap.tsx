import React, { useEffect, useRef } from 'react';
import { Job } from '../../types';
import L from 'leaflet';

interface JobMapProps {
  jobs: Job[];
  userLocation?: { lat: number; lng: number };
  onSelectJob?: (job: Job) => void;
  height?: string;
}

export const JobMap: React.FC<JobMapProps> = ({
  jobs,
  userLocation = { lat: 28.6280, lng: 77.3649 }, // Default Noida Sector 62
  onSelectJob,
  height = '420px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent duplicate map instances
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 13,
      scrollWheelZoom: false
    });

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom marker icon for Worker base location
    const workerIcon = L.divIcon({
      className: 'custom-worker-pin',
      html: `
        <div style="background-color: #145C48; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: bold; font-size: 16px;">
          📍
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });

    L.marker([userLocation.lat, userLocation.lng], { icon: workerIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <div style="font-weight: bold; color: #145C48; font-size: 13px;">Your Location</div>
          <div style="font-size: 11px; color: #64748b;">Noida Sector 62 Base</div>
        </div>
      `);

    // Add Job markers
    jobs.forEach((job) => {
      const coords = job.location?.coordinates;
      if (!coords || !coords.lat || !coords.lng) return;

      const isHighMatch = (job.matchScore || 0) >= 85;
      const markerColor = isHighMatch ? '#F4A340' : '#1F8066';

      const jobIcon = L.divIcon({
        className: 'custom-job-pin',
        html: `
          <div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 3px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: bold; font-size: 11px;">
            ${job.matchScore ? `${job.matchScore}%` : '₹'}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const popupHtml = `
        <div style="font-family: Inter, sans-serif; min-width: 190px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; background: #e6f4f0; color: #145c48; padding: 2px 6px; border-radius: 4px;">
              ${job.category || 'Trade'}
            </span>
            ${job.matchScore ? `<span style="font-size: 10px; font-weight: bold; color: #f4a340;">${job.matchScore}% Match</span>` : ''}
          </div>
          <div style="font-weight: 700; color: #172b25; font-size: 12px; margin-bottom: 2px;">
            ${job.title}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
            ${job.companyName} • ${job.location?.area || 'NCR'}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #145c48; margin-bottom: 6px;">
            ₹${job.offeredWage}<span style="font-size: 10px; font-weight: 400; color: #64748b;">/${job.wageType}</span>
          </div>
          <div style="font-size: 10px; color: #0284c7; margin-bottom: 6px;">
            ${job.distanceKm ? `📍 ~${job.distanceKm} km away` : '📍 Hyperlocal NCR'}
          </div>
        </div>
      `;

      const marker = L.marker([coords.lat, coords.lng], { icon: jobIcon })
        .addTo(map)
        .bindPopup(popupHtml);

      if (onSelectJob) {
        marker.on('click', () => {
          onSelectJob(job);
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [jobs, userLocation]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-brand-border shadow-sm">
      <div ref={mapContainerRef} style={{ height }} />
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-brand-border shadow-md text-[11px] font-medium text-brand-dark flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-accent" />
          <span>High Match (85%+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
          <span>Local Work</span>
        </div>
      </div>
    </div>
  );
};
