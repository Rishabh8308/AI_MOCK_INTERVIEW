import express from 'express';
import multer from 'multer';
import { startSession, chatWithAI, endSession, getLeetCodeProfile, getGitHubProfileData } from '../controllers/interviewController.js';
import { uploadRecording } from '../controllers/uploadController.js';

const router = express.Router();

// Multer Config for Resume
const resumeUpload = multer({ storage: multer.memoryStorage() });

// Multer Config for Video Recordings (using RAM instead of Disk for Serverless)
const videoUpload = multer({ storage: multer.memoryStorage() });

router.post('/start', resumeUpload.single('resume'), startSession);
router.post('/chat', chatWithAI);
router.post('/end', endSession);
router.post('/recording/upload', videoUpload.single('video'), uploadRecording);
router.get('/leetcode-profile/:username', getLeetCodeProfile);
router.get('/github-profile/:username', getGitHubProfileData);

export default router;
