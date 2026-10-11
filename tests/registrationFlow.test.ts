import assert from "node:assert/strict";
import { test } from "node:test";
import {
  completeRegistration,
  criarOuRecuperarConta,
  RegistrationFlowError,
  type RegistrationEvent,
  type RegistrationFlowDependencies,
} from "../src/services/registrationFlow";

function createDependencies(overrides: Partial<RegistrationFlowDependencies<{ name: string }>> = {}) {
  const events: RegistrationEvent[] = [];
  const calls = { prepare: 0, create: 0, save: 0, cleanup: 0 };
  const dependencies: RegistrationFlowDependencies<{ name: string }> = {
    prepare: async () => { calls.prepare++; },
    createAccount: async () => { calls.create++; return { uid: "test-uid" }; },
    saveProfile: async () => { calls.save++; },
    cleanup: async () => { calls.cleanup++; },
    track: (event) => { events.push(event); },
    ...overrides,
  };
  return { dependencies, events, calls };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test("só confirma cadastro depois da gravação, mesmo com perfil lento", async () => {
  const saveStarted = deferred<void>();
  const saveGate = deferred<void>();
  const { dependencies, events, calls } = createDependencies({
    saveProfile: async () => { calls.save++; saveStarted.resolve(); await saveGate.promise; },
  });
  let settled = false;
  const registration = completeRegistration({
    email: "privado@example.invalid",
    password: "not-logged",
    profile: { name: "not-logged" },
    correlationId: "correlation-1",
    dependencies,
  }).then((value) => { settled = true; return value; });

  await saveStarted.promise;
  assert.equal(settled, false);
  assert.equal(calls.cleanup, 0);
  saveGate.resolve();
  assert.deepEqual(await registration, { uid: "test-uid", correlationId: "correlation-1" });
  assert.equal(calls.cleanup, 1);
  assert.deepEqual(events.map((event) => event.stage), [
    "registration_started", "account_created", "profile_saved", "registration_completed",
  ]);
  assert.equal(JSON.stringify(events).includes("example.invalid"), false);
});

test("e-mail já utilizado não tenta gravar perfil e encerra a sessão isolada", async () => {
  const { dependencies, calls, events } = createDependencies({
    createAccount: async () => { calls.create++; throw { code: "auth/email-already-in-use" }; },
  });
  await assert.rejects(
    completeRegistration({ email: "x", password: "x", profile: { name: "x" }, correlationId: "id", dependencies }),
    (error: unknown) => error instanceof RegistrationFlowError && error.errorCode === "auth/email-already-in-use",
  );
  assert.equal(calls.save, 0);
  assert.equal(calls.cleanup, 1);
  assert.equal(events.at(-1)?.stage, "registration_failed");
});

test("recupera uma conta Auth sem perfil somente após autenticação da própria pessoa", async () => {
  const calls = { create: 0, authenticate: 0, profileCheck: 0 };
  const account = await criarOuRecuperarConta("x", "password", {
    criarContaNova: async () => { calls.create++; throw { code: "auth/email-already-in-use" }; },
    autenticarContaExistente: async () => { calls.authenticate++; return { uid: "existing-uid" }; },
    possuiPerfil: async () => { calls.profileCheck++; return false; },
  });

  assert.deepEqual(account, { uid: "existing-uid", created: false });
  assert.deepEqual(calls, { create: 1, authenticate: 1, profileCheck: 1 });
});

test("não sobrescreve perfil existente nem tenta recuperar com senha inválida", async () => {
  const profileExists = await criarOuRecuperarConta("x", "password", {
    criarContaNova: async () => { throw { code: "auth/email-already-in-use" }; },
    autenticarContaExistente: async () => ({ uid: "existing-uid" }),
    possuiPerfil: async () => true,
  }).catch((error: unknown) => error);
  assert.equal((profileExists as { code?: string }).code, "auth/profile-already-exists");

  let profileChecks = 0;
  const invalidCredential = await criarOuRecuperarConta("x", "wrong", {
    criarContaNova: async () => { throw { code: "auth/email-already-in-use" }; },
    autenticarContaExistente: async () => { throw { code: "auth/invalid-credential" }; },
    possuiPerfil: async () => { profileChecks++; return false; },
  }).catch((error: unknown) => error);
  assert.equal((invalidCredential as { code?: string }).code, "auth/invalid-credential");
  assert.equal(profileChecks, 0);
});

test("conta recuperada é registrada como reutilizada e recebe o perfil enviado", async () => {
  const { dependencies, events } = createDependencies({
    createAccount: async () => ({ uid: "existing-uid", created: false }),
  });
  const result = await completeRegistration({
    email: "x", password: "x", profile: { name: "x" }, correlationId: "recovery", dependencies,
  });

  assert.equal(result.uid, "existing-uid");
  assert.deepEqual(events.map((event) => event.stage), [
    "registration_started", "account_reused", "profile_saved", "registration_completed",
  ]);
});

test("falha de perfil preserva a conta e não executa rollback destrutivo", async () => {
  const { dependencies, calls, events } = createDependencies({
    saveProfile: async () => { calls.save++; throw { code: "permission-denied", message: "private detail" }; },
  });
  await assert.rejects(
    completeRegistration({ email: "x", password: "x", profile: { name: "x" }, correlationId: "id", dependencies }),
    (error: unknown) => error instanceof RegistrationFlowError &&
      error.stage === "profile" && error.accountCreated && error.errorCode === "permission-denied",
  );
  assert.equal(calls.create, 1);
  assert.equal(calls.cleanup, 1);
  assert.equal(events.some((event) => JSON.stringify(event).includes("private detail")), false);
});

test("falha ao limpar autenticação secundária não invalida um perfil salvo", async () => {
  const { dependencies, events } = createDependencies({
    cleanup: async () => { throw { code: "auth/network-request-failed" }; },
  });
  const result = await completeRegistration({
    email: "x", password: "x", profile: { name: "x" }, correlationId: "id", dependencies,
  });
  assert.equal(result.uid, "test-uid");
  assert.equal(events.at(-1)?.stage, "registration_cleanup_failed");
});

test("se uma conta criada sem perfil for tentada de novo, erro de e-mail em uso é mantido e não apaga conta", async () => {
  let firstAttempt = true;
  const deletions = 0;
  const dependencies = createDependencies({
    createAccount: async () => {
      if (firstAttempt) { firstAttempt = false; return { uid: "orphan-uid" }; }
      throw { code: "auth/email-already-in-use" };
    },
    saveProfile: async () => { throw { code: "unavailable" }; },
  }).dependencies;
  const result = await completeRegistration({
    email: "x", password: "x", profile: { name: "x" }, correlationId: "first", dependencies,
  }).catch((error: unknown) => error);
  assert.ok(result instanceof RegistrationFlowError && result.accountCreated);

  await assert.rejects(
    completeRegistration({ email: "x", password: "x", profile: { name: "x" }, correlationId: "retry", dependencies }),
    (error: unknown) => error instanceof RegistrationFlowError && error.errorCode === "auth/email-already-in-use",
  );
  assert.equal(deletions, 0);
});

test("erro ao preparar sessão não cria conta", async () => {
  const { dependencies, calls } = createDependencies({
    prepare: async () => { calls.prepare++; throw { code: "auth/network-request-failed" }; },
  });
  await assert.rejects(
    completeRegistration({ email: "x", password: "x", profile: { name: "x" }, correlationId: "id", dependencies }),
    (error: unknown) => error instanceof RegistrationFlowError && error.stage === "account",
  );
  assert.equal(calls.create, 0);
  assert.equal(calls.cleanup, 1);
});

test("UID ausente não confirma nem grava um perfil", async () => {
  const { dependencies, calls, events } = createDependencies({
    createAccount: async () => { calls.create++; return { uid: "" }; },
  });
  await assert.rejects(
    completeRegistration({ email: "x", password: "x", profile: { name: "x" }, correlationId: "id", dependencies }),
    (error: unknown) => error instanceof RegistrationFlowError && error.stage === "account",
  );
  assert.equal(calls.save, 0);
  assert.equal(calls.cleanup, 1);
  assert.equal(events.some((event) => event.stage === "registration_completed"), false);
});

test("erro de telemetria não bloqueia o cadastro", async () => {
  const { dependencies } = createDependencies({ track: () => { throw new Error("analytics unavailable"); } });
  const result = await completeRegistration({
    email: "x", password: "x", profile: { name: "x" }, correlationId: "id", dependencies,
  });
  assert.equal(result.uid, "test-uid");
});

test("falha do perfil nunca emite etapa de conclusão", async () => {
  const { dependencies, events } = createDependencies({
    saveProfile: async () => { throw { code: "unavailable" }; },
  });
  await assert.rejects(
    completeRegistration({ email: "x", password: "x", profile: { name: "x" }, correlationId: "id", dependencies }),
    RegistrationFlowError,
  );
  assert.deepEqual(events.map((event) => event.stage), [
    "registration_started", "account_created", "registration_failed",
  ]);
});

test("código de erro fica restrito e não inclui mensagem ou conteúdo da exceção", async () => {
  const { dependencies, events } = createDependencies({
    createAccount: async () => { throw { code: "auth/network-request-failed", message: "sensitive payload" }; },
  });
  await assert.rejects(
    completeRegistration({ email: "x", password: "x", profile: { name: "x" }, correlationId: "id", dependencies }),
  );
  assert.equal(JSON.stringify(events).includes("sensitive payload"), false);
  assert.equal(events.at(-1)?.errorCode, "auth/network-request-failed");
});
