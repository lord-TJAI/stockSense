'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Validate a request body/query/params against a Zod schema.
 * Usage: router.post('/route', validate(schema), controller)
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ApiError(422, 'VALIDATION_ERROR', 'Validation failed', errors));
    }
    req[source] = result.data; // replace with parsed+coerced data
    next();
  };
}

module.exports = validate;
