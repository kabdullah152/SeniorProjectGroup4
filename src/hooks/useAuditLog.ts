import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuditAction =
  | "data_access"
  | "data_export"
  | "data_delete"
  | "ai_parse"
  | "ai_quiz_generate"
  | "consent_granted"
  | "consent_revoked"
  | "account_delete";

export const useAuditLog = () => {
  const log = useCallback(
    async (
      action: AuditAction,
      entityType: string,
      entityId?: string,
      metadata?: Record<string, unknown>
    ) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        metadata: metadata || {},
      } as any);
    },
    []
  );

  return { log };
};
