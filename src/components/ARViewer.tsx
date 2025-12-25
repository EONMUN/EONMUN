'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Camera, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ARViewerProps {
  imageUrl: string;
  artworkTitle: string;
  onClose: () => void;
}

export function ARViewer({ imageUrl, artworkTitle, onClose }: ARViewerProps) {
  const [error, setError] = useState<string>('');
  const [artworkPosition, setArtworkPosition] = useState({ x: 50, y: 50 });
  const [artworkScale, setArtworkScale] = useState(1);
  const [artworkRotation, setArtworkRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        // Request camera access with environment-facing camera preference
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        currentStream = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please ensure you have granted camera permissions.');
      }
    }

    startCamera();

    // Cleanup function
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - artworkPosition.x,
      y: e.clientY - artworkPosition.y,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - dragStart.x) / rect.width) * 100;
    const y = ((e.clientY - dragStart.y) / rect.height) * 100;

    setArtworkPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleZoomIn = () => {
    setArtworkScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setArtworkScale(prev => Math.max(prev - 0.1, 0.3));
  };

  const handleRotate = () => {
    setArtworkRotation(prev => (prev + 15) % 360);
  };

  const handleReset = () => {
    setArtworkPosition({ x: 50, y: 50 });
    setArtworkScale(1);
    setArtworkRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Artwork overlay */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={artworkTitle}
          className="absolute pointer-events-none select-none"
          draggable={false}
          style={{
            left: `${artworkPosition.x}%`,
            top: `${artworkPosition.y}%`,
            transform: `translate(-50%, -50%) scale(${artworkScale}) rotate(${artworkRotation}deg)`,
            maxWidth: '80%',
            maxHeight: '80%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            <span className="text-sm font-medium">AR View</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close AR viewer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-20 left-0 right-0 px-4">
        <div className="bg-black/70 text-white text-sm px-4 py-3 rounded-lg max-w-md mx-auto">
          <p className="font-medium mb-1">{artworkTitle}</p>
          <p className="text-white/80">Drag to move • Use controls to adjust size and rotation</p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleZoomOut}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleRotate}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Rotate"
          >
            <RotateCw className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Reset position"
          >
            <span className="text-white text-sm font-medium">Reset</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-red-500/20 border border-red-500 text-white px-6 py-4 rounded-lg max-w-md text-center">
            <p className="font-medium mb-2">Camera Access Required</p>
            <p className="text-sm text-white/90">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
