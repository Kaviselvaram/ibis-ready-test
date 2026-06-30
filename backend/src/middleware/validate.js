import { AppError } from "../errors/AppError.js";

export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const validationResult = schema.safeParse(req[source]);
    if (!validationResult.success) {
      return next(new AppError("Invalid input data", 400, "VALIDATION_ERROR", validationResult.error.format()));
    }
    
    req.validatedData = { ...req.validatedData, ...validationResult.data };
    next();
  };
};
