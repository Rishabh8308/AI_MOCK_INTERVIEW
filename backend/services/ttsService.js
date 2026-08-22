import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export const generateInterviewVoiceStream = async (text) => {
  const prompt = `
You are a professional technical interviewer speaking directly to a candidate.

Speak naturally, clearly, confidently, and conversationally.

Use a moderate speaking pace with short natural pauses.

Pronounce technical terms clearly.

Do not sound robotic, rushed, overly dramatic, or like a news reader.

The candidate should feel like they are talking to a real professional interviewer.

Read the following interview response naturally:

${text}
`;

  const responseStream =
    await ai.models.generateContentStream({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore'
            }
          }
        }
      }
    });

  return responseStream;
};