export interface BookingAttempt { input: string; key: string }

/** One mounted form attempt: retain the key on a retry, rotate when input changes. */
export function bookingAttempt(previous: BookingAttempt | null, payload: unknown): BookingAttempt {
  const input = JSON.stringify(payload);
  return previous?.input === input ? previous : { input, key: crypto.randomUUID() };
}
