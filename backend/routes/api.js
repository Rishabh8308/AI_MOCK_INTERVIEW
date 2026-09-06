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

import { authMiddleware } from '../middleware/auth.js';

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
    authMiddleware,
    resumeUpload.single('resume'),
    startSession
);

router.post(
    '/chat',
    authMiddleware,
    chatWithAI
);

router.post(
    '/end',
    authMiddleware,
    endSession
);

router.post(
    '/recording/upload',
    authMiddleware,
    recordingUpload.single('video'),
    uploadRecording
);

router.post(
    '/recording/upload-chunk',
    authMiddleware,
    recordingUpload.single('chunk'),
    uploadRecordingChunk
);

router.post(
    '/recording/finalize',
    authMiddleware,
    finalizeRecording
);

router.get(
    '/leetcode-profile/:username',
    authMiddleware,
    getLeetCodeProfile
);

router.get(
    '/github-profile/:username',
    authMiddleware,
    getGitHubProfileData
);

export default router;