export type RegistrationStage =
  | "validation_rejected"
  | "form_validated"
  | "terms_accepted"
  | "registration_started"
  | "account_created"
  | "profile_saved"
  | "registration_completed"
  | "registration_failed"
  | "registration_cleanup_failed";

export interface RegistrationEvent {
  correlationId: string;
  stage: RegistrationStage;
  errorCode?: string;
}

export interface RegistrationFlowDependencies<TProfile> {
  prepare(): Promise<void>;
  createAccount(email: string, password: string): Promise<{ uid: string }>;
  saveProfile(uid: string, profile: TProfile): Promise<void>;
  cleanup(): Promise<void>;
  track(event: RegistrationEvent): void;
}

export class RegistrationFlowError extends Error {
  constructor(
    message: string,
    readonly stage: "account" | "profile",
    readonly errorCode: string,
    readonly correlationId: string,
    readonly accountCreated: boolean,
  ) {
    super(message);
    this.name = "RegistrationFlowError";
  }
}

function safeErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (
      typeof code === "string" &&
      (/^auth\/[a-z-]+$/.test(code) ||
        /^firestore\/[a-z-]+$/.test(code) ||
        ["permission-denied", "unavailable", "deadline-exceeded", "resource-exhausted"].includes(code))
    ) return code;
  }
  return "unknown-error";
}

export async function completeRegistration<TProfile>(args: {
  email: string;
  password: string;
  profile: TProfile;
  correlationId: string;
  dependencies: RegistrationFlowDependencies<TProfile>;
}): Promise<{ uid: string; correlationId: string }> {
  const { email, password, profile, correlationId, dependencies } = args;
  let accountCreated = false;
  const track = (event: RegistrationEvent) => {
    try {
      dependencies.track(event);
    } catch {
      // Telemetry must never change the outcome of the registration.
    }
  };

  track({ correlationId, stage: "registration_started" });

  try {
    try {
      await dependencies.prepare();
    } catch (error) {
      const errorCode = safeErrorCode(error);
      const failure = new RegistrationFlowError(
        "Não foi possível preparar a sessão segura do cadastro.",
        "account",
        errorCode,
        correlationId,
        false,
      );
      track({ correlationId, stage: "registration_failed", errorCode });
      throw failure;
    }

    let uid: string;
    try {
      const account = await dependencies.createAccount(email, password);
      accountCreated = true;
      uid = account.uid;
      if (!uid) throw new Error("missing-uid");
      track({ correlationId, stage: "account_created" });
    } catch (error) {
      const errorCode = safeErrorCode(error);
      const failure = new RegistrationFlowError(
        "Não foi possível criar a conta.",
        "account",
        errorCode,
        correlationId,
        accountCreated,
      );
      track({ correlationId, stage: "registration_failed", errorCode });
      throw failure;
    }

    try {
      await dependencies.saveProfile(uid, profile);
      track({ correlationId, stage: "profile_saved" });
    } catch (error) {
      const errorCode = safeErrorCode(error);
      const failure = new RegistrationFlowError(
        "A conta foi criada, mas não foi possível salvar o cadastro.",
        "profile",
        errorCode,
        correlationId,
        true,
      );
      track({ correlationId, stage: "registration_failed", errorCode });
      throw failure;
    }

    track({ correlationId, stage: "registration_completed" });
    return { uid, correlationId };
  } finally {
    try {
      await dependencies.cleanup();
    } catch (error) {
      track({
        correlationId,
        stage: "registration_cleanup_failed",
        errorCode: safeErrorCode(error),
      });
      // Cleanup failure must never turn a successfully persisted profile into
      // a reported registration failure. The registration Auth is isolated.
    }
  }
}
