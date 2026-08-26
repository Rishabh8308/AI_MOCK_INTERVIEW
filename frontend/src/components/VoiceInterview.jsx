import { useEffect, useRef, useState } from 'react';

const VoiceInterview = ({
  sessionId,
  initialMessage,
  recordingMode = 'audio',
  onEndInterview
}) => {
  const API_URL =
    import.meta.env.VITE_API_URL || '';

  const [status, setStatus] =
    useState('idle');

  const [aiSpeaking, setAiSpeaking] =
    useState(false);

  const [error, setError] =
    useState('');

  const [questionCount, setQuestionCount] =
    useState(1);

  const [audioLevel, setAudioLevel] =
    useState(0);

  /*
   * =========================================================
   * CHEAT WARNING
   * =========================================================
   */

  const [cheatWarning, setCheatWarning] =
    useState(false);

  const mountedRef =
    useRef(true);

  const statusRef =
    useRef('idle');

  const audioLevelRef =
    useRef(0);

  /*
   * =========================================================
   * CHEAT / TAB / WINDOW SWITCH DETECTION
   * =========================================================
   *
   * Detects:
   *
   * 1. Switching Chrome tabs
   * 2. Switching to another application
   * 3. Alt + Tab
   * 4. Clicking another application/window
   * 5. Minimizing the browser
   *
   * FIRST VIOLATION:
   *   Candidate leaves the interview.
   *   When they return, warning appears.
   *
   * SECOND VIOLATION:
   *   Candidate leaves again.
   *   When they return, interview ends.
   *
   * IMPORTANT:
   * blur + visibilitychange from the same
   * action are treated as ONE violation.
   */

  const visibilityViolationCountRef =
    useRef(0);

  const wasPageHiddenRef =
    useRef(false);

  const cheatWarningPendingRef =
    useRef(false);

  const endingInterviewRef =
    useRef(false);

  const handleEndInterviewRef =
    useRef(null);

  /*
   * =========================================================
   * SPEECH RECOGNITION
   * =========================================================
   */

  const recognitionRef =
    useRef(null);

  const isListeningRef =
    useRef(false);

  /*
   * =========================================================
   * AUDIO VISUALIZER
   * =========================================================
   */

  const audioContextRef =
    useRef(null);

  const analyserRef =
    useRef(null);

  const microphoneStreamRef =
    useRef(null);

  const audioAnimationRef =
    useRef(null);

  /*
   * =========================================================
   * MIXED RECORDING AUDIO
   * =========================================================
   */

  const recordingAudioContextRef =
    useRef(null);

  const recordingDestinationRef =
    useRef(null);

  const microphoneSourceRef =
    useRef(null);

  /*
   * =========================================================
   * RECORDING
   * =========================================================
   */

  const recordingSessionRef =
    useRef(null);

  const recordingUploadRef =
    useRef(null);

  const videoRef =
    useRef(null);

  /*
   * =========================================================
   * PARTICLE VISUALIZER
   * =========================================================
   */

  const canvasRef =
    useRef(null);

  const animationRef =
    useRef(null);

  /*
   * =========================================================
   * AI AUDIO PLAYBACK
   * =========================================================
   */

  const playbackContextRef =
    useRef(null);

  const playbackNextTimeRef =
    useRef(0);

  const playbackSourcesRef =
    useRef([]);

  const streamFinishedRef =
    useRef(false);

  const lastScheduledSourceRef =
    useRef(null);

  /*
   * =========================================================
   * TRANSCRIPT
   * =========================================================
   */

  const transcriptRef =
    useRef([]);

  const conversationStartedRef =
    useRef(false);

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  const updateStatus = (value) => {
    statusRef.current = value;
    setStatus(value);
  };

  const updateAudioLevel = (value) => {
    audioLevelRef.current = value;
    setAudioLevel(value);
  };

  /*
   * =========================================================
   * AI AUDIO CONTEXT
   * =========================================================
   */

  const getAudioContext = async () => {
    if (!playbackContextRef.current) {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        throw new Error(
          'Web Audio API is not supported in this browser.'
        );
      }

      playbackContextRef.current =
        new AudioContext();
    }

    const context =
      playbackContextRef.current;

    if (context.state === 'suspended') {
      await context.resume();
    }

    return context;
  };

  /*
   * =========================================================
   * BASE64 → BYTES
   * =========================================================
   */

  const base64ToBytes = (base64) => {
    const binaryString =
      window.atob(base64);

    const bytes =
      new Uint8Array(
        binaryString.length
      );

    for (
      let i = 0;
      i < binaryString.length;
      i++
    ) {
      bytes[i] =
        binaryString.charCodeAt(i);
    }

    return bytes;
  };

  /*
   * =========================================================
   * PLAY PCM AUDIO
   * =========================================================
   */

  const playPcmChunk = async (
    base64Audio
  ) => {
    const context =
      await getAudioContext();

    const bytes =
      base64ToBytes(base64Audio);

    if (!bytes.length) {
      return;
    }

    const sampleCount =
      Math.floor(
        bytes.length / 2
      );

    const audioBuffer =
      context.createBuffer(
        1,
        sampleCount,
        24000
      );

    const channelData =
      audioBuffer.getChannelData(0);

    const dataView =
      new DataView(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength
      );

    for (
      let i = 0;
      i < sampleCount;
      i++
    ) {
      const sample =
        dataView.getInt16(
          i * 2,
          true
        );

      channelData[i] =
        sample / 32768;
    }

    const source =
      context.createBufferSource();

    source.buffer =
      audioBuffer;

    const gainNode =
      context.createGain();

    gainNode.gain.value = 1;

    source.connect(gainNode);

    gainNode.connect(
      context.destination
    );

    if (
      recordingDestinationRef.current
    ) {
      try {
        gainNode.connect(
          recordingDestinationRef.current
        );

        console.log(
          '🎧 AI voice connected to recording mixer'
        );
      } catch (err) {
        console.error(
          '❌ Failed to connect AI voice to recording mixer:',
          err
        );
      }
    }

    const now =
      context.currentTime;

    if (
      playbackNextTimeRef.current <
      now + 0.03
    ) {
      playbackNextTimeRef.current =
        now + 0.03;
    }

    const startTime =
      playbackNextTimeRef.current;

    const endTime =
      startTime +
      audioBuffer.duration;

    playbackNextTimeRef.current =
      endTime;

    source.onended = () => {
      playbackSourcesRef.current =
        playbackSourcesRef.current.filter(
          (item) => item !== source
        );

      if (
        source ===
          lastScheduledSourceRef.current &&
        streamFinishedRef.current
      ) {
        finishAISpeaking();
      }
    };

    playbackSourcesRef.current.push(
      source
    );

    lastScheduledSourceRef.current =
      source;

    source.start(startTime);
  };

  /*
   * =========================================================
   * FINISH AI SPEAKING
   * =========================================================
   */

  const finishAISpeaking = () => {
    if (!mountedRef.current) {
      return;
    }

    setAiSpeaking(false);

    updateStatus('listening');

    startListening();
  };

  /*
   * =========================================================
   * STOP AI PLAYBACK
   * =========================================================
   */

  const stopAIPlayback = () => {
    playbackSourcesRef.current.forEach(
      (source) => {
        try {
          source.onended = null;
          source.stop();
        } catch {}
      }
    );

    playbackSourcesRef.current =
      [];

    lastScheduledSourceRef.current =
      null;

    streamFinishedRef.current =
      false;

    if (playbackContextRef.current) {
      playbackNextTimeRef.current =
        playbackContextRef.current.currentTime;
    } else {
      playbackNextTimeRef.current = 0;
    }

    setAiSpeaking(false);
  };

  /*
   * =========================================================
   * AI TEXT TO SPEECH
   * =========================================================
   */

  const speakAI = async (text) => {
    if (!text) {
      return;
    }

    stopAIPlayback();

    setAiSpeaking(true);

    updateStatus('speaking');

    setError('');

    streamFinishedRef.current =
      false;

    try {
      const context =
        await getAudioContext();

      if (context.state === 'suspended') {
        await context.resume();
      }

      const response =
        await fetch(
          `${API_URL}/api/tts`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              text: text.trim()
            })
          }
        );

      if (!response.ok) {
        let message =
          'Failed to generate AI voice.';

        try {
          const data =
            await response.json();

          if (data.error) {
            message =
              data.error;
          }
        } catch {}

        throw new Error(message);
      }

      if (!response.body) {
        throw new Error(
          'The TTS server did not return a readable audio stream.'
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let buffer = '';

      while (true) {
        const {
          value,
          done
        } = await reader.read();

        if (done) {
          break;
        }

        buffer +=
          decoder.decode(
            value,
            {
              stream: true
            }
          );

        const events =
          buffer.split('\n\n');

        buffer =
          events.pop() || '';

        for (
          const event of events
        ) {
          const lines =
            event.split('\n');

          for (
            const line of lines
          ) {
            if (
              !line.startsWith(
                'data: '
              )
            ) {
              continue;
            }

            const payload =
              line.slice(6).trim();

            if (!payload) {
              continue;
            }

            let data;

            try {
              data =
                JSON.parse(payload);
            } catch {
              continue;
            }

            if (data.error) {
              throw new Error(
                data.error
              );
            }

            if (data.done) {
              continue;
            }

            if (data.audio) {
              await playPcmChunk(
                data.audio
              );
            }
          }
        }
      }

      if (buffer.trim()) {
        const lines =
          buffer.split('\n');

        for (
          const line of lines
        ) {
          if (
            !line.startsWith(
              'data: '
            )
          ) {
            continue;
          }

          const payload =
            line.slice(6).trim();

          if (!payload) {
            continue;
          }

          try {
            const data =
              JSON.parse(payload);

            if (
              data.audio &&
              !data.done
            ) {
              await playPcmChunk(
                data.audio
              );
            }
          } catch {}
        }
      }

      streamFinishedRef.current =
        true;

      if (
        !lastScheduledSourceRef.current
      ) {
        finishAISpeaking();
      }
    } catch (err) {
      console.error(
        'Gemini TTS error:',
        err
      );

      if (!mountedRef.current) {
        return;
      }

      setAiSpeaking(false);

      updateStatus('error');

      setError(
        err.message ||
          'Unable to generate AI voice.'
      );
    }
  };

  /*
   * =========================================================
   * START RECORDING
   * =========================================================
   */

  const startRecording = async () => {
    console.log(
      '🎙️ START RECORDING CALLED'
    );

    const existingSession =
      recordingSessionRef.current;

    if (
      existingSession?.recorder &&
      existingSession.recorder.state !==
        'inactive'
    ) {
      console.log(
        '⚠️ Recording already active.'
      );

      return;
    }

    let stream = null;

    let cameraStream = null;

    let screenStream = null;

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'Media devices are not supported by this browser.'
        );
      }

      if (
        typeof MediaRecorder ===
        'undefined'
      ) {
        throw new Error(
          'MediaRecorder is not supported by this browser.'
        );
      }

      /*
       * =========================================================
       * GET RECORDING MEDIA
       * =========================================================
       *
       * AUDIO MODE:
       *   Microphone only
       *
       * VIDEO MODE:
       *   Screen → recorded video
       *   Camera → UI preview
       *   Microphone → mixed audio
       */

      if (recordingMode === 'video') {
        console.log(
          '🖥️ Requesting screen capture...'
        );

        screenStream =
          await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'always'
            },
            audio: false
          });

        const screenVideoTrack =
          screenStream.getVideoTracks()[0];

        if (screenVideoTrack) {
          screenVideoTrack.onended = () => {
            console.log(
              '🖥️ User stopped screen sharing'
            );

            if (
              mountedRef.current &&
              statusRef.current !==
                'uploading'
            ) {
              setError(
                'Screen sharing was stopped. Please end the interview.'
              );
            }
          };
        }

        console.log(
          '✅ Screen stream obtained:',
          screenStream
        );

        /*
         * Camera is ONLY for the live UI preview.
         */
        cameraStream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: {
                ideal: 1280
              },
              height: {
                ideal: 720
              },
              facingMode: 'user'
            },
            audio: true
          });

        console.log(
          '✅ Camera stream obtained for preview:',
          cameraStream
        );

        if (videoRef.current) {
          videoRef.current.srcObject =
            cameraStream;

          try {
            await videoRef.current.play();
          } catch {}
        }

        /*
         * Camera stream contains the microphone.
         */
        stream = cameraStream;
      } else {
        /*
         * AUDIO MODE
         */
        stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true
          });
      }

      console.log(
        '🎙️ Recording source stream:',
        stream
      );

      if (!stream) {
        throw new Error(
          'Unable to obtain media stream.'
        );
      }

      const audioTracks =
        stream.getAudioTracks();

      const videoTracks =
        recordingMode === 'video'
          ? screenStream.getVideoTracks()
          : [];

      console.log(
        '🎙️ Media tracks:',
        {
          audioTracks:
            audioTracks.length,
          videoTracks:
            videoTracks.length
        }
      );

      if (
        audioTracks.length === 0
      ) {
        throw new Error(
          'Microphone audio track was not obtained.'
        );
      }

      if (
        recordingMode === 'video' &&
        videoTracks.length === 0
      ) {
        throw new Error(
          'Screen video track was not obtained.'
        );
      }

      /*
       * =========================================================
       * CREATE MIXER USING THE SAME AUDIO CONTEXT AS AI TTS
       * =========================================================
       */

      const playbackContext =
        await getAudioContext();

      const recordingDestination =
        playbackContext.createMediaStreamDestination();

      const microphoneSource =
        playbackContext.createMediaStreamSource(
          stream
        );

      microphoneSource.connect(
        recordingDestination
      );

      recordingAudioContextRef.current =
        playbackContext;

      recordingDestinationRef.current =
        recordingDestination;

      microphoneSourceRef.current =
        microphoneSource;

      console.log(
        '🎚️ Recording audio mixer created'
      );

      const mimeTypes =
        recordingMode === 'video'
          ? [
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm'
            ]
          : [
              'audio/webm;codecs=opus',
              'audio/webm'
            ];

      let selectedMimeType =
        '';

      for (
        const type of mimeTypes
      ) {
        try {
          if (
            MediaRecorder.isTypeSupported(
              type
            )
          ) {
            selectedMimeType =
              type;

            break;
          }
        } catch {}
      }

      console.log(
        '🎙️ Selected MIME:',
        selectedMimeType ||
          'browser default'
      );

      /*
       * =========================================================
       * BUILD RECORDING STREAM
       * =========================================================
       */

      const recordingStream =
        new MediaStream();

      /*
       * Add SCREEN video tracks.
       */
      videoTracks.forEach(
        (track) => {
          recordingStream.addTrack(
            track
          );
        }
      );

      /*
       * Add mixed audio track.
       *
       * Contains:
       * - microphone
       * - AI TTS
       */

      const mixedAudioTrack =
        recordingDestination
          .stream
          .getAudioTracks()[0];

      if (!mixedAudioTrack) {
        throw new Error(
          'Mixed audio track was not created.'
        );
      }

      recordingStream.addTrack(
        mixedAudioTrack
      );

      console.log(
        '🎚️ Recording stream created:',
        {
          audioTracks:
            recordingStream
              .getAudioTracks()
              .length,
          videoTracks:
            recordingStream
              .getVideoTracks()
              .length
        }
      );

      const recorder =
        selectedMimeType
          ? new MediaRecorder(
              recordingStream,
              {
                mimeType:
                  selectedMimeType
              }
            )
          : new MediaRecorder(
              recordingStream
            );

      console.log(
        '✅ RECORDING CREATED:',
        {
          state:
            recorder.state,
          mimeType:
            recorder.mimeType
        }
      );

      const session = {
        recorder,

        stream:
          recordingStream,

        sourceStream:
          stream,

        screenStream,

        cameraStream,

        chunks: [],

        mimeType:
          recorder.mimeType ||
          selectedMimeType ||
          (
            recordingMode === 'video'
              ? 'video/webm'
              : 'audio/webm'
          ),

        stopped: false,

        resolve: null,

        reject: null,

        stopPromise: null
      };

      recordingSessionRef.current =
        session;

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            session.chunks.push(
              event.data
            );

            console.log(
              '🎙️ Recording chunk:',
              event.data.size
            );
          }
        };

      recorder.onerror =
        (event) => {
          console.error(
            '❌ MediaRecorder error:',
            event
          );

          if (session.reject) {
            session.reject(
              new Error(
                'MediaRecorder encountered an error.'
              )
            );

            session.resolve = null;
            session.reject = null;
          }

          if (mountedRef.current) {
            setError(
              'Recording error occurred.'
            );
          }
        };

      recorder.onstop = () => {
        console.log(
          '🛑 MediaRecorder ONSTOP fired.'
        );

        session.stopped =
          true;

        const blob =
          new Blob(
            session.chunks,
            {
              type:
                session.mimeType
            }
          );

        console.log(
          '✅ RECORDING BLOB CREATED:',
          {
            size:
              blob.size,
            type:
              blob.type,
            chunks:
              session.chunks.length
          }
        );

        if (session.resolve) {
          session.resolve(
            blob
          );

          session.resolve =
            null;

          session.reject =
            null;
        }
      };

      recorder.start(1000);

      console.log(
        '✅ RECORDING STARTED:',
        {
          state:
            recorder.state,
          mimeType:
            recorder.mimeType
        }
      );
    } catch (err) {
      console.error(
        '❌ Recording start error:',
        err
      );

      if (screenStream) {
        screenStream
          .getTracks()
          .forEach(
            (track) => {
              try {
                track.stop();
              } catch {}
            }
          );
      }

      if (cameraStream) {
        cameraStream
          .getTracks()
          .forEach(
            (track) => {
              try {
                track.stop();
              } catch {}
            }
          );
      }

      if (stream) {
        stream
          .getTracks()
          .forEach(
            (track) => {
              try {
                track.stop();
              } catch {}
            }
          );
      }

      if (
        microphoneSourceRef.current
      ) {
        try {
          microphoneSourceRef.current.disconnect();
        } catch {}

        microphoneSourceRef.current =
          null;
      }

      recordingDestinationRef.current =
        null;

      recordingAudioContextRef.current =
        null;

      recordingSessionRef.current =
        null;

      if (videoRef.current) {
        videoRef.current.srcObject =
          null;
      }

      if (
        err.name ===
        'NotAllowedError'
      ) {
        setError(
          recordingMode === 'video'
            ? 'Camera, microphone, or screen-sharing permission was denied.'
            : 'Microphone permission was denied.'
        );
      } else if (
        err.name ===
        'NotFoundError'
      ) {
        setError(
          recordingMode === 'video'
            ? 'Camera or microphone was not found.'
            : 'Microphone was not found.'
        );
      } else {
        setError(
          err.message ||
            'Unable to start recording.'
        );
      }
    }
  };

  /*
   * =========================================================
   * STOP RECORDING
   * =========================================================
   */

  const stopRecording = async () => {
    const session =
      recordingSessionRef.current;

    console.log(
      '🛑 STOP RECORDING:',
      {
        sessionExists:
          !!session,
        recorder:
          session?.recorder,
        recorderState:
          session?.recorder?.state,
        chunks:
          session?.chunks?.length ||
          0
      }
    );

    if (!session) {
      console.warn(
        '⚠️ No recording session exists.'
      );

      return null;
    }

    const recorder =
      session.recorder;

    if (!recorder) {
      console.warn(
        '⚠️ Recording session has no recorder.'
      );

      return null;
    }

    if (
      recorder.state ===
      'inactive'
    ) {
      const blob =
        new Blob(
          session.chunks,
          {
            type:
              session.mimeType
          }
        );

      cleanupRecording(
        session
      );

      return blob.size > 0
        ? blob
        : null;
    }

    session.stopPromise =
      new Promise(
        (
          resolve,
          reject
        ) => {
          session.resolve =
            resolve;

          session.reject =
            reject;
        }
      );

    try {
      recorder.requestData();
    } catch {}

    try {
      recorder.stop();
    } catch (err) {
      session.resolve =
        null;

      session.reject =
        null;

      cleanupRecording(
        session
      );

      throw err;
    }

    const blob =
      await session.stopPromise;

    cleanupRecording(
      session
    );

    return blob &&
      blob.size > 0
      ? blob
      : null;
  };

  /*
   * =========================================================
   * CLEANUP RECORDING
   * =========================================================
   */

  const cleanupRecording = (
    session
  ) => {
    if (!session) {
      return;
    }

    console.log(
      '🧹 Cleaning up recording streams...'
    );

    if (session.screenStream) {
      session.screenStream
        .getTracks()
        .forEach((track) => {
          try {
            track.stop();
          } catch {}
        });

      console.log(
        '🖥️ Screen capture stopped'
      );
    }

    if (session.cameraStream) {
      session.cameraStream
        .getTracks()
        .forEach((track) => {
          try {
            track.stop();
          } catch {}
        });

      console.log(
        '🎥 Camera preview stopped'
      );
    }

    if (session.sourceStream) {
      session.sourceStream
        .getTracks()
        .forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
    }

    if (session.stream) {
      session.stream
        .getTracks()
        .forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
    }

    if (
      microphoneSourceRef.current
    ) {
      try {
        microphoneSourceRef.current.disconnect();
      } catch {}

      microphoneSourceRef.current =
        null;
    }

    recordingDestinationRef.current =
      null;

    recordingAudioContextRef.current =
      null;

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    if (
      recordingSessionRef.current ===
      session
    ) {
      recordingSessionRef.current =
        null;
    }

    console.log(
      '✅ Recording cleanup complete'
    );
  };

  /*
   * =========================================================
   * UPLOAD RECORDING
   * =========================================================
   */

  const uploadRecordingToSupabase =
    async (blob) => {
      if (!blob) {
        throw new Error(
          'No recording was created.'
        );
      }

      if (blob.size === 0) {
        throw new Error(
          'Recording is empty.'
        );
      }

      if (!sessionId) {
        throw new Error(
          'Session ID is missing.'
        );
      }

      const formData =
        new FormData();

      formData.append(
        'video',
        blob,
        `interview-${sessionId}.webm`
      );

      formData.append(
        'sessionId',
        sessionId
      );

      formData.append(
        'recordingMode',
        recordingMode
      );

      console.log(
        '☁️ Uploading recording:',
        {
          sessionId,
          size:
            blob.size,
          type:
            blob.type,
          recordingMode
        }
      );

      const response =
        await fetch(
          `${API_URL}/api/recording/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          'Backend returned an invalid response.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to upload recording.'
        );
      }

      console.log(
        '✅ Recording uploaded:',
        data
      );

      recordingUploadRef.current =
        data;

      return data;
    };

  /*
   * =========================================================
   * AUDIO VISUALIZER
   * =========================================================
   */

  const startAudioVisualizer =
    async () => {
      try {
        if (
          audioContextRef.current
        ) {
          return;
        }

        const recordingSession =
          recordingSessionRef.current;

        let stream =
          recordingSession?.stream;

        if (!stream) {
          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                audio: true
              }
            );

          microphoneStreamRef.current =
            stream;
        }

        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContext) {
          return;
        }

        const context =
          new AudioContext();

        const analyser =
          context.createAnalyser();

        analyser.fftSize =
          256;

        analyser.smoothingTimeConstant =
          0.85;

        const microphone =
          context.createMediaStreamSource(
            stream
          );

        microphone.connect(
          analyser
        );

        audioContextRef.current =
          context;

        analyserRef.current =
          analyser;

        const data =
          new Uint8Array(
            analyser.frequencyBinCount
          );

        const update = () => {
          if (
            !mountedRef.current ||
            !analyserRef.current
          ) {
            return;
          }

          analyserRef.current.getByteFrequencyData(
            data
          );

          let total = 0;

          for (
            let i = 0;
            i < data.length;
            i++
          ) {
            total += data[i];
          }

          const average =
            total /
            data.length;

          updateAudioLevel(
            Math.min(
              1,
              average / 55
            )
          );

          audioAnimationRef.current =
            requestAnimationFrame(
              update
            );
        };

        update();
      } catch (err) {
        console.warn(
          'Audio visualizer unavailable:',
          err
        );
      }
    };

  /*
   * =========================================================
   * STOP AUDIO VISUALIZER
   * =========================================================
   */

  const stopAudioVisualizer =
    () => {
      if (
        audioAnimationRef.current
      ) {
        cancelAnimationFrame(
          audioAnimationRef.current
        );
      }

      if (
        microphoneStreamRef.current
      ) {
        microphoneStreamRef.current
          .getTracks()
          .forEach(
            (track) => {
              try {
                track.stop();
              } catch {}
            }
          );
      }

      if (
        audioContextRef.current
      ) {
        audioContextRef.current
          .close()
          .catch(() => {});
      }

      audioAnimationRef.current =
        null;

      microphoneStreamRef.current =
        null;

      audioContextRef.current =
        null;

      analyserRef.current =
        null;

      updateAudioLevel(0);
    };

  /*
   * =========================================================
   * START LISTENING
   * =========================================================
   */

  const startListening = async () => {
    if (!SpeechRecognition) {
      setError(
        'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.'
      );

      updateStatus('error');

      return;
    }

    if (aiSpeaking) {
      return;
    }

    if (isListeningRef.current) {
      return;
    }

    try {
      await startAudioVisualizer();

      if (
        !recognitionRef.current
      ) {
        return;
      }

      recognitionRef.current.start();

      isListeningRef.current =
        true;

      updateStatus('listening');

      setError('');
    } catch (err) {
      console.warn(
        'Could not start speech recognition:',
        err.message
      );
    }
  };

  /*
   * =========================================================
   * STOP LISTENING
   * =========================================================
   */

  const stopListening = () => {
    if (
      !recognitionRef.current
    ) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch {}

    isListeningRef.current =
      false;
  };

  /*
   * =========================================================
   * SEND USER RESPONSE TO AI
   * =========================================================
   */

  const sendCandidateResponse =
    async (message) => {
      const cleaned =
        message.trim();

      if (!cleaned) {
        updateStatus('ready');
        return;
      }

      transcriptRef.current.push({
        sender: 'user',
        text: cleaned,
        timestamp:
          new Date().toISOString()
      });

      updateStatus('thinking');

      setError('');

      try {
        const response =
          await fetch(
            `${API_URL}/api/chat`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json'
              },
              body: JSON.stringify({
                sessionId,
                message: cleaned
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to communicate with the AI.'
          );
        }

        if (!data.reply) {
          throw new Error(
            'The AI returned an empty response.'
          );
        }

        transcriptRef.current.push({
          sender: 'ai',
          text: data.reply,
          timestamp:
            new Date().toISOString()
        });

        setQuestionCount(
          (previous) =>
            previous + 1
        );

        speakAI(data.reply);
      } catch (err) {
        console.error(
          'Voice interview error:',
          err
        );

        if (!mountedRef.current) {
          return;
        }

        setError(
          err.message ||
            'Unable to communicate with the AI.'
        );

        updateStatus('error');
      }
    };

  /*
   * =========================================================
   * SPEECH RECOGNITION SETUP
   * =========================================================
   */

  useEffect(() => {
    mountedRef.current =
      true;

    if (!SpeechRecognition) {
      setError(
        'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.'
      );

      updateStatus('error');

      return () => {
        mountedRef.current =
          false;
      };
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous =
      false;

    recognition.interimResults =
      false;

    recognition.lang =
      'en-US';

    recognition.maxAlternatives =
      1;

    recognition.onresult =
      (event) => {
        let finalText = '';

        for (
          let i =
            event.resultIndex;
          i <
          event.results.length;
          i++
        ) {
          if (
            event.results[i]
              .isFinal
          ) {
            finalText +=
              event.results[i][0]
                .transcript;
          }
        }

        if (
          finalText.trim()
        ) {
          sendCandidateResponse(
            finalText.trim()
          );
        }
      };

    recognition.onend = () => {
      isListeningRef.current =
        false;

      if (!mountedRef.current) {
        return;
      }

      const currentStatus =
        statusRef.current;

      if (
        currentStatus !==
          'thinking' &&
        currentStatus !==
          'speaking' &&
        currentStatus !==
          'uploading'
      ) {
        updateStatus('ready');
      }
    };

    recognition.onerror =
      (event) => {
        isListeningRef.current =
          false;

        if (!mountedRef.current) {
          return;
        }

        if (
          event.error ===
          'no-speech'
        ) {
          updateStatus('ready');

          setError(
            'No speech detected. Please try speaking again.'
          );

          return;
        }

        if (
          event.error ===
          'not-allowed'
        ) {
          updateStatus('error');

          setError(
            'Microphone permission was denied. Please allow microphone access.'
          );

          return;
        }

        updateStatus('error');

        setError(
          `Microphone error: ${event.error}`
        );
      };

    recognitionRef.current =
      recognition;

    return () => {
      mountedRef.current =
        false;

      try {
        recognition.stop();
      } catch {}

      isListeningRef.current =
        false;

      stopAIPlayback();

      stopAudioVisualizer();
    };
  }, []);

  /*
   * =========================================================
   * CHEAT / TAB / WINDOW SWITCH DETECTION
   * =========================================================
   *
   * Detects:
   *
   * 1. Switching Chrome tabs
   * 2. Switching to another application
   * 3. Alt + Tab
   * 4. Clicking another application/window
   * 5. Minimizing the browser
   *
   * FIRST VIOLATION:
   *   Candidate leaves the interview.
   *   When they return, warning appears.
   *
   * SECOND VIOLATION:
   *   Candidate leaves again.
   *   When they return, interview ends.
   *
   * IMPORTANT:
   * blur + visibilitychange from the same
   * action are treated as ONE violation.
   */

  useEffect(() => {
    /*
     * =======================================================
     * MARK INTERVIEW AS AWAY
     * =======================================================
     */

    const markPageAsAway = (source) => {
      /*
       * Ignore if the interview is already
       * intentionally ending.
       */
      if (
        endingInterviewRef.current
      ) {
        return;
      }

      /*
       * Do not monitor before the interview
       * has actually started.
       */
      if (
        !conversationStartedRef.current
      ) {
        return;
      }

      /*
       * Do not monitor while the recording
       * is already being uploaded.
       */
      if (
        statusRef.current ===
        'uploading'
      ) {
        return;
      }

      /*
       * blur + visibilitychange can both fire
       * for one app/tab switch.
       *
       * Only mark the first event as the
       * departure.
       */
      if (
        wasPageHiddenRef.current
      ) {
        return;
      }

      wasPageHiddenRef.current =
        true;

      console.log(
        `⚠️ Interview lost focus (${source}).`
      );
    };

    /*
     * =======================================================
     * PROCESS RETURN TO INTERVIEW
     * =======================================================
     */

    const processReturnToInterview = () => {
      if (
        endingInterviewRef.current
      ) {
        return;
      }

      if (
        !conversationStartedRef.current
      ) {
        return;
      }

      if (
        statusRef.current ===
        'uploading'
      ) {
        return;
      }

      /*
       * Candidate never actually left.
       */
      if (
        !wasPageHiddenRef.current
      ) {
        return;
      }

      /*
       * If the document is still hidden,
       * this is not a real return yet.
       */
      if (
        document.hidden
      ) {
        return;
      }

      /*
       * Candidate has returned.
       */
      wasPageHiddenRef.current =
        false;

      visibilityViolationCountRef.current +=
        1;

      const violationCount =
        visibilityViolationCountRef.current;

      console.log(
        '⚠️ Interview tab/window violation:',
        violationCount
      );

      /*
       * =====================================================
       * FIRST VIOLATION
       * =====================================================
       */

      if (
        violationCount === 1
      ) {
        console.log(
          '⚠️ First violation. Showing warning.'
        );

        cheatWarningPendingRef.current =
          true;

        if (mountedRef.current) {
          setCheatWarning(true);
        }

        return;
      }

      /*
       * =====================================================
       * SECOND VIOLATION
       * =====================================================
       */

      if (
        violationCount >= 2
      ) {
        console.log(
          '🛑 Second tab/window violation. Ending interview.'
        );

        cheatWarningPendingRef.current =
          false;

        if (mountedRef.current) {
          setCheatWarning(false);
        }

        /*
         * IMPORTANT:
         *
         * Do NOT set
         * endingInterviewRef.current
         * here.
         *
         * handleEndInterview() itself
         * sets that flag.
         */
        if (
          handleEndInterviewRef.current
        ) {
          handleEndInterviewRef.current();
        }
      }
    };

    /*
     * =======================================================
     * DOCUMENT VISIBILITY CHANGE
     * =======================================================
     *
     * Handles:
     *
     * - Chrome tab switching
     * - Browser becoming hidden
     * - Browser minimized in many cases
     */

    const handleVisibilityChange = () => {
      if (
        document.hidden
      ) {
        markPageAsAway(
          'visibilitychange'
        );

        return;
      }

      /*
       * Give the browser a moment to finish
       * updating focus/visibility state.
       */
      setTimeout(() => {
        processReturnToInterview();
      }, 100);
    };

    /*
     * =======================================================
     * WINDOW BLUR
     * =======================================================
     *
     * Handles:
     *
     * - Alt + Tab
     * - Clicking another application
     * - Switching to VS Code
     * - Switching to ChatGPT
     * - Clicking another browser window
     */

    const handleWindowBlur = () => {
      markPageAsAway(
        'window blur'
      );
    };

    /*
     * =======================================================
     * WINDOW FOCUS
     * =======================================================
     *
     * Candidate has returned to the
     * interview browser window.
     */

    const handleWindowFocus = () => {
      setTimeout(() => {
        processReturnToInterview();
      }, 100);
    };

    /*
     * =======================================================
     * ADD EVENT LISTENERS
     * =======================================================
     */

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    window.addEventListener(
      'blur',
      handleWindowBlur
    );

    window.addEventListener(
      'focus',
      handleWindowFocus
    );

    /*
     * =======================================================
     * CLEANUP
     * =======================================================
     */

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      window.removeEventListener(
        'blur',
        handleWindowBlur
      );

      window.removeEventListener(
        'focus',
        handleWindowFocus
      );
    };
  }, []);

  /*
   * =========================================================
   * START INTERVIEW
   * =========================================================
   */

  useEffect(() => {
    if (!initialMessage) {
      return;
    }

    const timer =
      setTimeout(
        async () => {
          if (
            conversationStartedRef.current
          ) {
            return;
          }

          conversationStartedRef.current =
            true;

          console.log(
            '🚨 INTERVIEW START TIMER FIRED'
          );

          console.log(
            '🚨 ABOUT TO START RECORDING'
          );

          transcriptRef.current.push({
            sender: 'ai',
            text: initialMessage,
            timestamp:
              new Date().toISOString()
          });

          await startRecording();

          console.log(
            '🚨 START RECORDING FINISHED'
          );

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                150
              )
          );

          console.log(
            '🚨 ABOUT TO SPEAK AI'
          );

          speakAI(initialMessage);
        },
        500
      );

    return () => {
      clearTimeout(timer);
    };
  }, [initialMessage]);

  /*
   * =========================================================
   * PARTICLE VISUALIZER
   * =========================================================
   */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect =
        canvas.getBoundingClientRect();

      const ratio =
        Math.min(
          window.devicePixelRatio ||
            1,
          1.5
        );

      width =
        rect.width;

      height =
        rect.height;

      canvas.width =
        width * ratio;

      canvas.height =
        height * ratio;

      ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
      );
    };

    resize();

    window.addEventListener(
      'resize',
      resize
    );

    const particles = [];

    const particleCount =
      2200;

    for (
      let i = 0;
      i < particleCount;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const distance =
        Math.pow(
          Math.random(),
          0.72
        );

      particles.push({
        angle,
        distance,
        size:
          0.8 +
          Math.random() *
            1.4,
        phase:
          Math.random() *
          Math.PI *
          2,
        frequency:
          2 +
          Math.random() * 7,
        randomWave:
          0.5 +
          Math.random() * 1.5,
        hue:
          Math.random()
      });
    }

    const draw = (time) => {
      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      const centerX =
        width / 2;

      const centerY =
        height / 2;

      const currentStatus =
        statusRef.current;

      const currentAudio =
        audioLevelRef.current;

      const speaking =
        currentStatus ===
        'speaking';

      const listening =
        currentStatus ===
        'listening';

      const energy =
        speaking
          ? 1
          : listening
          ? 0.35 +
            currentAudio *
              0.7
          : 0.12;

      const baseRadius =
        Math.min(
          width,
          height
        ) * 0.35;

      const t =
        time * 0.0012;

      particles.forEach(
        (particle) => {
          const angle =
            particle.angle;

          const distance =
            particle.distance;

          const wave1 =
            Math.sin(
              angle * 2.5 +
                t * 1.1 +
                particle.phase
            );

          const wave2 =
            Math.sin(
              angle * 5.5 -
                t * 1.45 +
                particle.phase *
                  1.7
            );

          const wave3 =
            Math.sin(
              angle *
                particle.frequency +
                t *
                  particle.randomWave +
                particle.phase
            );

          const wave4 =
            Math.sin(
              angle * 9 +
                t * 0.75 +
                particle.phase *
                  2.3
            );

          const randomWave =
            wave1 * 22 +
            wave2 * 14 +
            wave3 * 9 +
            wave4 * 5;

          const localWave =
            Math.sin(
              angle * 12 -
                t * 1.8 +
                particle.phase
            ) * 6;

          let distortion =
            randomWave +
            localWave;

          if (speaking) {
            distortion *=
              1.25 +
              currentAudio *
                0.15;
          } else if (
            listening
          ) {
            distortion *=
              0.85 +
              currentAudio *
                0.8;
          } else {
            distortion *=
              0.55;
          }

          const radius =
            distance *
              baseRadius +
            distortion *
              energy;

          const x =
            centerX +
            Math.cos(angle) *
              radius;

          const y =
            centerY +
            Math.sin(angle) *
              radius;

          const centerDensity =
            1 - distance;

          const opacity =
            0.24 +
            centerDensity *
              0.7;

          let r;
          let g;
          let b;

          if (
            particle.hue <
            0.46
          ) {
            r = 55;
            g = 190;
            b = 255;
          } else if (
            particle.hue <
            0.76
          ) {
            r = 105;
            g = 105;
            b = 255;
          } else {
            r = 225;
            g = 75;
            b = 245;
          }

          const pulse =
            1 +
            Math.sin(
              t * 2.5 +
                particle.phase
            ) *
              0.16;

          const size =
            particle.size *
            pulse *
            (speaking
              ? 1.08
              : 1);

          ctx.beginPath();

          ctx.arc(
            x,
            y,
            size,
            0,
            Math.PI * 2
          );

          ctx.fillStyle =
            `rgba(${r},${g},${b},${opacity})`;

          ctx.fill();
        }
      );

      animationRef.current =
        requestAnimationFrame(
          draw
        );
    };

    animationRef.current =
      requestAnimationFrame(
        draw
      );

    return () => {
      window.removeEventListener(
        'resize',
        resize
      );

      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, []);

  /*
   * =========================================================
   * END INTERVIEW
   * =========================================================
   */

  const handleEndInterview =
    async () => {
      if (
        statusRef.current ===
        'uploading'
      ) {
        return;
      }

      /*
       * Tell cheat detection that the
       * interview is intentionally ending.
       */
      endingInterviewRef.current =
        true;

      cheatWarningPendingRef.current =
        false;

      if (mountedRef.current) {
        setCheatWarning(false);
      }

      try {
        console.log(
          '🛑 Ending voice interview...'
        );

        stopListening();

        stopAIPlayback();

        if (
          window.speechSynthesis
        ) {
          window.speechSynthesis.cancel();
        }

        updateStatus(
          'uploading'
        );

        setError('');

        /*
         * Stop recording first.
         */

        const recordingBlob =
          await stopRecording();

        console.log(
          '📦 FINAL RECORDING BLOB:',
          recordingBlob
            ? {
                size:
                  recordingBlob.size,
                type:
                  recordingBlob.type
              }
            : null
        );

        let uploadResult =
          null;

        /*
         * Upload recording to Supabase Storage.
         */

        if (
          recordingBlob &&
          recordingBlob.size > 0
        ) {
          uploadResult =
            await uploadRecordingToSupabase(
              recordingBlob
            );
        } else {
          console.warn(
            '⚠️ Recording blob was empty or missing.'
          );
        }

        /*
         * Stop visualizer after
         * recording is finished.
         */

        stopAudioVisualizer();

        console.log(
          '✅ Interview recording upload complete:',
          uploadResult
        );

        const recordingPath =
          uploadResult?.filename ||
          uploadResult?.url ||
          null;

        console.log(
          '📁 Recording path:',
          recordingPath
        );

        if (onEndInterview) {
          await onEndInterview(
            transcriptRef.current,
            recordingPath
          );
        }
      } catch (err) {
        console.error(
          '❌ Failed to finish voice interview:',
          err
        );

        stopAudioVisualizer();

        if (mountedRef.current) {
          setError(
            err.message ||
              'Failed to finish the interview.'
          );

          updateStatus('error');
        }
      }
    };

  /*
   * Keep the latest handleEndInterview function
   * available to the visibility-change detector.
   */
  handleEndInterviewRef.current =
    handleEndInterview;

  /*
   * =========================================================
   * VISUALIZER CLICK
   * =========================================================
   */

  const handleVisualizerClick =
    () => {
      if (
        aiSpeaking ||
        status ===
          'thinking' ||
        status ===
          'uploading'
      ) {
        return;
      }

      if (
        isListeningRef.current
      ) {
        stopListening();

        updateStatus('ready');
      } else {
        startListening();
      }
    };

  /*
   * =========================================================
   * STATUS TEXT
   * =========================================================
   */

  const getStatusText = () => {
    if (
      status ===
      'speaking'
    ) {
      return 'AI is speaking...';
    }

    if (
      status ===
      'listening'
    ) {
      return 'Listening...';
    }

    if (
      status ===
      'thinking'
    ) {
      return 'Thinking...';
    }

    if (
      status ===
      'uploading'
    ) {
      return 'Saving interview...';
    }

    if (
      status ===
      'error'
    ) {
      return 'Voice error';
    }

    return 'Your turn';
  };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <>
      {cheatWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background:
              'rgba(0, 0, 0, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '2rem',
              borderRadius: '20px',
              background:
                'rgba(15, 18, 35, 0.98)',
              border:
                '1px solid rgba(239, 68, 68, 0.45)',
              boxShadow:
                '0 25px 80px rgba(0,0,0,0.6)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '0.75rem'
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                color: '#f8fafc',
                margin: 0,
                marginBottom: '0.75rem'
              }}
            >
              Final Warning
            </h2>

            <p
              style={{
                color: '#cbd5e1',
                lineHeight: 1.6,
                marginBottom: '1.5rem'
              }}
            >
              You left the interview window.
              Please remain on the interview
              screen for the rest of the interview.
            </p>

            <p
              style={{
                color: '#fca5a5',
                fontSize: '0.85rem',
                marginBottom: '1.5rem'
              }}
            >
              Leaving the interview window again
              will automatically end the interview.
            </p>

            <button
              type="button"
              onClick={() => {
                cheatWarningPendingRef.current =
                  false;

                setCheatWarning(false);
              }}
              style={{
                padding:
                  '0.8rem 1.8rem',
                border: 'none',
                borderRadius:
                  '999px',
                background:
                  'linear-gradient(135deg, #7c3aed, #ec4899)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Continue Interview
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          minHeight: '78vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1100px',
            minHeight: '74vh',
            borderRadius: '30px',
            position: 'relative',
            overflow: 'hidden',
            background:
              'radial-gradient(circle at center, rgba(30,25,75,0.3), rgba(5,8,20,0.96) 60%)',
            border:
              '1px solid rgba(130,120,255,0.15)',
            boxShadow:
              '0 30px 100px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding:
                '1.5rem 2rem',
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              position:
                'relative',
              zIndex: 5
            }}
          >
            <div>
              <div
                style={{
                  color:
                    '#c084fc',
                  fontSize:
                    '0.68rem',
                  fontWeight: 800,
                  letterSpacing:
                    '0.2em'
                }}
              >
                VOICE INTERVIEW
              </div>

              <div
                style={{
                  color:
                    '#f8fafc',
                  fontSize:
                    '1.25rem',
                  fontWeight: 700,
                  marginTop:
                    '0.35rem'
                }}
              >
                AI Interviewer
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '0.5rem',
                padding:
                  '0.55rem 0.85rem',
                borderRadius:
                  '999px',
                background:
                  'rgba(255,255,255,0.04)',
                border:
                  '1px solid rgba(255,255,255,0.08)',
                color:
                  '#cbd5e1',
                fontSize:
                  '0.75rem'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius:
                    '50%',
                  background:
                    status ===
                    'error'
                      ? '#ef4444'
                      : '#22c55e',
                  boxShadow:
                    status ===
                    'error'
                      ? '0 0 10px rgba(239,68,68,0.8)'
                      : '0 0 10px rgba(34,197,94,0.8)'
                }}
              />

              Question{' '}
              {questionCount}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection:
                'column',
              alignItems:
                'center',
              justifyContent:
                'center',
              position:
                'relative'
            }}
          >
            {recordingMode ===
              'video' && (
              <div
                style={{
                  position:
                    'absolute',
                  top: '1rem',
                  right: '1.5rem',
                  width:
                    '180px',
                  height:
                    '125px',
                  borderRadius:
                    '18px',
                  overflow:
                    'hidden',
                  background:
                    '#050814',
                  border:
                    '1px solid rgba(255,255,255,0.16)',
                  boxShadow:
                    '0 15px 40px rgba(0,0,0,0.5)',
                  zIndex: 10
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit:
                      'cover',
                    transform:
                      'scaleX(-1)',
                    display:
                      'block'
                  }}
                />

                <div
                  style={{
                    position:
                      'absolute',
                    left: '9px',
                    bottom: '9px',
                    padding:
                      '4px 8px',
                    borderRadius:
                      '999px',
                    background:
                      'rgba(0,0,0,0.55)',
                    border:
                      '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize:
                      '0.65rem',
                    fontWeight: 700,
                    backdropFilter:
                      'blur(8px)'
                  }}
                >
                  You
                </div>

                <div
                  style={{
                    position:
                      'absolute',
                    right: '9px',
                    top: '9px',
                    width: '8px',
                    height: '8px',
                    borderRadius:
                      '50%',
                    background:
                      '#22c55e',
                    boxShadow:
                      '0 0 10px rgba(34,197,94,0.9)'
                  }}
                />
              </div>
            )}

            <div
              style={{
                position:
                  'relative',
                width: '520px',
                height: '520px',
                maxWidth:
                  '92vw',
                maxHeight:
                  '58vh',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center'
              }}
            >
              <canvas
                ref={canvasRef}
                onClick={
                  handleVisualizerClick
                }
                style={{
                  width: '100%',
                  height: '100%',
                  cursor:
                    aiSpeaking ||
                    status ===
                      'thinking'
                      ? 'default'
                      : 'pointer'
                }}
              />
            </div>

            <div
              style={{
                textAlign:
                  'center',
                marginTop:
                  '-1.5rem',
                position:
                  'relative',
                zIndex: 3
              }}
            >
              <div
                style={{
                  color:
                    status ===
                    'speaking'
                      ? '#d946ef'
                      : status ===
                        'listening'
                      ? '#38bdf8'
                      : '#c4b5fd',
                  fontSize:
                    '1.45rem',
                  fontWeight: 800,
                  textShadow:
                    '0 0 25px rgba(168,85,247,0.25)'
                }}
              >
                {getStatusText()}
              </div>

              <div
                style={{
                  color:
                    '#94a3b8',
                  fontSize:
                    '0.82rem',
                  marginTop:
                    '0.55rem'
                }}
              >
                {status ===
                'speaking'
                  ? 'Listen carefully to the interviewer'
                  : status ===
                    'listening'
                  ? 'Speak naturally'
                  : status ===
                    'thinking'
                  ? 'Processing your response'
                  : status ===
                    'uploading'
                  ? 'Uploading your interview recording'
                  : 'Speak when you are ready'}
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop:
                    '1rem',
                  maxWidth:
                    '600px',
                  padding:
                    '0.7rem 1rem',
                  borderRadius:
                    '12px',
                  background:
                    'rgba(239,68,68,0.08)',
                  border:
                    '1px solid rgba(239,68,68,0.2)',
                  color:
                    '#fca5a5',
                  fontSize:
                    '0.75rem',
                  textAlign:
                    'center'
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div
            style={{
              padding:
                '1.25rem 2rem 1.5rem',
              display:
                'flex',
              justifyContent:
                'center',
              alignItems:
                'center',
              gap: '1rem'
            }}
          >
            <button
              type="button"
              onClick={
                handleVisualizerClick
              }
              disabled={
                aiSpeaking ||
                status ===
                  'thinking' ||
                status ===
                  'uploading'
              }
              style={{
                width: '54px',
                height: '54px',
                borderRadius:
                  '50%',
                border:
                  '1px solid rgba(255,255,255,0.12)',
                background:
                  status ===
                  'listening'
                    ? 'rgba(56,189,248,0.12)'
                    : 'rgba(255,255,255,0.04)',
                color: '#fff',
                cursor:
                  aiSpeaking ||
                  status ===
                    'thinking' ||
                  status ===
                    'uploading'
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  aiSpeaking ||
                  status ===
                    'thinking' ||
                  status ===
                    'uploading'
                    ? 0.45
                    : 1,
                fontSize:
                  '1.15rem'
              }}
            >
              🎤
            </button>

            <button
              type="button"
              onClick={
                handleEndInterview
              }
              disabled={
                status ===
                'uploading'
              }
              style={{
                padding:
                  '0.85rem 1.7rem',
                borderRadius:
                  '999px',
                border:
                  '1px solid rgba(236,72,153,0.35)',
                background:
                  'linear-gradient(135deg, rgba(126,34,206,0.3), rgba(236,72,153,0.18))',
                color:
                  '#f8fafc',
                fontWeight:
                  700,
                cursor:
                  status ===
                  'uploading'
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  status ===
                  'uploading'
                    ? 0.6
                    : 1,
                boxShadow:
                  '0 0 25px rgba(236,72,153,0.08)'
              }}
            >
              {status ===
              'uploading'
                ? 'Saving...'
                : 'End Interview'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoiceInterview;