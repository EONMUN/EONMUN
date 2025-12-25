'use client';

import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { ARViewer } from './ARViewer';

interface ARViewButtonProps {
  imageUrl: string;
  artworkTitle: string;
  className?: string;
}

export function ARViewButton({ imageUrl, artworkTitle, className = '' }: ARViewButtonProps) {
  const [isAROpen, setIsAROpen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if camera API is supported
    const checkSupport = () => {
      const hasMediaDevices = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      setIsSupported(hasMediaDevices);
    };

    checkSupport();
  }, []);

  if (!isSupported) {
    return null; // Don't show button if camera is not supported
  }

  return (
    <>
      <button
        onClick={() => setIsAROpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-3 bg-secondary text-on-secondary rounded-lg hover:bg-secondary/90 transition-colors font-medium ${className}`}
        aria-label="View in AR"
      >
        <Camera className="w-5 h-5" />
        <span>View on Your Wall</span>
      </button>

      {isAROpen && (
        <ARViewer
          imageUrl={imageUrl}
          artworkTitle={artworkTitle}
          onClose={() => setIsAROpen(false)}
        />
      )}
    </>
  );
}
