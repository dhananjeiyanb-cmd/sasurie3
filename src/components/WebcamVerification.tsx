import React, { useRef, useEffect, useState } from 'react';
import {
  analyzeVideoFrame,
  buildSkinHueHistogram,
  captureFrameForCompare,
  computeIdentityConfidence,
  loadImageCors,
  WebcamVerificationResult,
} from '../utils/webcamAnalysis';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Users,
  Shield,
  RefreshCw,
} from 'lucide-react';

export interface WebcamVerificationProps {
  onVerified: (result?: WebcamVerificationResult) => void;
  onCancel: () => void;
  studentName: string;
  studentPhotoUrl?: string;
}

export const WebcamVerification: React.FC<WebcamVerificationProps> = ({
  onVerified,
  onCancel,
  studentName,
  studentPhotoUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);

  // Identity verification state
  const [photoAvailable, setPhotoAvailable] = useState(false);
  const [photoAnalyzable, setPhotoAnalyzable] = useState(false);
  const [identityConfidence, setIdentityConfidence] = useState<number | null>(null);
  const [identityMatch, setIdentityMatch] = useState<boolean | null>(null);
  const [manualConfirm, setManualConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startWebcam = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to access webcam. Please allow camera permissions and try again.');
      }
    };

    startWebcam();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Real-time face presence + multi-face detection from the live feed.
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    let raf: number;

    const tick = () => {
      const { facePresent, faceCount: count } = analyzeVideoFrame(video);
      setFaceDetected(facePresent);
      setFaceCount(count);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [stream]);

  // Load the student's registered photo (CORS-enabled) and pre-compute its skin
  // hue histogram so the identity check need not block the Verify click.
  useEffect(() => {
    if (!studentPhotoUrl) {
      setPhotoAvailable(false);
      return;
    }
    setPhotoAvailable(true);
    let cancelled = false;

    loadImageCors(studentPhotoUrl)
      .then((img) => {
        if (cancelled) return;
        const photoCanvas = photoCanvasRef.current;
        if (!photoCanvas) return;
        const size = 62;
        photoCanvas.width = size;
        photoCanvas.height = size;
        const ctx = photoCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        const hist = buildSkinHueHistogram(photoCanvas);
        setPhotoAnalyzable(!!hist);
      })
      .catch(() => {
        if (cancelled) return;
        setPhotoAnalyzable(false);
      });

        return () => {
      cancelled = true;
    };
  }, [studentPhotoUrl]);

  const runIdentityCheck = (): number | null => {
    if (!videoRef.current || !photoCanvasRef.current) return null;
    const liveCanvas = captureFrameForCompare(videoRef.current);
    if (!liveCanvas) return null;
    return computeIdentityConfidence(liveCanvas, photoCanvasRef.current);
  };

  const handleVerify = () => {
    if (!stream) return;
    if (!faceDetected) {
      setError('No face detected. Please position yourself in front of the camera.');
      return;
    }
    if (faceCount > 1) {
      setError(
        'Multiple faces detected. Please ensure only one person (you) is in front of the camera.'
      );
      return;
    }

    setIsVerifying(true);
    setError('');

    const confidence = runIdentityCheck();
    setIdentityConfidence(confidence);

    if (photoAvailable && photoAnalyzable && confidence !== null) {
      const match = confidence >= 40;
      setIdentityMatch(match);
      if (match) {
        finishVerify('auto');
        return;
      }
      setError(
        `Identity similarity is low (${confidence}%). Confirm using the manual option below, or re-take your registered photo.`
      );
    } else if (photoAvailable && photoAnalyzable && confidence === null) {
      setIdentityMatch(null);
      setError('Identity could not be computed (no comparable skin tone). Please confirm using the manual option below.');
    } else {
      setIdentityMatch(null);
      setError(
        'No registered photo is available for automatic identity comparison. Please confirm that the person in the camera is you.'
      );
    }

    setIsVerifying(false);
  };

  const handleConfirmAndVerify = () => {
    setManualConfirm(true);
    finishVerify('manual');
  };

  const finishVerify = (method: 'auto' | 'manual') => {
    setIsVerifying(true);
    const result: WebcamVerificationResult = {
      faceDetected,
      faceCount,
      photoAvailable,
      identityMatch: identityMatch ?? manualConfirm,
      confidence: identityConfidence,
      method,
      verifiedAt: new Date().toISOString(),
    };
    setTimeout(() => {
      setVerified(true);
      setIsVerifying(false);
      setTimeout(() => onVerified(result), 800);
    }, 1000);
  };

    const canProceedManually = faceDetected && faceCount <= 1 && !identityMatch && !manualConfirm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full shadow-2xl">
        <div className="text-center mb-6">
          <Camera className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Webcam Verification</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student: <span className="font-bold text-slate-700 dark:text-slate-300">{studentName}</span>
          </p>
        </div>

        <div className="flex gap-4 items-center justify-center mb-4">
          {/* Registered photo preview */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registered photo</p>
            {studentPhotoUrl ? (
              <img
                src={studentPhotoUrl}
                alt="Registered"
                crossOrigin="anonymous"
                className="w-24 h-24 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                No photo
              </div>
            )}
            {studentPhotoUrl && photoAnalyzable && (
              <span className="text-[10px] text-emerald-600 font-medium">Comparable</span>
            )}
            {studentPhotoUrl && !photoAnalyzable && photoAvailable && (
              <span className="text-[10px] text-amber-600 font-medium">Verify manually</span>
            )}
          </div>

          <div className="text-slate-400">→</div>

          {/* Live camera feed */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live camera</p>
            <div className="relative bg-slate-950 rounded-xl overflow-hidden w-64 aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CameraOff className="w-16 h-16 text-slate-600" />
                </div>
              )}

              {stream && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              )}

              {faceDetected && stream && faceCount <= 1 && (
                <div className="absolute bottom-3 right-3 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Face Detected
                </div>
              )}

              {faceCount > 1 && (
                <div className="absolute bottom-3 left-3 bg-rose-600/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {faceCount} faces
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Identity match meter */}
        {photoAvailable && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-blue-600" />
                Identity similarity (tone-based)
              </span>
              <span className="font-bold">
                {identityConfidence !== null ? `${identityConfidence}%` : '—'}
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  identityConfidence === null
                    ? 'w-1/10 bg-slate-400'
                    : identityConfidence >= 40
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${identityConfidence !== null ? Math.max(10, identityConfidence) : 10}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {photoAnalyzable
                ? identityConfidence !== null
                  ? identityConfidence >= 40
                    ? 'Match looks good — you may verify automatically.'
                    : 'Low similarity — verify manually using the option below.'
                                  : 'Could not compute similarity from this photo.'
                : 'This photo could not be compared automatically (permissions/CORS). Verify manually.'}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!stream && !error && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Requesting camera access… Please allow camera permissions.</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>

          {canProceedManually && (
            <button
              onClick={handleConfirmAndVerify}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              I Am In Front — Verify
            </button>
          )}

          <button
            onClick={handleVerify}
            disabled={!stream || isVerifying || verified || faceCount > 1}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : verified ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Verify Identity
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
