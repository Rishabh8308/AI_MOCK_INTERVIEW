import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to handle browser-based video/audio recording using MediaRecorder API.
 */
export const useVideoRecorder = () => {
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);

  const startRecording = useCallback(async (stream) => {
    if (!stream) return;
    
    try {
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      // Fallback if vp9 isn't supported
      const mimeType = MediaRecorder.isTypeSupported(options.mimeType) 
        ? options.mimeType 
        : 'video/webm';

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
      };

      mediaRecorderRef.current.start(1000); // Capture in 1s chunks
      setIsRecording(true);
      console.log("Recording started with mimeType:", mimeType);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("Recording stopped");
    }
  }, [isRecording]);

  const uploadRecording = useCallback(async (sessionId) => {
    // We use the ref directly because state might not have updated yet in a fast 'stop then upload' cycle
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    if (!blob || blob.size === 0) return null;

    const formData = new FormData();
    formData.append('video', blob, 'interview_recording.webm');
    formData.append('sessionId', sessionId);

    try {
      const response = await fetch('/api/recording/upload', {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (err) {
      console.error("Upload failed:", err);
      throw err;
    }
  }, []);

  return { 
    startRecording, 
    stopRecording, 
    isRecording, 
    videoBlob,
    uploadRecording 
  };
};
