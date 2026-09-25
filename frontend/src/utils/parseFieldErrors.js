// Converts the backend's { errors: [{ field, message }] } shape into a
// simple { fieldName: message } object that's easy to render next to inputs
export const parseFieldErrors = (error) => {
  const backendErrors = error?.response?.data?.errors;
  if (!Array.isArray(backendErrors)) {
    return {};
  }

  return backendErrors.reduce((acc, curr) => {
    acc[curr.field] = curr.message;
    return acc;
  }, {});
};

export const getGeneralErrorMessage = (error, fallback = 'Something went wrong') => {
  return error?.response?.data?.message || fallback;
};
