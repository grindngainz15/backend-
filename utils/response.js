function successResponse(message, data = null, pagination = null) {
  return {
    success: true,
    message,
    data,
    pagination
  };
}

function errorResponse(message, error = null) {
  return {
    success: false,
    message,
    error
  };
}

module.exports = { successResponse, errorResponse };