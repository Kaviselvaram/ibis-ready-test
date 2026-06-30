import { SuccessResponse } from "../../../shared/contracts/v1/common/ApiResponse.js";

export const sendResponse = (res, statusCode, data = null, meta = {}) => {
  const combinedMeta = {
    requestId: res.req?.requestId,
    ...meta
  };
  res.status(statusCode).json(SuccessResponse(data, combinedMeta));
};
