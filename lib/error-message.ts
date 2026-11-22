/** Read an error message without assuming every thrown value is an Error. */
export function errorMessage(error: unknown): string | undefined {
  return error !== null && typeof error === 'object' && 'message' in error
    && typeof error.message === 'string' ? error.message : undefined;
}
