import express from 'express';
import multer from 'multer';

import {
    startSession,
    chatWithAI,
    endSession,
    getLeetCodeProfile,
    getGitHubProfileData
} from '../controllers/interviewController.js';

import {
    uploadRecording,
    uploadRecordingChunk,
    finalizeRecording
} from '../controllers/uploadController.js';

const router = express.Router();

const resumeUpload = multer({
    storage: multer.memoryStorage()
});

const recordingUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 26 * 1024 * 1024
    }
});

router.post(
    '/start',
    resumeUpload.single('resume'),
    startSession
);

router.post(
    '/chat',
    chatWithAI
);

router.post(
    '/end',
    endSession
);

router.post(
    '/recording/upload',
    recordingUpload.single('video'),
    uploadRecording
);

router.post(
    '/recording/upload-chunk',
    recordingUpload.single('chunk'),
    uploadRecordingChunk
);

router.post(
    '/recording/finalize',
    finalizeRecording
);

router.get(
    '/leetcode-profile/:username',
    getLeetCodeProfile
);

router.get(
    '/github-profile/:username',
    getGitHubProfileData
);

export default router;