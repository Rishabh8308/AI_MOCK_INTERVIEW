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
  finalizeRecording,
  getRecording
} from '../controllers/uploadController.js';

import {
  getAdminUsers,
  getAdminUserInterviews,
  getAdminRecording,
  getAdminInterview,
  getAdminAnalytics

} from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

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
  '/recording/:id',
  authMiddleware,
  getRecording
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

router.get(
  '/admin/users',
  authMiddleware,
  adminAuth,
  getAdminUsers
);

router.get(
  '/admin/users/:userId/interviews',
  authMiddleware,
  adminAuth,
  getAdminUserInterviews
);
router.get(
  '/admin/interview/:id',
  authMiddleware,
  adminAuth,
  getAdminInterview
);
router.get(
  '/admin/recording/:id',
  authMiddleware,
  adminAuth,
  getAdminRecording
);
router.get(
  '/admin/analytics',
  authMiddleware,
  getAdminAnalytics
);

export default router;