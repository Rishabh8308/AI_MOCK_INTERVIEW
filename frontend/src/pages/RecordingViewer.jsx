import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const RecordingViewer = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const [recording, setRecording] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const requestedType = searchParams.get('recording');
  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    let cancelled = false;

    const loadRecording = async () => {
      try {
        setLoading(true);
        setError('');

        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();

        if (!session) {
          window.location.href = '/auth';
          return;
        }

        const response = await fetch(
          `${apiUrl}/api/recording/${id}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to load recording'
          );
        }

        if (!data.success) {
          throw new Error(
            data.error || 'Recording could not be loaded'
          );
        }

        if (!data.chunks || !data.chunks.length) {
          throw new Error(
            'No recording chunks were found.'
          );
        }

        if (!cancelled) {
          setRecording(data);
        }
      } catch (err) {
        console.error(
          'Failed to load recording:',
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load recording.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRecording();

    return () => {
      cancelled = true;
    };
  }, [id, apiUrl]);

  useEffect(() => {
    if (!recording?.chunks?.length) {
      return;
    }

    let cancelled = false;
    let objectUrl = null;

    const buildRecording = async () => {
      try {
        setBuilding(true);
        setError('');
        setProgress(0);

        const mimeType =
          recording.mimeType ||
          'video/webm';

        const chunks = [...recording.chunks].sort(
          (a, b) => a.index - b.index
        );

        const buffers = new Array(
          chunks.length
        );

        let completed = 0;

        await Promise.all(
          chunks.map(
            async (chunk, index) => {
              const response = await fetch(
                chunk.url
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to download recording chunk ${chunk.index + 1}`
                );
              }

              const buffer =
                await response.arrayBuffer();

              if (cancelled) {
                return;
              }

              buffers[index] = buffer;

              completed += 1;

              setProgress(
                Math.round(
                  (completed /
                    chunks.length) *
                    100
                )
              );
            }
          )
        );

        if (cancelled) {
          return;
        }

        const blob = new Blob(
          buffers,
          {
            type: mimeType
          }
        );

        objectUrl =
          URL.createObjectURL(blob);

        setMediaUrl(objectUrl);
      } catch (err) {
        console.error(
          'Failed to build recording:',
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              'Unable to prepare the recording for playback.'
          );
        }
      } finally {
        if (!cancelled) {
          setBuilding(false);
        }
      }
    };

    buildRecording();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [recording]);

  const isVideo =
    recording?.recordingMode === 'video' ||
    recording?.mimeType?.startsWith('video/');

  const isAudio = !isVideo;

  const displayType =
    requestedType === 'video' && isVideo
      ? 'Video Recording'
      : requestedType === 'audio' && isAudio
      ? 'Audio Recording'
      : isVideo
      ? 'Video Recording'
      : 'Audio Recording';

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          className="spinner"
          style={{
            width: '50px',
            height: '50px'
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem 5%',
        paddingTop: '7rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            marginBottom: '2rem'
          }}
        >
          <Link
            to="/dashboard/history"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to History
          </Link>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '2rem'
          }}
        >
          <div
            style={{
              marginBottom: '1.5rem'
            }}
          >
            <div
              style={{
                color: '#a855f7',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                marginBottom: '0.5rem'
              }}
            >
              INTERVIEW RECORDING
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: '2rem'
              }}
            >
              {displayType}
            </h1>

            <p
              style={{
                marginTop: '0.5rem',
                color: 'var(--text-muted)'
              }}
            >
              {recording?.totalChunks || 0}{' '}
              recording chunk
              {recording?.totalChunks === 1
                ? ''
                : 's'}
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '1.2rem',
                borderRadius: '12px',
                background:
                  'rgba(239,68,68,0.08)',
                border:
                  '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5'
              }}
            >
              {error}
            </div>
          )}

          {!error && building && (
            <div
              style={{
                minHeight: '350px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div
                className="spinner"
                style={{
                  width: '45px',
                  height: '45px'
                }}
              />

              <div
                style={{
                  color: 'var(--text-muted)'
                }}
              >
                Preparing your recording...
              </div>

              <div
                style={{
                  width: '280px',
                  height: '6px',
                  borderRadius: '999px',
                  background:
                    'rgba(255,255,255,0.08)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: '#a855f7',
                    transition:
                      'width 0.2s ease'
                  }}
                />
              </div>

              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                Downloading {progress}%
              </div>
            </div>
          )}

          {!error &&
            !building &&
            mediaUrl &&
            isVideo && (
              <div
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#000',
                  border:
                    '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  style={{
                    width: '100%',
                    maxHeight: '650px',
                    display: 'block',
                    background: '#000'
                  }}
                  onError={() => {
                    setError(
                      'The video could not be played. The recording chunks may be corrupted or incompatible with this browser.'
                    );
                  }}
                />
              </div>
            )}

          {!error &&
            !building &&
            mediaUrl &&
            isAudio && (
              <div
                style={{
                  minHeight: '280px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  borderRadius: '16px',
                  background:
                    'rgba(255,255,255,0.025)',
                  border:
                    '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '700px'
                  }}
                >
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      margin:
                        '0 auto 1.5rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        'rgba(168,85,247,0.1)',
                      border:
                        '1px solid rgba(168,85,247,0.25)',
                      color: '#c4b5fd'
                    }}
                  >
                    <svg
                      width="38"
                      height="38"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect
                        x="7"
                        y="3"
                        width="10"
                        height="13"
                        rx="5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M4 11C4 15.42 7.58 19 12 19C16.42 19 20 15.42 20 11"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 19V22"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <audio
                    ref={audioRef}
                    src={mediaUrl}
                    controls
                    preload="metadata"
                    style={{
                      width: '100%'
                    }}
                    onError={() => {
                      setError(
                        'The audio could not be played. The recording chunks may be corrupted or incompatible with this browser.'
                      );
                    }}
                  />
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RecordingViewer;