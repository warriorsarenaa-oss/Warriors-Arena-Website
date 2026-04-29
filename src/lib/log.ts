/**
 * PII-AWARE LOGGER
 * 
 * This logger masks sensitive customer data (email, phone) before 
 * hitting console or external collectors.
 * 
 * Rules:
 * 1. Emails: Mask prefix, keep domain (e.g., u***@gmail.com).
 * 2. Phones: Mask all but last 4 digits (e.g., *******1234).
 */

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  message: string;
  context?: Record<string, any>;
  error?: Error | unknown;
}

/**
 * Masks sensitive strings within an object or string.
 */
function maskPII(input: any): any {
  if (typeof input === "string") {
    // Email pattern
    if (input.includes("@")) {
      const [prefix, domain] = input.split("@");
      return `${prefix.substring(0, 1)}***@${domain}`;
    }
    // Phone pattern (assuming digits-only or simple formatting)
    // Matches common EG/INTL phone lengths
    if (input.length >= 8 && /^[\d\s+()-]+$/.test(input)) {
        return `*******${input.slice(-4)}`;
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(maskPII);
  }

  if (typeof input === "object" && input !== null) {
    const masked: Record<string, any> = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        masked[key] = maskPII(input[key]);
      }
    }
    return masked;
  }

  return input;
}

function writeLog(level: LogLevel, payload: LogPayload) {
  const timestamp = new Date().toISOString();
  const maskedContext = payload.context ? maskPII(payload.context) : undefined;
  
  const logObj = {
    timestamp,
    level: level.toUpperCase(),
    message: payload.message,
    ...(maskedContext ? { context: maskedContext } : {}),
    ...(payload.error ? { error: payload.error instanceof Error ? payload.error.message : payload.error } : {})
  };

  if (level === "error") {
    console.error(JSON.stringify(logObj));
    // SENTRY_STUB: In production, we would call Sentry.captureException here
    // if (process.env.NODE_ENV === "production" && env.NEXT_PUBLIC_SENTRY_DSN) {
    //   Sentry.captureException(payload.error, { extra: maskedContext });
    // }
  } else if (level === "warn") {
    console.warn(JSON.stringify(logObj));
  } else {
    console.info(JSON.stringify(logObj));
  }
}

export const logger = {
  info: (message: string, context?: Record<string, any>) => 
    writeLog("info", { message, context }),
  
  warn: (message: string, context?: Record<string, any>) => 
    writeLog("warn", { message, context }),
  
  error: (message: string, error?: Error | unknown, context?: Record<string, any>) => 
    writeLog("error", { message, error, context }),
};
