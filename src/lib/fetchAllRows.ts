/**
 * O Supabase devolve no máximo 1000 linhas por consulta. Recebimentos e custos já passam
 * disso (vêm da planilha, mês a mês), então quem precisa de "tudo" busca em lotes.
 * `build(from, to)` deve montar a consulta com uma ordem estável (ex.: .order("id")) e aplicar .range(from, to).
 */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}
