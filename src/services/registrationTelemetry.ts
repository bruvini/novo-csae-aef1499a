import { logEvent } from "firebase/analytics";
import { analytics } from "@/services/firebase";
import type { RegistrationEvent } from "@/services/registrationFlow";

/**
 * Best-effort operational breadcrumbs. Never include email, UID, form values,
 * credentials, or free-text Firebase errors in analytics events.
 */
export function registrarEventoCadastro(event: RegistrationEvent): void {
  try {
    logEvent(analytics, "registration_progress", {
      correlation_id: event.correlationId,
      stage: event.stage,
      ...(event.errorCode ? { error_code: event.errorCode } : {}),
    });
  } catch {
    // Observability must not block account creation or profile persistence.
  }
}
