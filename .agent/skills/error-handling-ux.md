# User-Friendly Error Handling — Implementation Guide

> Transform every HTTP status code, database error, validation failure, and edge case into clear, actionable messages with good UI. Never show `400 Bad Request` or stack traces to users.

---

## Principles

1. **Human language, not HTTP codes.** "This phone number isn't valid" beats "400 Bad Request."
2. **Actionable.** Tell users what to do next, not just what went wrong.
3. **Contextual.** Booking wizard errors differ from admin dashboard errors.
4. **Consistent.** All errors use the same UI components.
5. **Logged, not shown.** Technical details go to Sentry, not the user.

---

## Error Categories & Messages

### Validation Errors (400)

**Scenario:** User submits form with invalid data.

**Bad:**
```json
{
  "error": "Bad Request",
  "details": "Validation failed on field: customer_phone"
}
```

**Good:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "We couldn't process your booking",
    "fields": {
      "customer_phone": "Please enter a valid Egyptian mobile number (e.g., 01234567890)"
    }
  }
}
```

**UI:**
```tsx
<Alert variant="error" icon={AlertCircle}>
  <AlertTitle>We couldn't process your booking</AlertTitle>
  <AlertDescription>
    Please check the highlighted fields and try again.
  </AlertDescription>
</Alert>

{/* Field-level error */}
<Input 
  error={errors.customer_phone?.message}
  className={errors.customer_phone && "border-red-500"}
/>
<ErrorText>{errors.customer_phone?.message}</ErrorText>
```

---

### Conflict Errors (409)

**Scenario:** User tries to book a slot that was just taken.

**Bad:**
```json
{
  "error": "Conflict",
  "message": "SLOT_CONFLICT: unique_violation on booking_slots(slot_date, slot_time)"
}
```

**Good:**
```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "This time slot was just booked by someone else",
    "action": "return_to_calendar",
    "data": {
      "conflicted_slot": "2026-05-15 18:00"
    }
  }
}
```

**UI:**
```tsx
<Alert variant="warning" icon={Clock}>
  <AlertTitle>This time slot was just booked</AlertTitle>
  <AlertDescription>
    Someone else reserved this slot while you were checking out. 
    Please choose another time.
  </AlertDescription>
  <AlertActions>
    <Button onClick={() => setStep(3)} variant="primary">
      Pick Another Time
    </Button>
  </AlertActions>
</Alert>
```

**Behavior:** Auto-return to Step 4 (time selection) after 3 seconds, or let user click button.

---

### Rate Limit Errors (429)

**Scenario:** Too many booking attempts from the same IP or phone.

**Bad:**
```json
{
  "error": "Too Many Requests",
  "retry_after": 3600
}
```

**Good:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You've made too many booking attempts",
    "retry_after_seconds": 3600,
    "retry_after_human": "1 hour"
  }
}
```

**UI:**
```tsx
<Alert variant="info" icon={ShieldAlert}>
  <AlertTitle>Slow down there, champ</AlertTitle>
  <AlertDescription>
    You've tried booking a few times. Take a break and try again in {retryAfterHuman}.
    If you're having trouble, message us on WhatsApp.
  </AlertDescription>
  <AlertActions>
    <Button asChild variant="outline">
      <a href={whatsappLink} target="_blank">
        <MessageCircle className="mr-2 h-4 w-4" />
        Get Help on WhatsApp
      </a>
    </Button>
  </AlertActions>
</Alert>
```

---

### Authentication Errors (401)

**Scenario:** Admin session expired.

**Bad:**
```json
{
  "error": "Unauthorized"
}
```

**Good:**
```json
{
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "Your session has expired",
    "action": "redirect_to_login"
  }
}
```

**UI (Modal):**
```tsx
<Dialog open={true} onOpenChange={() => {}}>
  <DialogContent closable={false}>
    <DialogHeader>
      <DialogTitle>Session Expired</DialogTitle>
      <DialogDescription>
        You've been logged out for security. Please sign in again to continue.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => router.push('/admin/login')}>
        Go to Login
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Behavior:** Auto-redirect after 5 seconds.

---

### Permission Errors (403)

**Scenario:** Staff user tries to view financials.

**Bad:**
```json
{
  "error": "Forbidden"
}
```

**Good:**
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You don't have access to this page",
    "required_permission": "view_financials",
    "user_role": "staff"
  }
}
```

**UI (Full-page):**
```tsx
<div className="flex flex-col items-center justify-center min-h-screen p-8">
  <ShieldX className="h-16 w-16 text-warriors-gray mb-4" />
  <h1 className="font-display text-3xl text-warriors-off-white mb-2">
    Access Denied
  </h1>
  <p className="text-warriors-gray text-center max-w-md mb-6">
    You don't have permission to view financial data. 
    If you think this is a mistake, contact your manager.
  </p>
  <Button onClick={() => router.back()} variant="outline">
    <ArrowLeft className="mr-2 h-4 w-4" />
    Go Back
  </Button>
</div>
```

---

### Not Found Errors (404)

**Scenario:** Booking code lookup with wrong phone_last4.

**Bad:**
```json
{
  "error": "Not Found"
}
```

**Good:**
```json
{
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "We couldn't find a booking with that code and phone number",
    "hint": "Check that you entered the last 4 digits of the phone number used when booking"
  }
}
```

**UI:**
```tsx
<Alert variant="warning" icon={SearchX}>
  <AlertTitle>Booking Not Found</AlertTitle>
  <AlertDescription>
    We couldn't find a booking with code <strong>{code}</strong> 
    and phone ending in <strong>{phone_last4}</strong>.
    <br /><br />
    Double-check the code and last 4 digits, then try again.
  </AlertDescription>
  <AlertActions>
    <Button onClick={() => setStep('input')} variant="outline">
      Try Again
    </Button>
    <Button asChild variant="primary">
      <a href={whatsappLink} target="_blank">
        Contact Us
      </a>
    </Button>
  </AlertActions>
</Alert>
```

---

### Server Errors (500)

**Scenario:** Database timeout, unexpected crash.

**Bad:**
```json
{
  "error": "Internal Server Error",
  "stack": "Error: Connection pool exhausted at pg.connect..."
}
```

**Good:**
```json
{
  "error": {
    "code": "SERVER_ERROR",
    "message": "Something went wrong on our end",
    "request_id": "req_abc123xyz",
    "support_contact": "+201234567890"
  }
}
```

**UI:**
```tsx
<Alert variant="error" icon={ServerCrash}>
  <AlertTitle>Oops, that's on us</AlertTitle>
  <AlertDescription>
    Something went wrong while processing your request. 
    We've been notified and are looking into it.
    <br /><br />
    <code className="text-xs bg-warriors-concrete px-2 py-1 rounded">
      Error ID: {requestId}
    </code>
  </AlertDescription>
  <AlertActions>
    <Button onClick={() => window.location.reload()} variant="outline">
      Refresh Page
    </Button>
    <Button asChild variant="primary">
      <a href={whatsappLink} target="_blank">
        Contact Support
      </a>
    </Button>
  </AlertActions>
</Alert>
```

**Critical:** Log full error + stack to Sentry with `request_id` as tag.

---

## Implementation Pattern

### 1. API Response Shape (Standardized)

Every API error returns this structure:

```typescript
// src/lib/api/error-response.ts
export type ApiError = {
  error: {
    code: string;           // Machine-readable
    message: string;        // User-facing summary
    details?: unknown;      // Optional extra context
    fields?: Record<string, string>;  // Validation field errors
    action?: string;        // Suggested next step
    retry_after_seconds?: number;
    request_id?: string;
  };
};

export function errorResponse(
  code: string,
  message: string,
  statusCode: number,
  extra?: Partial<ApiError['error']>
): Response {
  const requestId = crypto.randomUUID();
  
  // Log to Sentry
  Sentry.captureMessage(`API Error: ${code}`, {
    level: statusCode >= 500 ? 'error' : 'warning',
    tags: { error_code: code, request_id: requestId },
    extra: { message, ...extra },
  });

  return Response.json(
    {
      error: {
        code,
        message,
        request_id: requestId,
        ...extra,
      },
    },
    { status: statusCode }
  );
}
```

### 2. Error Boundary (Catch-All)

```tsx
// src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-warriors-black">
          <AlertTriangle className="h-16 w-16 text-warriors-orange mb-4" />
          <h1 className="font-display text-3xl text-warriors-off-white mb-2">
            Something Broke
          </h1>
          <p className="text-warriors-gray text-center max-w-md mb-6">
            The page crashed. We've been notified. Refresh to try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Wrap `app/[locale]/layout.tsx` children in `<ErrorBoundary>`.

---

### 3. Toast Notifications (Non-Blocking Errors)

For non-critical errors (e.g., autosave failed), use toast:

```tsx
// src/hooks/use-toast.ts (Radix or Sonner)
import { toast } from 'sonner';

export function showError(message: string, action?: () => void) {
  toast.error(message, {
    action: action ? {
      label: 'Retry',
      onClick: action,
    } : undefined,
  });
}

// Usage
try {
  await saveBookingDraft(data);
} catch (err) {
  showError('Failed to save your progress', () => saveBookingDraft(data));
}
```

---

### 4. Loading States (Prevent Confusion)

**Problem:** User clicks submit, nothing happens for 2 seconds, clicks again → double submission.

**Solution:**

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  if (isSubmitting) return;

  setIsSubmitting(true);
  try {
    await createBooking(formData);
    router.push('/success');
  } catch (err) {
    handleError(err);
  } finally {
    setIsSubmitting(false);
  }
}

return (
  <form onSubmit={handleSubmit}>
    {/* ... fields ... */}
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Confirming...
        </>
      ) : (
        'Confirm Booking'
      )}
    </Button>
  </form>
);
```

---

### 5. Offline Detection

```tsx
// src/hooks/use-online.ts
import { useEffect, useState } from 'react';

export function useOnline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Usage in layout
const isOnline = useOnline();

{!isOnline && (
  <div className="fixed top-0 inset-x-0 bg-warriors-orange text-warriors-black text-center py-2 z-50">
    <WifiOff className="inline mr-2 h-4 w-4" />
    You're offline. Changes won't save until you reconnect.
  </div>
)}
```

---

## Error Messages Reference (Copy-Paste Ready)

```typescript
// src/lib/errors/messages.ts
export const ERROR_MESSAGES = {
  // Validation
  INVALID_PHONE: 'Please enter a valid Egyptian mobile number (starts with 010, 011, 012, or 015)',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_DATE: 'Please select a date between today and 90 days from now',
  INVALID_PLAYER_COUNT: 'Group size must be between 1 and 6 players for online bookings',
  REQUIRED_FIELD: 'This field is required',

  // Booking conflicts
  SLOT_UNAVAILABLE: 'This time slot was just booked by someone else',
  VENUE_CLOSED: 'The venue is closed on the selected date',
  SLOT_IN_PAST: 'You cannot book a time slot in the past',

  // Rate limits
  RATE_LIMIT_IP: 'Too many booking attempts from your network. Please wait a few minutes.',
  RATE_LIMIT_PHONE: 'This phone number has made too many booking attempts. Try again in an hour.',

  // Auth
  INVALID_CREDENTIALS: 'Username or password is incorrect',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  MUST_CHANGE_PASSWORD: 'For security, you must change your password before continuing',
  WEAK_PASSWORD: 'Password must be at least 12 characters with uppercase, lowercase, number, and symbol',

  // Permissions
  PERMISSION_DENIED: 'You don't have permission to perform this action',
  ACCESS_DENIED_PAGE: 'You don't have access to this page',

  // Not found
  BOOKING_NOT_FOUND: 'We couldn't find a booking with that code and phone number',
  RESOURCE_NOT_FOUND: 'The requested resource was not found',

  // Server errors
  SERVER_ERROR: 'Something went wrong on our end. We've been notified.',
  DATABASE_ERROR: 'We're having trouble connecting to our database. Try again in a moment.',
  PAYMENT_ERROR: 'Payment processing is temporarily unavailable',

  // Network
  NETWORK_ERROR: 'Connection issue. Check your internet and try again.',
  TIMEOUT: 'Request took too long. Please try again.',

  // Generic
  UNKNOWN_ERROR: 'Something unexpected happened. Please try again or contact support.',
};
```

---

## UI Component Library

Use Radix UI primitives + Tailwind for consistency:

```bash
npm install @radix-ui/react-alert-dialog \
  @radix-ui/react-toast \
  @radix-ui/react-dialog \
  lucide-react
```

Wrap in Warriors Arena design system (green/orange theme).

---

## Testing Error Scenarios

In Sprint 8, manually test each error path:

- [ ] Invalid phone → field error shown, form doesn't submit
- [ ] Double slot booking → conflict message, return to calendar
- [ ] 6 rapid booking attempts → rate limit toast, retry timer shown
- [ ] Admin session expires mid-action → modal, redirect to login
- [ ] Staff tries to view financials → 403 page, helpful message
- [ ] Wrong booking code lookup → not found alert, retry option
- [ ] Database goes down (simulate: kill Supabase tunnel) → 500 error, Sentry notified, user sees "try again" message
- [ ] User goes offline mid-booking → offline banner appears

---

*End of Error Handling Guide*
