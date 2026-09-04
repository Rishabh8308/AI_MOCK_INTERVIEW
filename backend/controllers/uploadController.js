import { supabase } from '../lib/supabase.js';

const BUCKET_NAME = 'AI_MOCK';
const CHUNK_SIZE = 25 * 1024 * 1024;

const getFolder = (recordingMode) => {
    return recordingMode === 'video'
        ? 'video+audio'
        : 'audio';
};

export const uploadRecordingChunk = async (req, res) => {
    try {
        const {
            sessionId,
            recordingMode,
            chunkIndex
        } = req.body;

        const file = req.file;

        if (!file) {
            return res.status(400).json({
                error: 'No recording chunk provided'
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        if (
            chunkIndex === undefined ||
            chunkIndex === null
        ) {
            return res.status(400).json({
                error: 'Chunk index is required'
            });
        }

        const index = Number(chunkIndex);

        if (
            !Number.isInteger(index) ||
            index < 0
        ) {
            return res.status(400).json({
                error: 'Invalid chunk index'
            });
        }

        if (file.size > CHUNK_SIZE) {
            return res.status(400).json({
                error: 'Recording chunk exceeds 25 MB',
                maxSize: CHUNK_SIZE,
                receivedSize: file.size
            });
        }

        const folder =
            getFolder(recordingMode);

        const interviewFolder =
            `${folder}/interview-${sessionId}`;

        const chunkNumber =
            String(index + 1).padStart(6, '0');

        const filePath =
            `${interviewFolder}/chunk-${chunkNumber}.webm`;

        console.log(
            'Uploading recording chunk:',
            {
                sessionId,
                recordingMode,
                chunkIndex: index,
                size: file.size,
                path: filePath
            }
        );

        const {
            data,
            error
        } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(
                filePath,
                file.buffer,
                {
                    contentType:
                        file.mimetype ||
                        (
                            recordingMode === 'video'
                                ? 'video/webm'
                                : 'audio/webm'
                        ),
                    cacheControl: '3600',
                    upsert: true
                }
            );

        if (error) {
            console.error(
                'Supabase chunk upload error:',
                error
            );

            return res.status(500).json({
                error:
                    'Failed to upload recording chunk',
                details:
                    error.message
            });
        }

        console.log(
            'Recording chunk uploaded:',
            data.path
        );

        return res.json({
            success: true,
            path: data.path,
            sessionId,
            recordingMode:
                recordingMode || 'audio',
            chunkIndex: index,
            folder,
            interviewFolder
        });
    } catch (error) {
        console.error(
            'Recording chunk upload error:',
            error
        );

        return res.status(500).json({
            success: false,
            error:
                error.message ||
                'Unexpected recording chunk upload error'
        });
    }
};

export const finalizeRecording = async (req, res) => {
    try {
        const {
            sessionId,
            recordingMode,
            totalChunks,
            mimeType
        } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        const total =
            Number(totalChunks);

        if (
            !Number.isInteger(total) ||
            total <= 0
        ) {
            return res.status(400).json({
                error: 'Invalid total chunks'
            });
        }

        const folder =
            getFolder(recordingMode);

        const interviewFolder =
            `${folder}/interview-${sessionId}`;

        const manifest = {
            sessionId,
            recordingMode:
                recordingMode || 'audio',
            totalChunks: total,
            chunkSize: CHUNK_SIZE,
            folder,
            interviewFolder,
            mimeType:
                mimeType ||
                (
                    recordingMode === 'video'
                        ? 'video/webm'
                        : 'audio/webm'
                ),
            createdAt:
                new Date().toISOString()
        };

        const manifestPath =
            `${interviewFolder}/manifest.json`;

        const manifestBuffer =
            Buffer.from(
                JSON.stringify(
                    manifest,
                    null,
                    2
                ),
                'utf-8'
            );

        const {
            data,
            error
        } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(
                manifestPath,
                manifestBuffer,
                {
                    contentType:
                        'application/json',
                    cacheControl: '3600',
                    upsert: true
                }
            );

        if (error) {
            console.error(
                'Manifest upload error:',
                error
            );

            return res.status(500).json({
                error:
                    'Failed to finalize recording',
                details:
                    error.message
            });
        }

        console.log(
            'Recording finalized:',
            data.path
        );

        return res.json({
            success: true,
            sessionId,
            recordingMode:
                recordingMode || 'audio',
            totalChunks: total,
            manifestPath: data.path,
            interviewFolder
        });
    } catch (error) {
        console.error(
            'Recording finalization error:',
            error
        );

        return res.status(500).json({
            success: false,
            error:
                error.message ||
                'Unexpected recording finalization error'
        });
    }
};

export const uploadRecording = async (req, res) => {
    try {
        const {
            sessionId,
            recordingMode
        } = req.body;

        const file = req.file;

        if (!file) {
            return res.status(400).json({
                error: 'No recording file provided'
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        const folder =
            getFolder(recordingMode);

        const fileName =
            `${folder}/interview-${sessionId}-${Date.now()}.webm`;

        const {
            data,
            error
        } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(
                fileName,
                file.buffer,
                {
                    contentType:
                        file.mimetype ||
                        (
                            recordingMode === 'video'
                                ? 'video/webm'
                                : 'audio/webm'
                        ),
                    cacheControl: '3600',
                    upsert: false
                }
            );

        if (error) {
            console.error(
                'Supabase Storage Upload Error:',
                error
            );

            return res.status(500).json({
                error:
                    'Failed to upload recording to cloud storage',
                details:
                    error.message
            });
        }

        const {
            data: publicUrlData
        } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return res.json({
            success: true,
            message:
                'Recording uploaded successfully',
            url:
                publicUrlData?.publicUrl ||
                null,
            filename:
                fileName,
            path:
                data.path,
            recordingMode:
                recordingMode || 'audio',
            folder
        });
    } catch (error) {
        console.error(
            'Recording upload error:',
            error
        );

        return res.status(500).json({
            success: false,
            error:
                error.message ||
                'Unexpected recording upload error'
        });
    }
};