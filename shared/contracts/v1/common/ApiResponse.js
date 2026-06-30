// Enterprise Shared Contract: API Response Envelope
export const SuccessResponse = (data, meta = {}, message = "Success") => ({
  success: true,
  data,
  message,
  metadata: {
    timestamp: new Date().toISOString(),
    ...meta
  }
});

export const FailureResponse = (error, code, details = null) => ({
  success: false,
  error,
  code,
  details
});
