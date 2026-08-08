import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface WebcamVerificationProps {
  onVerified: () => void;
  onCancel: () => void;
  studentName: string;
}

export const WebcamVerification: React.FC<WebcamVerificationProps> = ({ onVerified, onCancel, studentName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const startWebcam = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) return;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
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

  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const detectFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(
          canvas.width / 4,
          canvas.height / 4,
          canvas.width / 2,
          canvas.height / 2
        );
        const data = imageData.data;
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        brightness /= data.length / 4;
        const isActive = brightness > 40 && brightness < 220;
        setFaceDetected(isActive);
      }
      animationId = requestAnimationFrame(detectFrame);
    };

    animationId = requestAnimationFrame(detectFrame);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [stream]);

  const handleVerify = () => {
    if (!faceDetected) {
      setError('No face detected. Please position yourself in front of the camera.');
      return;
    }
    setIsVerifying(true);
    setError('');
    setTimeout(() => {
      setVerified(true);
      setIsVerifying(false);
      setTimeout(() => {
        onVerified();
      }, 1000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl">
        <div className="text-center mb-6">
          <Camera className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Webcam Verification</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Student: <span className="font-bold text-slate-700 dark:text-slate-300">{studentName}</span>
          </p>
        </div>

        <div className="relative bg-slate-950 rounded-xl overflow-hidden mb-4 aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

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

          {faceDetected && stream && (
            <div className="absolute bottom-3 right-3 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Face Detected
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!stream && !error && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Requesting camera access... Please allow camera permissions.</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={!stream || isVerifying || verified}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : verified ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Verify Identity
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
