// authMiddleware.js
export const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
  
  export const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  };
  