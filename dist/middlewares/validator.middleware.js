const sendValidationError = (res, error) => {
    res.status(400).json({
        message: 'Validation error',
        errors: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message
        }))
    });
};
export const validateBodySchema = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        sendValidationError(res, result.error);
        return;
    }
    req.body = result.data;
    next();
};
export const validateParamsSchema = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
        sendValidationError(res, result.error);
        return;
    }
    next();
};
export const validateQuerySchema = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        sendValidationError(res, result.error);
        return;
    }
    next();
};
