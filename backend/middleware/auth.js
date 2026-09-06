import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Missing authorization header'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Missing authentication token'
      });
    }

    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid token or session'
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      'Auth Middleware Error:',
      error
    );

    res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
};