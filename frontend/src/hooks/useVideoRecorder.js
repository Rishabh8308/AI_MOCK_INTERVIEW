import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useVideoRecorder = () => {
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);

  const getAuthToken = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert('Your session has expired. Please sign in again.');
      return null;
    }

    return session.access_token;
  };

  const startRecording = useCallback(async (stream) => {
    if (!stream) return;

    try {
      recordedChunksRef.current = [];

      const options = { mimeType: 'video/webm;codecs=vp9,opus' };

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
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        });
        setVideoBlob(blob);
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      console.log('Recording started with mimeType:', mimeType);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped');
    }
  }, [isRecording]);

  const uploadRecording = useCallback(async (sessionId) => {
    const blob = new Blob(recordedChunksRef.current, {
      type: 'video/webm'
    });

    if (!blob || blob.size === 0) return null;

    const token = await getAuthToken();

    if (!token) return null;

    const formData = new FormData();
    formData.append('video', blob, 'interview_recording.webm');
    formData.append('sessionId', sessionId);

    try {
      const response = await fetch('/api/recording/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      return await response.json();
    } catch (err) {
      console.error('Upload failed:', err);
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