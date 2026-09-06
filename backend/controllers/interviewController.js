import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchGitHubProfile } from '../services/githubService.js';
import { fetchLeetCodeProfile } from '../services/leetcodeService.js';
import { supabase } from '../lib/supabase.js';

const sessions = new Map();

const buildSystemPrompt = (
    role,
    experience_level,
    skills,
    interview_type,
    persona,
    resumeText,
    leetcodeData,
    pressureMode,
    assessmentMode
) => {
    const personaGuides = {
        Friendly:
            "You are a very warm, encouraging, and friendly HR recruiter. You often give slight hints if the candidate gets totally stuck and praise them generously.",

        Strict:
            "You are a notoriously strict and blunt engineering manager at a FAANG company. You push for deep absolute correctness, heavily critique pseudo-code, and rarely show emotion.",

        Guru:
            "You are an algorithmic guru obsessed with Time/Space complexity and perfect system design. You always ask follow-up questions about micro-optimizations.",

        "FAANG Style":
            "You are a senior tech interviewer at a top-tier firm like Google or Amazon. You focus on edge cases, scalability, and deep technical trade-offs. You are professional but very demanding.",

        "Startup Style":
            "You are a fast-paced CTO of a high-growth startup. You care about speed, flexibility, and practical problem-solving. You might jump between topics quickly.",

        "Corporate Style":
            "You are a traditional corporate hiring manager. You focus on culture fit, long-term stability, and standard industry best practices.",

        Professional:
            "You are a highly professional interviewer. You communicate clearly, remain neutral, and evaluate the candidate through realistic interview questions."
    };

    const selectedPersona =
        personaGuides[persona] ||
        "You are a standard professional corporate interviewer.";

    if (assessmentMode === 'voice') {
        return `You are an AI voice interviewer conducting a realistic professional voice interview.

${selectedPersona}

Your task is to conduct a natural spoken interview for the candidate.

---
### SESSION DETAILS
* Role: ${role}
* Experience Level: ${experience_level}
* Interview Focus: ${interview_type}
* Interview Mode: Voice Interview
* Pressure Mode: ${pressureMode ? 'ENABLED' : 'DISABLED'}

### VOICE INTERVIEW RULES

1. This is a voice-only interview.
2. The candidate will hear your responses using text-to-speech.
3. Keep every response concise and natural for spoken conversation.
4. Ask only ONE question at a time.
5. Do not use markdown.
6. Do not use bullet points unless absolutely necessary.
7. Do not provide long written explanations.
8. Do not display numerical scores during the interview.
9. Do not display evaluation categories during the interview.
10. Do not reveal internal scoring criteria.
11. Do not mention that the candidate's speech is being converted into text.
12. Do not refer to a visible transcript because the candidate does not see one.
13. Respond as a human interviewer would speak.
14. Briefly acknowledge the candidate's answer before asking the next question.
15. Ask natural follow-up questions when appropriate.
16. Adapt the difficulty to the candidate's experience level.
17. For behavioral questions, encourage specific real-world examples.
18. For technical questions, ask the candidate to explain their reasoning verbally.

### INTERVIEW FOCUS

${
    interview_type === 'General / HR'
        ? 'Focus mainly on introduction, motivation, career goals, workplace preferences, strengths, weaknesses, and general professional questions.'
        : interview_type === 'Behavioral'
        ? 'Focus mainly on behavioral and situational questions. Encourage the candidate to answer using real experiences and the STAR structure.'
        : interview_type === 'Technical'
        ? `Focus mainly on technical concepts, problem solving, practical engineering decisions, and verbal explanations related to ${skills}.`
        : `Use a balanced mixture of general, behavioral, and technical questions related to the role and ${skills}.`
}

### PRESSURE MODE

${
    pressureMode
        ? 'Occasionally introduce challenging follow-up questions, time-pressure scenarios, or unexpected situations. Remain professional rather than hostile.'
        : 'Maintain a normal professional interview environment without intentionally increasing pressure.'
}

${
    resumeText
        ? `### CANDIDATE RESUME CONTEXT
Use the candidate's resume to personalize questions when relevant:

${resumeText}
---`
        : ''
}

### INTERVIEW BEHAVIOR

After each candidate response:

1. Briefly acknowledge their answer.
2. Ask one relevant follow-up or next question.
3. Keep the response concise enough to sound natural when spoken.
4. Do not give numerical scores.
5. Do not provide a final evaluation until the candidate explicitly asks to end the interview.

### MINIMUM INTERVIEW REQUIREMENT

A meaningful final evaluation requires sufficient interview data.

Do not assign confident numerical scores when fewer than 5 questions have been answered.

If the interview ends before 5 answered questions:

- State that there is insufficient data for a reliable evaluation.
- Do not invent abilities.
- Only evaluate areas actually demonstrated.

### FINAL EVALUATION

When the candidate says they want to end the interview, generate a professional evaluation based only on their actual responses.

Use this format:

Interview Summary

Questions Answered: X

Overall Assessment:
[Brief evidence-based assessment.]

Strengths:
- ...
- ...

Areas for Improvement:
- ...
- ...

Technical Performance:
[Only evaluate technical performance if technical questions were actually asked.]

Communication:
[Evaluate communication based on the candidate's actual spoken responses.]

Problem Solving:
[Evaluate problem solving only when sufficient evidence exists.]

Confidence:
[Evaluate confidence only when sufficient evidence exists.]

STAR Method Performance:
[Evaluate behavioral storytelling where applicable.]

Personalized Recommendations:
- ...
- ...

If fewer than 5 questions were answered, finish with:

Assessment Reliability:
Insufficient interview data for a reliable numerical evaluation.

At the very end, output:

SCORE_JSON:
{
  "overall": 0,
  "communication": 0,
  "technical": 0,
  "confidence": 0,
  "starMethod": 0
}
`;
    }

    let leetcodeAnalysis = "";

    if (leetcodeData) {
        const {
            profile,
            submitStats,
            tagProblemCounts
        } = leetcodeData;

        const stats = submitStats.acSubmissionNum;

        const easy =
            stats.find(
                s => s.difficulty === 'Easy'
            )?.count || 0;

        const medium =
            stats.find(
                s => s.difficulty === 'Medium'
            )?.count || 0;

        const hard =
            stats.find(
                s => s.difficulty === 'Hard'
            )?.count || 0;

        const totalSolved =
            stats.find(
                s => s.difficulty === 'All'
            )?.count ||
            (easy + medium + hard);

        const allTags = [
            ...(tagProblemCounts?.advanced || []),
            ...(tagProblemCounts?.intermediate || []),
            ...(tagProblemCounts?.fundamental || [])
        ].sort(
            (a, b) =>
                b.problemsSolved -
                a.problemsSolved
        );

        const strongest =
            allTags
                .slice(0, 3)
                .map(t => t.tagName)
                .join(", ");

        const weakest =
            allTags
                .slice(-3)
                .map(t => t.tagName)
                .join(", ");

        leetcodeAnalysis = `
### LEETCODE PROFILE ANALYSIS

The candidate's LeetCode profile shows:

* Total Solved: ${totalSolved}
* Easy: ${easy}
* Medium: ${medium}
* Hard: ${hard}
* Strongest Topics: ${strongest || "Not enough data"}
* Weakest Topics: ${weakest || "Not enough data"}
* Ranking: ${profile.ranking || "N/A"}
---`;
    }

    const roundInstructions = `
### INTERVIEW STRUCTURE

You must conduct the interview in 3 distinct phases:

1. PHASE 1: DSA
2. PHASE 2: Technical Depth
3. PHASE 3: Behavioral & Team Skills

Move between phases automatically and explicitly announce transitions.
`;

    return `You are an AI-powered mock interviewer simulating a real-world interview experience.

${selectedPersona}

Your task is to conduct a role-specific interview, evaluate the candidate in real time, and provide structured feedback at the end.

---
### SESSION DETAILS

* Role: ${role}
* Experience Level: ${experience_level}
* Skills: ${skills}
* Interview Type: ${interview_type}
* Structure: 3-Phase Comprehensive
${leetcodeAnalysis}
${roundInstructions}

* Pressure Mode:
${
    pressureMode
        ? 'ENABLED'
        : 'DISABLED'
    }

${
    resumeText
        ? `### CANDIDATE RESUME CONTEXT

${resumeText}
---`
        : ''
}

### INTERVIEW INSTRUCTIONS

1. Start with a brief professional introduction.
2. Ask one question at a time.
3. Generate questions specific to the role and resume.
4. If technical, ask the candidate to write code or explain algorithms.
5. Keep your tone aligned with the selected persona.
6. If pressure mode is enabled, occasionally introduce challenging scenarios.

### REAL-TIME INTERVIEW BEHAVIOR

After each user response:

1. Briefly acknowledge the answer.
2. Give concise feedback if necessary.
3. Ask the next question.
4. Do not provide numerical scores during the interview.
5. Do not reveal evaluation criteria.
6. Ask only ONE question at a time.

### MINIMUM INTERVIEW REQUIREMENT

A meaningful final evaluation requires sufficient interview data.

Do not assign confident numerical scores when fewer than 5 questions have been answered.

### FINAL EVALUATION

If the user ends the interview, generate a professional final report.

END_REPORT_START

1. Scores
2. Strengths
3. Areas for Improvement
4. STAR Method Performance
5. Pressure Performance
6. Personalized Tips
7. Model Answer

END_REPORT_END
`;
};

export const startSession = async (req, res) => {
    try {
        const {
            role,
            experienceLevel,
            skills,
            interviewType,
            leetcodeUsername,
            githubUsername,
            persona,
            pressureMode,
            sessionMode,
            assessmentMode,
            recordingEnabled,
            voiceInterview
        } = req.body;

        const currentAssessmentMode =
            assessmentMode === 'voice' ||
            voiceInterview === 'true' ||
            voiceInterview === true
                ? 'voice'
                : 'technical';

        if (
            githubUsername &&
            currentAssessmentMode === 'technical'
        ) {
            try {
                await fetchGitHubProfile(
                    githubUsername
                );
            } catch (err) {
                console.warn(
                    'GitHub fetch failed:',
                    err.message
                );
            }
        }

        const apiKey =
            process.env.GEMINI_API_KEY ||
            req.body.apiKey;

        if (!apiKey) {
            return res.status(400).json({
                error:
                    'Gemini API Key is required.'
            });
        }

        let leetcodeData = null;

        if (
            leetcodeUsername &&
            currentAssessmentMode === 'technical'
        ) {
            leetcodeData =
                await fetchLeetCodeProfile(
                    leetcodeUsername
                );
        }

        let resumeText = '';

        if (req.file) {
            try {
                const { createRequire } =
                    await import('module');

                const require =
                    createRequire(
                        import.meta.url
                    );

                const pdf =
                    require('pdf-parse');

                const pdfData =
                    await pdf(
                        req.file.buffer
                    );

                resumeText =
                    pdfData.text;
            } catch (err) {
                console.error(
                    'Error parsing resume:',
                    err
                );
            }
        }

        const systemInstruction =
            buildSystemPrompt(
                role,
                experienceLevel,
                skills,
                interviewType,
                persona,
                resumeText,
                leetcodeData,
                pressureMode,
                currentAssessmentMode
            );

        const genAI =
            new GoogleGenerativeAI(
                apiKey
            );

        const model =
            genAI.getGenerativeModel({
                model:
                    'gemini-3.1-flash-lite'
            });

        const chat =
            model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text:
                                    systemInstruction
                            }
                        ]
                    },
                    {
                        role: 'model',
                        parts: [
                            {
                                text:
                                    'Understood. I am ready to conduct the interview.'
                            }
                        ]
                    }
                ]
            });

        const initialMessage =
            currentAssessmentMode === 'voice'
                ? 'Hello, I am ready to begin the voice interview.'
                : 'Hello, I am ready to begin the interview.';

        const response =
            await chat.sendMessage(
                initialMessage
            );

        const reply =
            response.response.text();

        const sessionId =
            `session_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 9)}`;

        const initialMessages = [
            {
                role: 'user',
                parts: [
                    {
                        text:
                            systemInstruction
                    }
                ]
            },
            {
                role: 'model',
                parts: [
                    {
                        text:
                            'Understood. I am ready to conduct the interview.'
                    }
                ]
            },
            {
                role: 'user',
                parts: [
                    {
                        text:
                            initialMessage
                    }
                ]
            },
            {
                role: 'model',
                parts: [
                    {
                        text:
                            reply
                    }
                ]
            }
        ];

        sessions.set(
            sessionId,
            {
                chat,
                genAI,
                messages:
                    initialMessages,

                questionsAsked: 1,

                assessmentMode:
                    currentAssessmentMode,

                recordingEnabled:
                    recordingEnabled === 'true' ||
                    recordingEnabled === true,

                role,

                experienceLevel,

                skills,

                interviewType,

                persona,

                pressureMode:
                    pressureMode === 'true' ||
                    pressureMode === true,

                sessionMode
            }
        );

        res.json({
            sessionId,
            reply,
            assessmentMode:
                currentAssessmentMode,

            recordingEnabled:
                recordingEnabled === 'true' ||
                recordingEnabled === true
        });

    } catch (error) {
        console.error(
            'Error starting session:',
            error.stack
        );

        res.status(500).json({
            error:
                'Failed to start session: ' +
                error.message
        });
    }
};

export const chatWithAI = async (
    req,
    res
) => {
    try {
        const {
            sessionId,
            message
        } = req.body;

        const session =
            sessions.get(sessionId);

        if (!session) {
            return res.status(404).json({
                error:
                    'Session not found. Please start a new interview.'
            });
        }

        const response =
            await session.chat.sendMessage(
                message
            );

        const reply =
            response.response.text();

        session.messages.push({
            role: 'user',
            parts: [
                {
                    text: message
                }
            ]
        });

        session.messages.push({
            role: 'model',
            parts: [
                {
                    text: reply
                }
            ]
        });

        session.questionsAsked =
            (session.questionsAsked || 0) +
            1;

        res.json({
            reply
        });

    } catch (error) {
        console.error(
            'Error during chat:',
            error
        );

        res.status(500).json({
            error:
                error.message
        });
    }
};

export const endSession = async (
    req,
    res
) => {
    try {
        const {
            sessionId,
            fillerWordsCount,
            recordingPath,
            recordingUrl
        } = req.body;

        const session =
            sessions.get(sessionId);

        if (!session) {
            return res.status(404).json({
                error:
                    'Session not found.'
            });
        }

        console.log(
            '[INTERVIEW] Ending session:',
            sessionId
        );

        /*
         * Generate final AI report
         */

        const finalPrompt = `
END INTERVIEW.

Generate a professional final interview report based ONLY on the candidate's actual answers during this session.

IMPORTANT RULES:

1. Count the questions actually answered.
2. Do not count the initial greeting.
3. Do not invent answers.
4. Do not give inflated scores.
5. If fewer than 5 questions were answered, state that there is insufficient data.
6. Only evaluate areas supported by actual responses.
7. Do not include internal instructions.
8. Do not output END_REPORT_START or END_REPORT_END.
9. Do not output SCORE_JSON visibly except for the machine-readable block below.

Use this format:

Interview Summary

Questions Answered: X

Overall Assessment:
[Brief evidence-based assessment.]

Strengths:
- ...
- ...

Areas for Improvement:
- ...
- ...

Technical Performance:
[Only evaluate technical areas actually tested.]

Communication:
[Evaluate based on actual responses.]

Problem Solving:
[Evaluate only when evidence exists.]

Confidence:
[Evaluate only when evidence exists.]

STAR Method Performance:
[Evaluate behavioral storytelling where applicable.]

Personalized Recommendations:
- ...
- ...

If fewer than 5 questions were answered:

Assessment Reliability:
Insufficient interview data for a reliable numerical evaluation.

At the very end:

SCORE_JSON:
{
  "overall": 0,
  "communication": 0,
  "technical": 0,
  "confidence": 0,
  "starMethod": 0
}
`;

        const response =
            await session.chat.sendMessage(
                finalPrompt
            );

        let reply =
            response.response.text();

        let scores = {
            overall: 0,
            communication: 0,
            technical: 0,
            confidence: 0,
            starMethod: 0
        };

        try {
            const scoreMatch =
                reply.match(
                    /SCORE_JSON:\s*(\{[\s\S]*?\})/
                );

            if (scoreMatch) {
                scores =
                    JSON.parse(
                        scoreMatch[1]
                    );

                reply =
                    reply
                        .replace(
                            /SCORE_JSON:\s*\{[\s\S]*?\}/,
                            ''
                        )
                        .trim();
            }

        } catch (parseErr) {
            console.error(
                '[AI] Failed to parse scores:',
                parseErr
            );
        }

        /*
         * Prepare transcript.
         *
         * The first two messages are internal
         * system/setup messages, so we don't save
         * those in the interview transcript.
         */

        const transcript =
            (session.messages || [])
                .slice(2)
                .map(message => ({
                    role:
                        message.role,
                    text:
                        message.parts?.[0]?.text || ''
                }));

        /*
         * Voice interview:
         *
         * recordingPath / recordingUrl comes
         * from the frontend after the recording
         * has been uploaded to Supabase Storage.
         *
         * Normal interview:
         *
         * no recording exists, therefore NULL.
         */

        const isVoiceInterview =
            session.assessmentMode === 'voice';

        const recordingMode =
            isVoiceInterview
                ? 'voice'
                : 'normal';

        const finalRecordingPath =
            isVoiceInterview
                ? (
                    recordingPath ||
                    recordingUrl ||
                    null
                )
                : null;

        const fillerCount =
            isVoiceInterview &&
            Number.isFinite(
                Number(fillerWordsCount)
            )
                ? Number(fillerWordsCount)
                : 0;

        /*
         * Save complete interview
         * into AI_MOCK.
         */

        console.log(
            '[DB] Saving interview to AI_MOCK...'
        );

        const { data, error } =
            await supabase
                .from('AI_MOCK')
                .insert({
                    user_id:
                        req.user.id,
                    session_id:
                        sessionId,

                    recording_mode:
                        recordingMode,

                    recording_path:
                        finalRecordingPath,

                    transcript:
                        transcript,

                    filler_words_count:
                        fillerCount,

                    final_report:
                        reply,

                    role:
                        session.role || null,

                    experience_level:
                        session.experienceLevel || null,

                    skills:
                        session.skills || null,

                    interview_type:
                        session.interviewType || null,

                    persona:
                        session.persona || null,

                    pressure_mode:
                        session.pressureMode || false
                })
                .select()
                .single();

        if (error) {
            console.error(
                '[DB] AI_MOCK insert failed:',
                error
            );

            return res.status(500).json({
                error:
                    'Interview report generated, but failed to save it to AI_MOCK.',

                details:
                    error.message,

                finalReport:
                    reply,

                scores
            });
        }

        console.log(
            '[DB] Interview saved successfully:',
            data.id
        );

        /*
         * Session is no longer needed.
         */

        sessions.delete(
            sessionId
        );

        res.json({
            finalReport:
                reply,

            scores,

            savedInterview:
                data
        });

    } catch (error) {
        console.error(
            'Error ending session:',
            error
        );

        res.status(500).json({
            error:
                error.message
        });
    }
};

export const getLeetCodeProfile = async (
    req,
    res
) => {
    try {
        const {
            username
        } = req.params;

        const profile =
            await fetchLeetCodeProfile(
                username
            );

        if (!profile) {
            return res.status(404).json({
                error:
                    'LeetCode profile not found or is private.'
            });
        }

        res.json(profile);

    } catch (error) {
        res.status(500).json({
            error:
                error.message
        });
    }
};

export const getGitHubProfileData = async (
    req,
    res
) => {
    try {
        const {
            username
        } = req.params;

        const profile =
            await fetchGitHubProfile(
                username
            );

        res.json(profile);

    } catch (error) {
        res.status(500).json({
            error:
                error.message
        });
    }
};