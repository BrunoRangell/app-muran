import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Validate caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with caller's token to check admin
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await callerClient.auth.getUser();
    if (claimsError || !claimsData.user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.user.id;

    // Check if caller is admin
    const { data: roleData } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem cadastrar membros" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    const { name, email, role, password } = await req.json();
    if (!name || !email || !role || !password) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: name, email, role, password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try to create auth user
    let userId: string;

    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (createError) {
      if (createError.message?.includes("already been registered") || createError.status === 422) {
        // User exists in auth, get their ID
        const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });

        if (listError) {
          console.error("Erro ao buscar usuários:", listError);
          return new Response(JSON.stringify({ error: "Erro ao buscar usuário existente" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // listUsers doesn't filter by email, so we need to search
        const { data: allUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingUser = allUsers?.users?.find((u) => u.email === email);

        if (!existingUser) {
          return new Response(JSON.stringify({ error: "Usuário reportado como existente mas não encontrado" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        userId = existingUser.id;
        console.log(`Usuário já existe no auth: ${userId}, vinculando à equipe`);
      } else {
        console.error("Erro ao criar usuário:", createError);
        return new Response(JSON.stringify({ error: `Erro ao criar usuário: ${createError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      userId = createData.user.id;
      console.log(`Novo usuário criado: ${userId}`);
    }

    // Check if already in team_members
    const { data: existingMember } = await adminClient
      .from("team_members")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingMember) {
      return new Response(JSON.stringify({ error: "Este email já está cadastrado na equipe" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert team member
    const { error: memberError } = await adminClient
      .from("team_members")
      .insert({
        name,
        email,
        role,
        manager_id: userId,
      });

    if (memberError) {
      console.error("Erro ao inserir team_member:", memberError);
      return new Response(JSON.stringify({ error: `Erro ao criar membro: ${memberError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert user_role (ignore if already exists)
    const { error: roleError } = await adminClient
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "member", granted_by: callerId },
        { onConflict: "user_id,role" }
      );

    if (roleError) {
      console.error("Erro ao inserir role (não crítico):", roleError);
    }

    console.log(`Membro ${name} (${email}) cadastrado com sucesso`);

    return new Response(
      JSON.stringify({ success: true, message: "Membro cadastrado com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro inesperado:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
