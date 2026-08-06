import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Role = "admin" | "member" | "guest";
type Level = "view" | "comment" | "edit";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Token inválido" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Só admins do módulo de tarefas podem convidar/alterar papéis
    const { data: callerMember } = await admin
      .from("task_members")
      .select("id, role")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (!callerMember || callerMember.role !== "admin") {
      return json({ error: "Apenas administradores de tarefas podem gerenciar membros" }, 403);
    }

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Corpo inválido" }, 400);

    const memberId: string | null = body.member_id ?? null;
    const name: string = (body.name ?? "").toString().trim();
    const email: string = (body.email ?? "").toString().trim().toLowerCase();
    const color: string | null = body.color ?? null;
    const role: Role | null = body.role ?? null;
    const spaceIds: string[] = Array.isArray(body.space_ids) ? body.space_ids : [];
    const level: Level = (body.permission_level ?? "view") as Level;
    const sendInvite: boolean = body.send_invite !== false;
    const redirectTo: string = body.redirect_to ?? "";

    if (!name) return json({ error: "Nome é obrigatório" }, 400);
    if (role && !["admin", "member", "guest"].includes(role)) {
      return json({ error: "Papel inválido" }, 400);
    }
    if (role && !email) return json({ error: "E-mail é obrigatório para conceder acesso" }, 400);
    if (role === "guest" && spaceIds.length === 0) {
      return json({ error: "Selecione ao menos um espaço para o convidado" }, 400);
    }
    if (!["view", "comment", "edit"].includes(level)) {
      return json({ error: "Nível de permissão inválido" }, 400);
    }

    // 1) Garante o usuário de autenticação quando há papel definido
    let authUserId: string | null = null;
    let invited = false;

    if (role && email) {
      const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        email,
        redirectTo ? { redirectTo } : undefined,
      );

      if (invite?.user) {
        authUserId = invite.user.id;
        invited = true;
      } else {
        // Usuário provavelmente já existe — localiza pelo e-mail
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
        if (!found) {
          return json(
            { error: `Não foi possível convidar ${email}: ${inviteError?.message ?? "erro desconhecido"}` },
            400,
          );
        }
        authUserId = found.id;
      }
    }

    // 2) Cria/atualiza o task_member
    const payload: Record<string, unknown> = { name, email: email || null, role };
    if (color) payload.color = color;
    if (authUserId) payload.auth_user_id = authUserId;

    let finalMemberId = memberId;
    if (memberId) {
      const { error } = await admin.from("task_members").update(payload).eq("id", memberId);
      if (error) return json({ error: error.message }, 400);
    } else {
      const { data, error } = await admin.from("task_members").insert(payload).select("id").single();
      if (error) return json({ error: error.message }, 400);
      finalMemberId = data.id;
    }

    // 3) Acessos por espaço (somente convidados)
    if (finalMemberId) {
      await admin.from("task_space_access").delete().eq("task_member_id", finalMemberId);
      if (role === "guest" && spaceIds.length > 0) {
        const rows = spaceIds.map((space_id) => ({
          task_member_id: finalMemberId,
          space_id,
          permission_level: level,
          granted_by: callerMember.id,
        }));
        const { error } = await admin.from("task_space_access").insert(rows);
        if (error) return json({ error: error.message }, 400);
      }
    }

    return json({ success: true, member_id: finalMemberId, invited });
  } catch (e) {
    console.error("tasks-invite-member error", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});
