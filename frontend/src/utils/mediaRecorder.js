export const getSupportedMimeType = () => {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'audio/webm;codecs=opus',
    'audio/webm'
  ];

  return (
    types.find((type) =>
      MediaRecorder.isTypeSupported(type)
    ) || ''
  );
};

export const createRecorder = (
  stream,
  onData,
  onStop
) => {
  const mimeType =
    getSupportedMimeType();

  const recorder =
    mimeType
      ? new MediaRecorder(stream, {
          mimeType
        })
      : new MediaRecorder(stream);

  const chunks = [];

  recorder.ondataavailable = (
    event
  ) => {
    if (event.data?.size > 0) {
      chunks.push(event.data);

      if (onData) {
        onData(event.data);
      }
    }
  };

  recorder.onstop = () => {
    const blob = new Blob(
      chunks,
      {
        type:
          recorder.mimeType ||
          mimeType ||
          'video/webm'
      }
    );

    if (onStop) {
      onStop(blob);
    }
  };

  return recorder;
};

export const downloadRecording = (
  blob,
  filename
) => {
  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};