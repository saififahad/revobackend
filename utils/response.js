export const failedResponse = (res, message, statusCode = 400, data = {}) => {
  return res.status(statusCode).json({
    message,
    status: false,
    ...data,
  });
};

export const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    message,
    ...data,
    status: true,
  });
};
