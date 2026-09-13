const FRIENDLY_MESSAGES: Record<string, string> = {
  "Invalid email or password": "That email or password doesn't match. Please try again.",
  "User already exists. Use another email.": "An account with that email already exists.",
  "Password too short": "Password must be at least 8 characters.",
  "Password too long": "Password is too long — please use a shorter one.",
};

export function friendlyAuthError(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  return FRIENDLY_MESSAGES[message] ?? message;
}
