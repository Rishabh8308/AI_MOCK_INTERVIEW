import express from 'express';
import {
  generateInterviewVoiceStream
} from '../services/ttsService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Text is required.'
      });
    }

    res.setHeader(
      'Content-Type',
      'text/event-stream'
    );

    res.setHeader(
      'Cache-Control',
      'no-cache'
    );

    res.setHeader(
      'Connection',
      'keep-alive'
    );

    res.setHeader(
      'X-Accel-Buffering',
      'no'
    );

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    const responseStream =
      await generateInterviewVoiceStream(
        text.trim()
      );

    for await (
      const chunk of responseStream
    ) {
      const audioData =
        chunk.candidates?.[0]
          ?.content?.parts?.find(
            (part) =>
              part.inlineData?.data
          )
          ?.inlineData?.data;

      if (!audioData) {
        continue;
      }

      res.write(
        `data: ${JSON.stringify({
          audio: audioData,
          mimeType:
            'audio/L16;codec=pcm;rate=24000'
        })}\n\n`
      );
    }

    res.write(
      `data: ${JSON.stringify({
        done: true
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error(
      'TTS streaming error:',
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        error:
          'Failed to generate AI voice.'
      });
    }

    res.write(
      `data: ${JSON.stringify({
        error:
          'Failed to generate AI voice.'
      })}\n\n`
    );

    res.end();
  }
});

export default router;