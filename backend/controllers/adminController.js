import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const parseScores = (report) => {
  const defaultScores = {
    overall: 0,
    communication: 0,
    technical: 0,
    confidence: 0,
    starMethod: 0
  };

  if (!report || typeof report !== 'string') {
    return defaultScores;
  }

  const match = report.match(
    /SCORE_JSON:\s*(\{[\s\S]*?\})/
  );

  if (!match) {
    return defaultScores;
  }

  try {
    const scores = JSON.parse(match[1]);

    return {
      overall: Number(scores.overall) || 0,
      communication:
        Number(scores.communication) || 0,
      technical:
        Number(scores.technical) || 0,
      confidence:
        Number(scores.confidence) || 0,
      starMethod:
        Number(scores.starMethod) || 0
    };
  } catch {
    return defaultScores;
  }
};

const calculateAverage = (values) => {
  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );
};

const normalizeRecordingPath = (
  recordingPath
) => {
  if (!recordingPath) {
    return null;
  }

  let path =
    String(recordingPath).trim();

  if (
    path.endsWith('/manifest.json')
  ) {
    path =
      path.substring(
        0,
        path.length -
          '/manifest.json'.length
      );
  }

  if (path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path;
};

export const getAdminUsers = async (
  req,
  res
) => {
  try {
    if (
      req.user?.app_metadata?.role !==
      'admin'
    ) {
      return res.status(403).json({
        error: 'Access restricted'
      });
    }

    const users = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const {
        data,
        error
      } =
        await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage
        });

      if (error) {
        throw error;
      }

      users.push(
        ...(data.users || [])
      );

      if (
        !data.users ||
        data.users.length < perPage ||
        (
          data.total !== undefined &&
          users.length >= data.total
        )
      ) {
        break;
      }

      page += 1;
    }

    const {
      data: interviews,
      error: interviewError
    } = await supabaseAdmin
      .from('AI_MOCK')
      .select(
        'id,user_id,created_at,recording_path,recording_mode,role,experience_level,skills,interview_type,final_report'
      )
      .order('created_at', {
        ascending: false
      });

    if (interviewError) {
      throw interviewError;
    }

    const interviewMap = {};

    for (
      const interview of
      interviews || []
    ) {
      if (!interview.user_id) {
        continue;
      }

      if (
        !interviewMap[
          interview.user_id
        ]
      ) {
        interviewMap[
          interview.user_id
        ] = [];
      }

      interviewMap[
        interview.user_id
      ].push({
        ...interview,
        scores: parseScores(
          interview.final_report
        )
      });
    }

    const formattedUsers =
      users.map((user) => {
        const userInterviews =
          interviewMap[user.id] ||
          [];

        const overallScores =
          userInterviews
            .map(
              (item) =>
                item.scores.overall
            )
            .filter(
              (score) => score > 0
            );

        const technicalScores =
          userInterviews
            .map(
              (item) =>
                item.scores.technical
            )
            .filter(
              (score) => score > 0
            );

        const communicationScores =
          userInterviews
            .map(
              (item) =>
                item.scores.communication
            )
            .filter(
              (score) => score > 0
            );

        const confidenceScores =
          userInterviews
            .map(
              (item) =>
                item.scores.confidence
            )
            .filter(
              (score) => score > 0
            );

        const starScores =
          userInterviews
            .map(
              (item) =>
                item.scores.starMethod
            )
            .filter(
              (score) => score > 0
            );

        return {
          id: user.id,
          email: user.email || '',
          role:
            user.app_metadata?.role ||
            'user',
          created_at:
            user.created_at,
          interview_count:
            userInterviews.length,
          averages: {
            overall:
              calculateAverage(
                overallScores
              ),
            technical:
              calculateAverage(
                technicalScores
              ),
            communication:
              calculateAverage(
                communicationScores
              ),
            confidence:
              calculateAverage(
                confidenceScores
              ),
            starMethod:
              calculateAverage(
                starScores
              )
          }
        };
      });

    return res.json({
      users: formattedUsers,
      totalUsers:
        formattedUsers.length
    });
  } catch (error) {
    console.error(
      'Admin Users Error:',
      error
    );

    return res.status(500).json({
      error: 'Failed to load users'
    });
  }
};

export const getAdminUserInterviews =
  async (req, res) => {
    try {
      if (
        req.user?.app_metadata?.role !==
        'admin'
      ) {
        return res.status(403).json({
          error: 'Access restricted'
        });
      }

      const { userId } =
        req.params;

      if (!userId) {
        return res.status(400).json({
          error:
            'User ID is required'
        });
      }

      const {
        data,
        error
      } = await supabaseAdmin
        .from('AI_MOCK')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', {
          ascending: false
        });

      if (error) {
        throw error;
      }

      const formattedInterviews =
        (data || []).map(
          (interview) => ({
            ...interview,
            scores: parseScores(
              interview.final_report
            )
          })
        );

      return res.json({
        interviews:
          formattedInterviews
      });
    } catch (error) {
      console.error(
        'Admin User Interviews Error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to load user interviews'
      });
    }
  };

export const getAdminRecording =
  async (req, res) => {
    try {
      if (
        req.user?.app_metadata?.role !==
        'admin'
      ) {
        return res.status(403).json({
          error: 'Access restricted'
        });
      }

      const { id } =
        req.params;

      if (!id) {
        return res.status(400).json({
          error:
            'Interview ID is required'
        });
      }

      const {
        data: interview,
        error: interviewError
      } = await supabaseAdmin
        .from('AI_MOCK')
        .select(
          'id,user_id,recording_path,recording_mode'
        )
        .eq('id', id)
        .single();

      if (interviewError) {
        console.error(
          'Admin interview lookup error:',
          interviewError
        );

        return res.status(404).json({
          error:
            'Interview not found'
        });
      }

      if (!interview) {
        return res.status(404).json({
          error:
            'Interview not found'
        });
      }

      if (
        !interview.recording_path
      ) {
        return res.status(404).json({
          error:
            'No recording is associated with this interview'
        });
      }

      const recordingPath =
        normalizeRecordingPath(
          interview.recording_path
        );

      if (!recordingPath) {
        return res.status(404).json({
          error:
            'Invalid recording path'
        });
      }

      const manifestPath =
        `${recordingPath}/manifest.json`;

      const {
        data: manifestBlob,
        error: manifestError
      } =
        await supabaseAdmin.storage
          .from('AI_MOCK')
          .download(
            manifestPath
          );

      if (manifestError) {
        console.error(
          'Admin manifest download error:',
          manifestError
        );

        return res.status(404).json({
          error:
            'Recording manifest not found',
          details:
            manifestError.message
        });
      }

      const manifestText =
        await manifestBlob.text();

      let manifest;

      try {
        manifest =
          JSON.parse(
            manifestText
          );
      } catch (error) {
        console.error(
          'Admin manifest JSON parse error:',
          error
        );

        return res.status(500).json({
          error:
            'Invalid recording manifest'
        });
      }

      const totalChunks =
        Number(
          manifest.totalChunks
        );

      if (
        !Number.isInteger(
          totalChunks
        ) ||
        totalChunks <= 0
      ) {
        return res.status(500).json({
          error:
            'Invalid chunk information in recording manifest'
        });
      }

      const signedChunks = [];

      for (
        let index = 0;
        index < totalChunks;
        index++
      ) {
        const chunkNumber =
          String(
            index + 1
          ).padStart(
            6,
            '0'
          );

        const chunkPath =
          `${recordingPath}/chunk-${chunkNumber}.webm`;

        const {
          data: signedData,
          error: signedError
        } =
          await supabaseAdmin.storage
            .from('AI_MOCK')
            .createSignedUrl(
              chunkPath,
              60 * 60
            );

        if (signedError) {
          console.error(
            'Admin signed URL error:',
            signedError
          );

          return res.status(500).json({
            error:
              'Failed to create recording access URL',
            details:
              signedError.message
          });
        }

        if (
          !signedData?.signedUrl
        ) {
          return res.status(500).json({
            error:
              'Recording access URL was not created'
          });
        }

        signedChunks.push({
          index,
          path: chunkPath,
          url:
            signedData.signedUrl
        });
      }

      return res.json({
        success: true,
        interviewId:
          interview.id,
        recordingMode:
          interview.recording_mode ||
          manifest.recordingMode ||
          'audio',
        mimeType:
          manifest.mimeType ||
          (
            interview.recording_mode ===
            'video'
              ? 'video/webm'
              : 'audio/webm'
          ),
        totalChunks,
        recordingPath,
        manifestPath,
        chunks:
          signedChunks
      });
    } catch (error) {
      console.error(
        'Admin recording error:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          'Unexpected recording retrieval error'
      });
    }
  };

export const getAdminInterview =
  async (req, res) => {
    try {
      if (
        req.user?.app_metadata?.role !==
        'admin'
      ) {
        return res.status(403).json({
          error: 'Access restricted'
        });
      }

      const { id } =
        req.params;

      if (!id) {
        return res.status(400).json({
          error:
            'Interview ID is required'
        });
      }

      const {
        data: interview,
        error
      } = await supabaseAdmin
        .from('AI_MOCK')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !interview) {
        return res.status(404).json({
          error:
            'Interview not found'
        });
      }

      return res.json({
        interview
      });
    } catch (error) {
      console.error(
        'Admin Interview Error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to load interview'
      });
    }
  };

export const getAdminAnalytics =
  async (req, res) => {
    try {
      if (
        req.user?.app_metadata?.role !==
        'admin'
      ) {
        return res.status(403).json({
          error: 'Access restricted'
        });
      }

      const {
        data: interviews,
        error: interviewError
      } = await supabaseAdmin
        .from('AI_MOCK')
        .select(
          'id,user_id,created_at,role,final_report'
        )
        .order('created_at', {
          ascending: false
        });

      if (interviewError) {
        throw interviewError;
      }

      const allInterviews =
        interviews || [];

      const parsedInterviews =
        allInterviews.map(
          (interview) => ({
            ...interview,
            scores: parseScores(
              interview.final_report
            )
          })
        );

      const scoredInterviews =
        parsedInterviews.filter(
          (interview) =>
            interview.scores.overall > 0
        );

      const overallScores =
        scoredInterviews.map(
          (interview) =>
            interview.scores.overall
        );

      const technicalScores =
        scoredInterviews
          .map(
            (interview) =>
              interview.scores.technical
          )
          .filter(
            (score) => score > 0
          );

      const communicationScores =
        scoredInterviews
          .map(
            (interview) =>
              interview.scores.communication
          )
          .filter(
            (score) => score > 0
          );

      const confidenceScores =
        scoredInterviews
          .map(
            (interview) =>
              interview.scores.confidence
          )
          .filter(
            (score) => score > 0
          );

      const starScores =
        scoredInterviews
          .map(
            (interview) =>
              interview.scores.starMethod
          )
          .filter(
            (score) => score > 0
          );

      const now = new Date();

      const startOfToday =
        new Date(now);

      startOfToday.setHours(
        0,
        0,
        0,
        0
      );

      const startOfWeek =
        new Date(now);

      const day =
        startOfWeek.getDay();

      const daysFromMonday =
        day === 0
          ? 6
          : day - 1;

      startOfWeek.setDate(
        startOfWeek.getDate() -
          daysFromMonday
      );

      startOfWeek.setHours(
        0,
        0,
        0,
        0
      );

      const interviewsToday =
        allInterviews.filter(
          (interview) => {
            if (
              !interview.created_at
            ) {
              return false;
            }

            const date =
              new Date(
                interview.created_at
              );

            return date >=
              startOfToday;
          }
        ).length;

      const interviewsThisWeek =
        allInterviews.filter(
          (interview) => {
            if (
              !interview.created_at
            ) {
              return false;
            }

            const date =
              new Date(
                interview.created_at
              );

            return date >=
              startOfWeek;
          }
        ).length;

      const roleCounts = {};

      allInterviews.forEach(
        (interview) => {
          const role =
            interview.role?.trim() ||
            'General Interview';

          roleCounts[role] =
            (roleCounts[role] || 0) +
            1;
        }
      );

      const popularRoles =
        Object.entries(
          roleCounts
        )
          .sort(
            (a, b) =>
              b[1] - a[1]
          )
          .slice(0, 10)
          .map(
            ([role, count]) => ({
              role,
              count
            })
          );

      const scoreDistribution = {
        excellent: 0,
        good: 0,
        average: 0,
        needsImprovement: 0
      };

      scoredInterviews.forEach(
        (interview) => {
          const score =
            interview.scores.overall;

          if (score >= 80) {
            scoreDistribution.excellent += 1;
          } else if (score >= 60) {
            scoreDistribution.good += 1;
          } else if (score >= 40) {
            scoreDistribution.average += 1;
          } else {
            scoreDistribution.needsImprovement += 1;
          }
        }
      );

      return res.json({
        totalInterviews:
          allInterviews.length,

        interviewsToday,

        interviewsThisWeek,

        scoredInterviews:
          scoredInterviews.length,

        averages: {
          overall:
            calculateAverage(
              overallScores
            ),
          technical:
            calculateAverage(
              technicalScores
            ),
          communication:
            calculateAverage(
              communicationScores
            ),
          confidence:
            calculateAverage(
              confidenceScores
            ),
          starMethod:
            calculateAverage(
              starScores
            )
        },

        popularRoles,

        scoreDistribution
      });
    } catch (error) {
      console.error(
        'Admin Analytics Error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to load interview analytics'
      });
    }
  };