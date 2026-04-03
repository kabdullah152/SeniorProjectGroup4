import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const CURRENT_CONSENT_VERSION = "1.0";

export const useConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkConsent = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("consent_records")
      .select("id, granted")
      .eq("user_id", session.user.id)
      .eq("consent_type", "data_processing")
      .eq("consent_version", CURRENT_CONSENT_VERSION)
      .eq("granted", true)
      .is("revoked_at", null)
      .maybeSingle() as any;

    setHasConsented(!!data);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkConsent();
  }, [checkConsent]);

  const grantConsent = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase.from("consent_records").insert({
      user_id: session.user.id,
      consent_type: "data_processing",
      consent_version: CURRENT_CONSENT_VERSION,
      granted: true,
      metadata: {
        terms: [
          "AI-powered syllabus and assignment parsing",
          "Personalized quiz and exercise generation",
          "Learning style adaptation",
          "Data stored securely with encryption at rest",
        ],
        regulations: ["GDPR", "FERPA"],
      },
    } as any);

    if (!error) {
      setHasConsented(true);

      // Also log consent to audit trail
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "consent_granted",
        entity_type: "consent_records",
        metadata: { consent_type: "data_processing", version: CURRENT_CONSENT_VERSION },
      } as any);
    }

    return !error;
  }, []);

  const revokeConsent = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase
      .from("consent_records")
      .update({ revoked_at: new Date().toISOString() } as any)
      .eq("user_id", session.user.id)
      .eq("consent_type", "data_processing")
      .eq("granted", true)
      .is("revoked_at", null);

    if (!error) {
      setHasConsented(false);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "consent_revoked",
        entity_type: "consent_records",
        metadata: { consent_type: "data_processing", version: CURRENT_CONSENT_VERSION },
      } as any);
    }

    return !error;
  }, []);

  return { hasConsented, loading, grantConsent, revokeConsent, consentVersion: CURRENT_CONSENT_VERSION };
};
