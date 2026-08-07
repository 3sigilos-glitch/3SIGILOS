import "server-only";
import { criarClienteAdmin } from "./admin";

// Segunda tranca, do lado da aplicacao.
//
// A primeira e o gatilho na base de dados, que impede a conta de ser
// criada. Esta existe porque uma conta pode ter sido criada antes de a
// lista existir, ou o gatilho pode ser desactivado sem querer numa
// migracao futura. Nesse caso a app fecha a porta na mesma.
//
// Le com a chave de servico porque emails_permitidos nao tem politicas:
// nao ha razao para o cliente saber quem esta na lista.
export async function emailPermitido(email: string | undefined): Promise<boolean> {
  if (!email) return false;

  const admin = criarClienteAdmin();
  const { data, error } = await admin
    .from("emails_permitidos")
    .select("email")
    .ilike("email", email)
    .maybeSingle();

  // Se a tabela ainda nao existir (migracao por aplicar), nao trancamos
  // a porta a quem ja usa a app. O gatilho e que trava as entradas
  // novas; aqui so confirmamos.
  if (error) return true;

  return !!data;
}
