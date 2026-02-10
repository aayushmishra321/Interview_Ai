import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../Card';

interface VideoRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onVideoData?: (data: Blob) => void;
  onAudioData?: (data: Blob) => void;
  className?: string;
}

export function VideoRecorder({
  isRecording,
  onStartRecording,
  onStopRecording,
  onVideoData,
  onAudioData,
  className,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [hasVideo, setHasVideo] = useState(true);
  const [hasAudio, setHasAudio] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeMedia();
    return () => {
      cleanup();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Media devices not supported in this browser');
        setIsInitialized(true);
        setError('Camera not available');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        videoRef.current.play().catch(err => {
          console.warn('Video autoplay failed:', err);
        });
      }

      setIsInitialized(true);
      setError(null);
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      
      // Set error message based on error type
      let errorMessage = 'Camera not available';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and refresh.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      setIsInitialized(true);
      setError(errorMessage);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onVideoData?.(blob);
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      onStartRecording();
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    onStopRecording();
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setHasVideo(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setHasAudio(audioTrack.enabled);
      }
    }
  };

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-3">
            <CameraOff className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Camera Unavailable</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button 
            onClick={initializeMedia} 
            variant="outline"
            size="sm"
          >
            Retry Camera Access
          </Button>
        </div>
        <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <CameraOff className="w-16 h-16 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Interview will continue without video</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              REC
            </div>
          )}

          {/* Status indicators */}
          <div className="absolute top-4 right-4 flex gap-2">
            {!hasVideo && (
              <div className="p-2 bg-red-500 text-white rounded-full">
                <CameraOff className="w-4 h-4" />
              </div>
            )}
            {!hasAudio && (
              <div className="p-2 bg-red-500 text-white rounded-full">
                <MicOff className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
            <Button
              variant={hasVideo ? "outline" : "destructive"}
              size="sm"
              onClick={toggleVideo}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              {hasVideo ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            </Button>

            <Button
              variant={hasAudio ? "outline" : "destructive"}
              size="sm"
              onClick={toggleAudio}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              {hasAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Recording controls */}
        <div className="p-4 bg-gray-50 flex justify-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={!isInitialized}
              variant="primary"
              className="px-8"
            >
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="px-8"
            >
              Stop Recording
            </Button>
          )}
        </div>
      </Card>

      {/* Technical info */}
      {isInitialized && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Video: {hasVideo ? 'On' : 'Off'} | Audio: {hasAudio ? 'On' : 'Off'}
          {isRecording && ' | Recording...'}
        </div>
      )}
    </div>
  );
}