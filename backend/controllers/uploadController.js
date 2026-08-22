import { supabase } from '../lib/supabase.js';

export const uploadRecording = async (req, res) => {
    try {
        const { sessionId, recordingMode } = req.body;
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

        const mode =
            recordingMode === 'video'
                ? 'video'
                : 'audio';

        const fileName =
            `${sessionId}/recording-${Date.now()}.webm`;

        const { data, error } =
            await supabase.storage
                .from('AI_MOCK')
                .upload(
                    fileName,
                    file.buffer,
                    {
                        contentType:
                            file.mimetype ||
                            'application/octet-stream',
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
                    'Failed to upload recording to Supabase Storage',
                details: error.message
            });
        }

        console.log(
            '✅ Recording uploaded to Supabase:',
            data.path
        );

        res.json({
            success: true,
            message:
                'Recording uploaded successfully',
            path: data.path,
            filename: fileName,
            recordingMode: mode,
            contentType: file.mimetype,
            size: file.size
        });

    } catch (error) {
        console.error(
            'Recording upload error:',
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};