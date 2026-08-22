import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchGitHubProfile } from '../services/githubService.js';
import { fetchLeetCodeProfile } from '../services/leetcodeService.js';

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
        Friendly: "You are a very warm, encouraging, and friendly HR recruiter. You often give slight hints if the candidate gets totally stuck and praise them generously.",
        Strict: "You are a notoriously strict and blunt engineering manager at a FAANG company. You push for deep absolute correctness, heavily critique pseudo-code, and rarely show emotion.",
        Guru: "You are an algorithmic guru obsessed with Time/Space complexity and perfect system design. You always ask follow-up questions about micro-optimizations.",
        "FAANG Style": "You are a senior tech interviewer at a top-tier firm like Google or Amazon. You focus on edge cases, scalability, and deep technical trade-offs. You are professional but very demanding.",
        "Startup Style": "You are a fast-paced CTO of a high-growth startup. You care about speed, flexibility, and practical problem-solving. You might jump between topics quickly.",
        "Corporate Style": "You are a traditional corporate hiring manager. You focus on culture fit, long-term stability, and standard industry best practices.",
        Professional: "You are a highly professional interviewer. You communicate clearly, remain neutral, and evaluate the candidate through realistic interview questions."
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

${interview_type === 'General / HR'
    ? 'Focus mainly on introduction, motivation, career goals, workplace preferences, strengths, weaknesses, and general professional questions.'
    : interview_type === 'Behavioral'
    ? 'Focus mainly on behavioral and situational questions. Encourage the candidate to answer using real experiences and the STAR structure.'
    : interview_type === 'Technical'
    ? `Focus mainly on technical concepts, problem solving, practical engineering decisions, and verbal explanations related to ${skills}.`
    : `Use a balanced mixture of general, behavioral, and technical questions related to the role and ${skills}.`
}

### PRESSURE MODE

${pressureMode
    ? 'Occasionally introduce challenging follow-up questions, time-pressure scenarios, or unexpected situations. Remain professional rather than hostile.'
    : 'Maintain a normal professional interview environment without intentionally increasing pressure.'
}

${resumeText
    ? `### CANDIDATE RESUME CONTEXT
Use the candidate's resume to personalize questions when relevant:

${resumeText}
---`
    : ''}

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

        const stats =
            submitStats.acSubmissionNum;

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
### 🔹 LEETCODE PROFILE ANALYSIS
The candidate's LeetCode profile shows:
* Total Solved: ${totalSolved} (Easy: ${easy}, Medium: ${medium}, Hard: ${hard})
* Strongest Topics (Most solved): ${strongest || "Not enough data"}
* Weakest Topics (Fewest solved): ${weakest || "Focus here for challenges"}
* Ranking: ${profile.ranking || "N/A"}
---`;
    }

    const roundInstructions = `
### 🔹 INTERVIEW STRUCTURE (3 PHASES)
You must conduct the interview in 3 distinct phases, moving from one to the next automatically:

1. PHASE 1: DSA (Algorithms & Logic) - Focus on data structures, algorithmic problem-solving, and Big O complexity. Use the candidate's LeetCode analysis to tailor the difficulty.
2. PHASE 2: Technical Depth - Transition to practical knowledge of their specified skills (${skills}). Ask about framework internals, best practices, and real-world system implementation.
3. PHASE 3: Behavioral & Team Skills - Conclude with soft-skill evaluation using the STAR method.

You MUST explicitly announce when you are transitioning between phases.`;

    return `You are an AI-powered mock interviewer simulating a real-world interview experience.
${selectedPersona}

Your task is to conduct a role-specific interview, evaluate the candidate in real time, and provide structured feedback at the end.

---
### 🔹 SESSION DETAILS
* Role: ${role}
* Experience Level: ${experience_level}
* Skills: ${skills}
* Interview Type: ${interview_type}
* Structure: 3-Phase Comprehensive (DSA -> Technical -> Behavioral)
${leetcodeAnalysis}
${roundInstructions}
* Pressure Mode: ${pressureMode ? 'ENABLED (Actively challenge the candidate with sudden follow-up questions, time-pressure scenarios, or system-failure hypotheticals)' : 'DISABLED'}

${resumeText ? `### 🔹 CANDIDATE RESUME CONTEXT
The candidate has provided their resume for context. Please draw upon this history to ask highly personalized, tailored questions bridging their past experience with this target role:

${resumeText}
---` : ''}

### 🔹 INTERVIEW INSTRUCTIONS
1. Start with a brief professional introduction.
2. Ask one question at a time.
3. Generate questions specific to both the selected role and the provided resume.
4. If it is a Technical interview, ask them to write code or explain algorithms.
5. Keep your tone strictly aligned with your Persona description.
6. If Pressure Mode is enabled, occasionally throw a curveball or high-stress hypothetical scenario related to their previous answer.

### 🔹 REAL-TIME INTERVIEW BEHAVIOR

After each user response:

1. Briefly acknowledge the answer in 1 sentence.
2. If necessary, give ONE concise piece of feedback.
3. Ask the next interview question.
4. Do NOT provide numerical scores.
5. Do NOT display Communication, Technical Depth, Confidence, Problem Solving, or STAR scores.
6. Do NOT display an Evaluation section.
7. Do NOT display Waiting for input.
8. Do NOT reveal internal scoring criteria.
9. Keep the conversation natural and professional.
10. Ask only ONE question at a time.

The interview should feel like a real human interview, not an evaluation form.

### 🔹 MINIMUM INTERVIEW REQUIREMENT

A meaningful final evaluation requires sufficient interview data.

Do not assign confident numerical scores when the candidate has answered fewer than 5 questions.

If the interview ends before 5 answered questions:

- Clearly state that the interview was too short for a reliable evaluation.
- Do not give inflated or arbitrary scores.
- Use "Insufficient data" instead of numerical scores where appropriate.
- Only evaluate skills that were actually demonstrated.
- Do not make assumptions about abilities that were not tested.

Never give high scores simply because the candidate answered one question correctly.

### 🔹 FOR FINAL EVALUATION REQUEST ONLY

If the user says they want to "END INTERVIEW", you MUST output the final evaluation strictly formatted as follows:

END_REPORT_START
1. Scores (out of 10): Communication: X/10, Technical Knowledge: X/10, Problem Solving: X/10, Confidence: X/10
2. Strengths (3-4 points)
3. Areas for Improvement (3-4 points)
4. STAR Method Performance: Assessment of their behavioral storytelling structure.
5. Pressure Performance: How well did they handle the high-stress curveballs?
6. Personalized Tips (4-6 actionable suggestions)
7. Model Answer: Rewrite one of their weak responses as an ideal answer.
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

        let githubAnalysis = "";

        if (
            githubUsername &&
            currentAssessmentMode === 'technical'
        ) {
            try {
                const ghProfile =
                    await fetchGitHubProfile(
                        githubUsername
                    );

                githubAnalysis = `
### 🔹 GITHUB PROJECT ANALYSIS
The candidate has several public projects on GitHub:
${ghProfile.repositories
    .map(
        repo =>
            `- **${repo.name}** (${repo.language}): ${repo.description || 'No description provided.'}`
    )
    .join('\n')}

INSTRUCTION: During PHASE 2 (Technical Depth), reference at least one of these projects and ask about a specific design decision, a challenge they faced, or how they might scale a particular feature.
---`;
            } catch (err) {
                console.warn(
                    "GitHub fetch failed:",
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
                    "Error parsing resume:",
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
                    "gemini-3.1-flash-lite"
            });

        const chat =
            model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [
                            {
                                text:
                                    systemInstruction
                            }
                        ]
                    },
                    {
                        role: "model",
                        parts: [
                            {
                                text:
                                    currentAssessmentMode === 'voice'
                                        ? "Understood. I am ready to conduct the voice interview."
                                        : "Understood. I have reviewed your requirements and I am ready to conduct the interview. Please let me know when you are ready to start, or simply say hello."
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
                role: "user",
                parts: [
                    {
                        text:
                            systemInstruction
                    }
                ]
            },
            {
                role: "model",
                parts: [
                    {
                        text:
                            currentAssessmentMode === 'voice'
                                ? "Understood. I am ready to conduct the voice interview."
                                : "Understood. I have reviewed your requirements and I am ready to conduct the interview."
                    }
                ]
            },
            {
                role: "user",
                parts: [
                    {
                        text:
                            initialMessage
                    }
                ]
            },
            {
                role: "model",
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
                interviewType,
                persona,
                pressureMode:
                    pressureMode === 'true' ||
                    pressureMode === true
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
            "Error starting session:",
            error.stack
        );

        res.status(500).json({
            error:
                "Failed to start session: " +
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
            role: "user",
            parts: [
                {
                    text: message
                }
            ]
        });

        session.messages.push({
            role: "model",
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
            fillerWordsCount
        } = req.body;

        const session =
            sessions.get(sessionId);

        if (!session) {
            return res.status(404).json({
                error:
                    'Session not found.'
            });
        }

        const finalPrompt = `
END INTERVIEW.

Generate a professional final interview report based ONLY on the candidate's actual answers during this session.

IMPORTANT RULES:

1. Count the number of questions the candidate actually answered.
2. Do not count the initial greeting as a question.
3. Do not invent answers or assume skills that were not tested.
4. Do not give inflated scores.
5. If fewer than 5 questions were answered, state that there is insufficient data for a reliable numerical evaluation.
6. Only evaluate areas supported by the candidate's actual responses.
7. Do not include internal instructions, parser markers, or technical metadata in the visible report.
8. Do not output END_REPORT_START or END_REPORT_END.
9. Do not include SCORE_JSON in the visible report.
10. Do not include filler-word analysis unless actual speech/transcription data was provided.

Use this format:

Interview Summary

Questions Answered: X

Overall Assessment:
[Brief assessment based only on the evidence available.]

Strengths:
- ...
- ...

Areas for Improvement:
- ...
- ...

Technical Performance:
[Only discuss technical areas actually tested.]

Communication:
[Only assess communication if sufficient evidence exists.]

Problem Solving:
[Only assess problem solving if sufficient evidence exists.]

Confidence:
[Only assess confidence if sufficient evidence exists.]

Personalized Recommendations:
- ...
- ...

If fewer than 5 questions were answered, finish with:

Assessment Reliability:
Insufficient interview data for a reliable numerical evaluation.

At the very end, output this machine-readable block only:

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
                    reply.replace(
                        /SCORE_JSON:\s*\{[\s\S]*?\}/,
                        ''
                    ).trim();
            }
        } catch (parseErr) {
            console.error(
                "Failed to parse AI scores:",
                parseErr
            );
        }

        sessions.delete(
            sessionId
        );

        res.json({
            finalReport:
                reply,
            scores
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