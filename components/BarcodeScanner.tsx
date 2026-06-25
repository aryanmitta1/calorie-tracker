'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { lookupBarcode, type FoodResult } from '@/lib/foodSearch';
import ServingPicker from '@/components/ServingPicker';

interface Props {
  onAdd: (calories: number, protein: number, carbs: number, description: string) => void;
}

type Status = 'idle' | 'scanning' | 'looking-up' | 'not-found' | 'error';

export default function BarcodeScanner({ onAdd }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [found, setFound] = useState<FoodResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const handleCode = useCallback(async (code: string) => {
    setStatus('looking-up');
    try {
      const product = await lookupBarcode(code);
      if (product) {
        setFound(product);
        setStatus('idle');
      } else {
        setStatus('not-found');
        setMessage(`No product found for barcode ${code}.`);
      }
    } catch {
      setStatus('error');
      setMessage('Lookup failed — check your connection.');
    }
  }, []);

  // Start the camera only once the <video> element is actually mounted
  // (i.e. after status flips to 'scanning' and React has rendered it).
  useEffect(() => {
    if (status !== 'scanning' || !videoRef.current) return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, _err, controls) => {
        if (!result) return;
        controls.stop();
        controlsRef.current = null;
        handleCode(result.getText());
      })
      .then(controls => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setMessage('Camera unavailable. Grant camera permission or use search instead.');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [status, handleCode]);

  // Clean up if the component unmounts mid-scan.
  useEffect(() => () => stopCamera(), [stopCamera]);

  function handleConfirm(calories: number, protein: number, carbs: number, description: string) {
    onAdd(calories, protein, carbs, description);
    setFound(null);
    setStatus('idle');
  }

  return (
    <div className="card mb-4 space-y-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Scan Barcode</h2>

      {status === 'scanning' && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
          <div className="absolute inset-0 border-2 border-blue-500/40 rounded-xl pointer-events-none" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {found && (
          <ServingPicker
            key="picker"
            food={found}
            onConfirm={handleConfirm}
            onCancel={() => setFound(null)}
          />
        )}
      </AnimatePresence>

      {status === 'looking-up' && <p className="text-xs text-zinc-500">Looking up product…</p>}
      {(status === 'not-found' || status === 'error') && (
        <p className={`text-xs ${status === 'error' ? 'text-red-400' : 'text-zinc-500'}`}>{message}</p>
      )}

      {status === 'scanning' ? (
        <button
          onClick={() => { stopCamera(); setStatus('idle'); }}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors active:scale-[0.98]"
        >
          Stop scanning
        </button>
      ) : (
        !found && (
          <button
            onClick={() => { setMessage(''); setFound(null); setStatus('scanning'); }}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 transition-colors active:scale-[0.98]"
          >
            ▢ Start camera
          </button>
        )
      )}
    </div>
  );
}
