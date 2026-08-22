import { useEffect, useRef, useState } from 'react';
import {
  createRecorder,
  getSupportedMimeType
} from '../utils/mediaRecorder';

const RecordingControls = ({
  onRecordingComplete
}) => {
  const [recording, setRecording] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [permissionError, setPermissionError] = useState('');

  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      setPermissionError('');

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: videoEnabled
        });

      streamRef.current = stream;

      const recorder = createRecorder(
        stream,
        null,
        (blob) => {
          if (onRecordingComplete) {
            onRecordingComplete({
              blob,
              type:
                recorder.mimeType ||
                getSupportedMimeType(),
              video: videoEnabled
            });
          }
        }
      );

      recorderRef.current = recorder;

      recorder.start(1000);

      setRecording(true);
    } catch (error) {
      console.error(
        'Recording permission error:',
        error
      );

      setPermissionError(
        videoEnabled
          ? 'Camera and microphone permission is required.'
          : 'Microphone permission is required.'
      );
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      try {
        recorderRef.current.stop();
      } catch {}
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });
    }

    recorderRef.current = null;
    streamRef.current = null;

    setRecording(false);
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        try {
          recorderRef.current.stop();
        } catch {}
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem'
      }}
    >
      {!recording && (
        <>
          <button
            type="button"
            onClick={() =>
              setVideoEnabled(
                (value) => !value
              )
            }
            style={{
              padding: '0.7rem 1.1rem',
              borderRadius: '999px',
              border:
                '1px solid rgba(255,255,255,0.12)',
              background: videoEnabled
                ? 'rgba(168,85,247,0.18)'
                : 'rgba(255,255,255,0.04)',
              color: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            {videoEnabled
              ? 'Video On'
              : 'Audio Only'}
          </button>

          <button
            type="button"
            onClick={startRecording}
            style={{
              padding: '0.7rem 1.25rem',
              borderRadius: '999px',
              border:
                '1px solid rgba(239,68,68,0.35)',
              background:
                'rgba(239,68,68,0.12)',
              color: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Start Recording
          </button>
        </>
      )}

      {recording && (
        <button
          type="button"
          onClick={stopRecording}
          style={{
            padding: '0.7rem 1.35rem',
            borderRadius: '999px',
            border:
              '1px solid rgba(239,68,68,0.45)',
            background:
              'rgba(239,68,68,0.18)',
            color: '#fca5a5',
            cursor: 'pointer',
            fontWeight: 800
          }}
        >
          Stop Recording
        </button>
      )}

      {permissionError && (
        <div
          style={{
            position: 'absolute',
            bottom: '5rem',
            color: '#fca5a5',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}
        >
          {permissionError}
        </div>
      )}
    </div>
  );
};

export default RecordingControls;