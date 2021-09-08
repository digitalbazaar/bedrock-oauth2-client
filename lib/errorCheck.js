export function isInvalidAccessTokenError({error}) {
  if(error.status === 401 && error.data &&
    (error.data.errors && error.data.errors.some(({name}) => name ===
    'ConstraintError') || error.data.name === 'NotAllowedError' ||
    error.data.name === 'ConstraintError' ||
    error.data.error === 'invalid_token')) {
    return true;
  }
  return false;
}

export function isUnrecoverableError({error}) {
  return !(error.error === 'temporarily_unavailable' ||
    isRecoverableTokenError({error}));
}

function isRecoverableTokenError({error}) {
  return (
    error.data.error === 'invalid_token' &&
    error.data.name === 'ConstraintError'
  );
}
