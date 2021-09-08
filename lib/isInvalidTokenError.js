export function isInvalidTokenError({e}) {
  if(e.status === 401 && e.data &&
    (e.data.errors && e.data.errors.some(({name}) => name ===
    'ConstraintError') || e.data.name === 'NotAllowedError' ||
    e.data.error === 'invalid_token')) {
    return true;
  }
  return false;
}
