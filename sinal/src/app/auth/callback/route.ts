import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { guardarRefreshToken } from "@/lib/google/tokens";

// Callback de OAuth. A Google devolve aqui um codigo, que trocamos por
// uma sessao Supabase. Nesse momento, e so nesse, a Supabase entrega o
// provider_refresh_token da Google, que guardamos em tokens_google para
// podermos escrever no calendario mais tarde sem novo consentimento.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const proximo = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/?erro=sem_codigo`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?erro=sessao`);
  }

  // Guardar o refresh token da Google, se veio. So vem na primeira
  // autorizacao (por isso pedimos prompt=consent no arranque).
  const userId = data.session?.user?.id;
  const refreshToken = data.session?.provider_refresh_token;
  if (userId && refreshToken) {
    try {
      await guardarRefreshToken(
        userId,
        refreshToken,
        "https://www.googleapis.com/auth/calendar.events"
      );
    } catch {
      // Se falhar a gravacao do token, a sessao continua valida.
      // O calendario pode ser religado mais tarde entrando de novo.
    }
  }

  return NextResponse.redirect(`${origin}${proximo}`);
}
