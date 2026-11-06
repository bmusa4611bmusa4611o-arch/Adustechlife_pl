"use strict";

(() => {
  const config = window.ADUSTECHLIFE_SUPABASE_CONFIG || {};
  const sessionKey = "adustechlife.auth.session";
  const configured = Boolean(
    typeof config.url === "string" &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url) &&
    typeof config.anonKey === "string" &&
    config.anonKey.length > 20
  );
  const baseUrl = configured ? config.url.replace(/\/$/, "") : "";

  function authErrorMessage(body, status) {
    const message = body?.msg || body?.message || body?.error_description || body?.error;
    if (status === 400 && /invalid login credentials/i.test(message || "")) {
      return "Email or password is incorrect.";
    }
    if (status === 429) return "Too many attempts. Wait a little and try again.";
    return message || `The authentication request failed (${status}).`;
  }

  async function request(path, { method = "GET", body, accessToken } = {}) {
    if (!configured) {
      throw new Error("Supabase is not configured. Add the project URL and publishable key in js/supabase-config.js.");
    }
    const headers = { apikey: config.anonKey };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      credentials: "omit"
    });
    const responseText = await response.text();
    let responseBody = null;
    if (responseText) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = { message: responseText };
      }
    }
    if (!response.ok) throw new Error(authErrorMessage(responseBody, response.status));
    return responseBody;
  }

  function saveSession(response) {
    if (!response?.access_token || !response?.refresh_token) return null;
    const session = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: response.expires_at || Math.floor(Date.now() / 1000) + (response.expires_in || 3600),
      user: response.user || null
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    return session;
  }

  function consumeAuthCallback() {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    if (accessToken && refreshToken) {
      saveSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: Number(fragment.get("expires_in")) || 3600,
        token_type: fragment.get("token_type") || "bearer"
      });
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
      return fragment.get("type") === "recovery" ? "recovery" : "session";
    }

    const errorDescription = fragment.get("error_description");
    if (errorDescription) {
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
      throw new Error(errorDescription);
    }
    return null;
  }

  function readSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
      if (session?.accessToken && session?.refreshToken) return session;
    } catch {
      sessionStorage.removeItem(sessionKey);
    }
    return null;
  }

  async function refreshSession(session) {
    const response = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: session.refreshToken }
    });
    return saveSession(response);
  }

  async function getValidSession() {
    let session = readSession();
    if (!session) return null;
    if (session.expiresAt <= Math.floor(Date.now() / 1000) + 60) {
      session = await refreshSession(session);
    }
    return session;
  }

  async function getProfile(session) {
    const query = new URLSearchParams({
      select: "user_id,full_name,username,role,institution_id",
      user_id: `eq.${session.user.id}`,
      limit: "1"
    });
    const profiles = await request(`/rest/v1/profiles?${query}`, {
      accessToken: session.accessToken
    });
    if (!Array.isArray(profiles) || !profiles[0]) {
      throw new Error("Your account is signed in, but its campus profile was not found. Contact an administrator.");
    }
    return profiles[0];
  }

  async function getCurrentUser() {
    const session = await getValidSession();
    if (!session) return null;
    try {
      const user = await request("/auth/v1/user", { accessToken: session.accessToken });
      session.user = user;
      sessionStorage.setItem(sessionKey, JSON.stringify(session));
      const profile = await getProfile(session);
      return { session, user, profile };
    } catch (error) {
      if (/invalid jwt|expired/i.test(error.message)) sessionStorage.removeItem(sessionKey);
      throw error;
    }
  }

  async function signUp({ email, password, fullName, username }) {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const response = await request(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      body: {
        email,
        password,
        data: { full_name: fullName, username }
      }
    });
    const session = saveSession(response);
    return { session, user: response?.user || null, confirmationRequired: !session };
  }

  async function signIn(email, password) {
    const response = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password }
    });
    const session = saveSession(response);
    if (!session) throw new Error("Sign-in did not return a session. Check the email confirmation settings.");
    return { session, user: response.user };
  }

  async function sendPasswordReset(email) {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    await request(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      body: { email }
    });
  }

  async function updatePassword(password) {
    const session = await getValidSession();
    if (!session) throw new Error("Your password-reset session has expired. Request a new reset link.");
    const response = await request("/auth/v1/user", {
      method: "PUT",
      body: { password },
      accessToken: session.accessToken
    });
    sessionStorage.removeItem(sessionKey);
    return response;
  }

  async function signOut() {
    const session = readSession();
    if (!session) return;
    try {
      await request("/auth/v1/logout", {
        method: "POST",
        accessToken: session.accessToken
      });
    } finally {
      sessionStorage.removeItem(sessionKey);
    }
  }

  async function listInstitutionProfiles(session, institutionId) {
    const query = new URLSearchParams({
      select: "user_id,full_name,username,role,created_at",
      institution_id: `eq.${institutionId}`,
      order: "created_at.desc",
      limit: "100"
    });
    return request(`/rest/v1/profiles?${query}`, {
      accessToken: session.accessToken
    });
  }

  async function listAdminAuditLogs(session, institutionId) {
    const query = new URLSearchParams({
      select: "id,actor_user_id,target_user_id,action,details,created_at",
      institution_id: `eq.${institutionId}`,
      order: "created_at.desc",
      limit: "50"
    });
    return request(`/rest/v1/admin_audit_logs?${query}`, {
      accessToken: session.accessToken
    });
  }

  async function updateMemberRole(session, institutionId, userId, role) {
    return request("/rest/v1/rpc/admin_update_member_role", {
      method: "POST",
      body: {
        target_institution_id: institutionId,
        target_user_id: userId,
        new_role: role
      },
      accessToken: session.accessToken
    });
  }

  window.AdustechAuth = Object.freeze({
    configured,
    consumeAuthCallback,
    getCurrentUser,
    signUp,
    signIn,
    sendPasswordReset,
    updatePassword,
    signOut,
    listInstitutionProfiles,
    listAdminAuditLogs,
    updateMemberRole
  });
})();
