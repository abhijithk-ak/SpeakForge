// Standardizes all API responses so the frontend always
// gets the same shape: { success, data } or { success, error }

const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

const sendError = (res, code, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message }
  });
};

module.exports = { sendSuccess, sendError };
