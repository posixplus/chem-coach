function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Missing env var ${name}`);
  return v;
}

export const env = {
  supabaseUrl: () => req("SUPABASE_URL"),
  supabaseServiceKey: () => req("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicKey: () => req("ANTHROPIC_API_KEY"),
  claudeModel: () => process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
  authSecret: () => req("AUTH_SECRET"),
  studentPasscode: () => req("STUDENT_PASSCODE", "3600"),
  parentPasscode: () => req("PARENT_PASSCODE", "2791"),
  studentName: () => process.env.STUDENT_NAME || "Sachin",
  parentName: () => process.env.PARENT_NAME || "Jay",
  timezone: () => process.env.APP_TIMEZONE || "America/New_York",
  resendKey: () => process.env.RESEND_API_KEY || "",
  digestTo: () => process.env.DIGEST_EMAIL_TO || "",
  digestFrom: () => process.env.DIGEST_EMAIL_FROM || "Study Coach <onboarding@resend.dev>",
  cronSecret: () => process.env.CRON_SECRET || "",
  appUrl: () => process.env.APP_URL || "",
};
