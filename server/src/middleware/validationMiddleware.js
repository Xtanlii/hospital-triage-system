const { ValidationError } = require('./errorMiddleware');

/**
 * Creates a middleware wrapper around a validation function.
 * @param {Function} validatorFn Function returning array of error objects { field, message }
 * @param {boolean} isUpdate Whether this is an update request
 */
function validateRequest(validatorFn, isUpdate = false) {
  return (req, res, next) => {
    const errors = validatorFn(req.body, isUpdate);
    if (errors && errors.length > 0) {
      return next(new ValidationError('Validation failed for request body', errors));
    }
    next();
  };
}

module.exports = {
  validateRequest
};

