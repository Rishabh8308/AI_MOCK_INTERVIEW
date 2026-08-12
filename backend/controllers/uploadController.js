import { supabase } from '../lib/supabase.js';

export const uploadRecording = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const fileName = `interview-${sessionId}-${Date.now()}.webm`;
        const { data, error } = await supabase.storage
            .from('recordings')
            .upload(fileName, file.buffer, {
                contentType: 'video/webm',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error("Supabase Storage Upload Error:", error);
            return res.status(500).json({ error: 'Failed to upload to cloud storage' });
        }

        const { data: { publicUrl } } = supabase.storage
            .from('recordings')
            .getPublicUrl(fileName);

        res.json({ 
            message: 'Recording uploaded successfully to cloud storage', 
            url: publicUrl,
            filename: fileName
        });
    } catch (error) {
        console.error('Recording upload error:', error);
        res.status(500).json({ error: error.message });
    }
};
