"use client";

import { useState, useEffect, useActionState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitJoinRequest } from "@/app/(userPage)/dashboard/organization/join/actions";
import { FormError } from "@/components/ui/form-error";

async function fetchMembershipStatus(supabase, userId) {
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membership) {
    return { type: "active", organizationName: membership.organizations?.name };
  }

  const { data: request } = await supabase
    .from("organization_join_requests")
    .select("organization_id, organizations(name)")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (request) {
    return { type: "pending", organizationName: request.organizations?.name };
  }

  return { type: "none" };
}

export default function OrganizationJoin() {
  const [status, setStatus] = useState(null);
  const [state, action, isPending] = useActionState(submitJoinRequest, null);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setStatus(await fetchMembershipStatus(supabase, user.id));
    };
    load();
  }, [state?.success]);

  if (!status) return null;

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-4">組織への参加</h3>

      {status.type === "active" && (
        <p className="text-sm text-gray-700">
          「{status.organizationName}」のメンバーです。面談確定時は組織の共有クレジットが使われます。
        </p>
      )}

      {status.type === "pending" && (
        <p className="text-sm text-gray-700">
          「{status.organizationName}」への参加を申請中です。組織の管理者の承認をお待ちください。
        </p>
      )}

      {status.type === "none" && (
        <>
          <FormError message={state?.error} />
          {state?.success ? (
            <p className="text-sm text-green-600">
              「{state.organizationName}」への参加を申請しました。組織の管理者の承認をお待ちください。
            </p>
          ) : (
            <form action={action} className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor="code" className="block text-sm font-medium mb-2">
                  組織コード
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black uppercase"
                  placeholder="例: AB12CD34"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isPending ? "申請中..." : "参加を申請"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
