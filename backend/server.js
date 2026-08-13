console.log('[SERVER] Starting...');

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

console.log('[SERVER] Initializing Express app...');

app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend is reachable'
    });
});

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;