// Hierarchical access control: admin > manager > employee
// Usage: authorize('admin') or authorize('admin', 'manager')

const roleRank = {
  employee: 1,
  manager: 2,
  admin: 3,
};

// Allows only the exact roles listed
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please log in',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to access this resource`,
      });
    }

    next();
  };
};

// Allows the given role AND anything ranked above it (hierarchical)
// e.g. minRole('manager') lets manager + admin through, blocks employee
const minRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please log in',
      });
    }

    const userRank = roleRank[req.user.role] || 0;
    const requiredRank = roleRank[role] || 0;

    if (userRank < requiredRank) {
      return res.status(403).json({
        success: false,
        message: `Requires role '${role}' or higher`,
      });
    }

    next();
  };
};

module.exports = { authorize, minRole };
