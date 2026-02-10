import { useRef, useEffect, useState, useCallback } from 'react';

interface WebRTCConfig {
  iceServers: RTCIceServer[];
  constraints: MediaStreamConstraints;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
  error: string | null;
  startConnection: () => Promise<void>;
  endConnection: () => void;
  sendData: (data: any) => void;
}

const defaultConfig: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  constraints: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
};

export function useWebRTC(config: Partial<WebRTCConfig> = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const finalConfig = { ...defaultConfig, ...config };

  // Update ref when localStream changes
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: finalConfig.iceServers,
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send candidate to remote peer via signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected');
      
      if (pc.connectionState === 'failed') {
        setError('Connection failed');
      }
    };

    // Create data channel for sending metadata
    const dataChannel = pc.createDataChannel('metadata', {
      ordered: true,
    });

    dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    dataChannel.onmessage = (event) => {
      console.log('Received data:', event.data);
    };

    dataChannelRef.current = dataChannel;
    peerConnectionRef.current = pc;

    return pc;
  }, [finalConfig.iceServers]);

  const startConnection = useCallback(async () => {
    try {
      setError(null);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(finalConfig.constraints);
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection();

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to remote peer via signaling server
      console.log('Created offer:', offer);

    } catch (err: any) {
      setError(err.message || 'Failed to start connection');
      console.error('WebRTC error:', err);
    }
  }, [finalConfig.constraints, createPeerConnection]);

  const endConnection = useCallback(() => {
    // Stop local stream using ref to avoid dependency
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
    setError(null);
  }, []); // Remove localStream dependency to prevent unnecessary re-renders

  const sendData = useCallback((data: any) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(data));
    }
  }, []);

  // Handle answer from remote peer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(answer);
    }
  }, []);

  // Handle ICE candidate from remote peer
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(candidate);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endConnection();
    };
  }, [endConnection]);

  return {
    localStream,
    remoteStream,
    peerConnection: peerConnectionRef.current,
    isConnected,
    error,
    startConnection,
    endConnection,
    sendData,
    handleAnswer,
    handleIceCandidate,
  };
}