export const adminAuth = (req, res, next) => {
  if (req.user?.app_metadata?.role !== 'admin') {
    return res.status(403).json({
      error: 'Access restricted'
    });
  }

  next();
};