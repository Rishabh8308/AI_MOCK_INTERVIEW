import { supabase } from '../lib/supabase.js';

export const uploadRecording = async (req, res) => {
    try {
        const { sessionId, recordingMode } = req.body;
        const file = req.file;

        console.log('📥 Recording upload request:', {
            sessionId,
            recordingMode,
            fileName: file?.originalname,
            fileSize: file?.size,
            fileType: file?.mimetype
        });

        // --------------------------------------------------
        // Validate file
        // --------------------------------------------------

        if (!file) {
            return res.status(400).json({
                error: 'No recording file provided'
            });
        }

        // --------------------------------------------------
        // Validate session
        // --------------------------------------------------

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        // --------------------------------------------------
        // Determine folder
        // --------------------------------------------------

        let folder;

        if (recordingMode === 'video') {
            folder = 'video+audio';
        } else {
            folder = 'audio';
        }

        // --------------------------------------------------
        // Create unique filename
        // --------------------------------------------------

        const fileName =
            `${folder}/interview-${sessionId}-${Date.now()}.webm`;

        console.log(
            '📁 Uploading to:',
            fileName
        );

        // --------------------------------------------------
        // Upload to Supabase
        // --------------------------------------------------

        const {
            data,
            error
        } = await supabase.storage
            .from('AI_MOCK')
            .upload(
                fileName,
                file.buffer,
                {
                    contentType:
                        file.mimetype ||
                        'audio/webm',

                    cacheControl:
                        '3600',

                    upsert: false
                }
            );

        if (error) {
            console.error(
                '❌ Supabase Storage Upload Error:',
                error
            );

            return res.status(500).json({
                error:
                    'Failed to upload recording to cloud storage'
            });
        }

        console.log(
            '✅ Supabase upload successful:',
            data
        );

        // --------------------------------------------------
        // Get public URL
        // --------------------------------------------------

        const {
            data: publicUrlData
        } = supabase.storage
            .from('AI_MOCK')
            .getPublicUrl(fileName);

        const publicUrl =
            publicUrlData?.publicUrl || null;

        console.log(
            '🔗 Recording URL:',
            publicUrl
        );

        // --------------------------------------------------
        // Return information to frontend
        // --------------------------------------------------

        return res.json({
            message:
                'Recording uploaded successfully',

            url:
                publicUrl,

            filename:
                fileName,

            recordingMode:
                recordingMode || 'audio',

            folder:
                folder
        });

    } catch (error) {
        console.error(
            '❌ Recording upload error:',
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                'Unexpected recording upload error'
        });
    }
};