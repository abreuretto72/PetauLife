import { createSupabaseServerClient } from '@/lib/supabase-server';
import { PageError } from '@/components/page-error';
import { fmtUSD } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  type AdminTotalCosts,
  type CostCategory,
} from '@/lib/types';
import { CostsManager } from './costs-manager';

export const dynamic = 'force-dynamic';

const CATEGORY_COLORS: Record<CostCategory, string> = {
  infrastructure: 'text-jade',
  platform:       'text-warning',
  development:    'text-ametista',
  labor:          'text-text',
  equipment:      'text-text-muted',
  training:       'text-success',
  other:          'text-text-dim',
};

export default async function CostsPage() {
  const supabase = await createSupabaseServerClient();
  const [costsRpc, tutorsCountRes] = await Promise.all([
    supabase.rpc('get_admin_total_costs'),
    // Tutores ativos hoje — denominador pra estimar custo IA por assinante.
    // Usar `head: true, count: 'exact'` evita trazer linhas, só metadado.
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'tutor_owner')
      .eq('is_active', true),
  ]);

  if (costsRpc.error) return <PageError pagePath="/costs" techMessage={costsRpc.error.message} />;

  const d = costsRpc.data as AdminTotalCosts;
  const activeTutors = tutorsCountRes.count ?? 0;

  // Sorted breakdown por categoria (descendente)
  const byCategory = Object.entries(d.by_category)
    .map(([k, v]) => ({ category: k as CostCategory, total: Number(v ?? 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const byVendor = Object.entries(d.by_vendor)
    .map(([k, v]) => ({ vendor: k, total: Number(v ?? 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const grandTotalAnnual = Number(d.grand_total_usd) * 12;

  // ── Break-even com custo variável ────────────────────────────────────────
  // Fórmula: N × preço = Fixo + (Variável_per_user × N)
  //          → N = ceil(Fixo / (preço − Variável_per_user))
  // Variável_per_user é estimado dividindo a IA do mês corrente pelo número
  // de tutores ativos. Amostra pequena (poucos beta-testers) infla esse valor;
  // exibimos a estimativa explícita pra o admin julgar.
  const fixedTotalUsd =
    Number(d.fixed_monthly_usd) + Number(d.one_time_paid_this_month_usd);
  const variableAiUsd = Number(d.variable_ai_usd);
  const aiPerUser = activeTutors > 0 ? variableAiUsd / activeTutors : 0;

  const ELITE_MARGIN = 1.7;

  const scenarios = [
    { price: 50, label: 'Premium (US$ 50/mês)' },
    { price: 30, label: 'Médio (US$ 30/mês)' },
    { price: 20, label: 'Acessível (US$ 20/mês)' },
    { price: 10, label: 'Massa (US$ 10/mês)' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl mb-2">Custo total da infraestrutura</h1>
        <p className="text-text-muted">
          Fixos + variáveis (IA) consolidados em USD. Período: {String(d.period.year)}-{String(d.period.month).padStart(2, '0')}
        </p>
      </header>

      {/* Hero — total mensal */}
      <section className="bg-gradient-to-br from-bg-card to-bg-deep border border-border rounded-2xl p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-text-muted text-xs uppercase tracking-widest font-medium mb-2">
              Custo mensal total
            </div>
            <div className="font-display text-6xl text-text">
              {fmtUSD(Number(d.grand_total_usd))}
            </div>
            <div className="text-text-dim text-sm mt-2 font-mono">
              Anualizado: {fmtUSD(grandTotalAnnual)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 text-right">
            <div>
              <div className="text-text-dim text-[10px] uppercase tracking-widest">Fixos</div>
              <div className="font-mono text-xl text-text mt-1">{fmtUSD(Number(d.fixed_monthly_usd))}</div>
            </div>
            <div>
              <div className="text-text-dim text-[10px] uppercase tracking-widest">Únicos no mês</div>
              <div className="font-mono text-xl text-text mt-1">{fmtUSD(Number(d.one_time_paid_this_month_usd))}</div>
            </div>
            <div>
              <div className="text-text-dim text-[10px] uppercase tracking-widest">IA variável</div>
              <div className="font-mono text-xl text-jade mt-1">{fmtUSD(Number(d.variable_ai_usd))}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Por categoria */}
      <section>
        <h2 className="text-ametista text-xs uppercase tracking-wider font-medium mb-3">
          Por categoria (custos fixos recorrentes)
        </h2>
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-deep text-text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left  p-4 font-medium">Categoria</th>
                <th className="text-right p-4 font-medium">Mensal USD</th>
                <th className="text-right p-4 font-medium">% do total fixo</th>
                <th className="p-4 font-medium w-[40%]">Distribuição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byCategory.map(row => {
                const pct = (row.total / Number(d.fixed_monthly_usd)) * 100;
                return (
                  <tr key={row.category} className="hover:bg-bg-deep/40">
                    <td className={`p-4 font-medium ${CATEGORY_COLORS[row.category] ?? 'text-text'}`}>
                      {CATEGORY_LABELS[row.category]}
                    </td>
                    <td className="p-4 text-right font-mono">{fmtUSD(row.total)}</td>
                    <td className="p-4 text-right font-mono text-text-muted">
                      {pct.toFixed(1)}%
                    </td>
                    <td className="p-4">
                      <div className="h-2 bg-bg-deep rounded-full overflow-hidden">
                        <div
                          className="h-full bg-jade/60"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cenarios de assinatura — fórmula com custo fixo + variável + lucro */}
      <section>
        <h2 className="text-ametista text-xs uppercase tracking-wider font-medium mb-3">
          Break-even por cenário de assinatura
        </h2>
        <p className="text-text-muted text-sm mb-2">
          O preço de cada plano cobre <strong>custo fixo</strong> ({fmtUSD(fixedTotalUsd)}) +{' '}
          <strong>custo variável de IA</strong> por assinante (~{fmtUSD(aiPerUser)}/mês,{' '}
          estimado a partir de {activeTutors} tutor{activeTutors === 1 ? '' : 'es'} ativo{activeTutors === 1 ? '' : 's'}) +{' '}
          <strong>lucro</strong>. A margem Elite é 1,7× sobre o break-even.
        </p>
        <p className="text-text-dim text-xs mb-3">
          Fórmula: N = ⌈Fixo / (preço − var/user)⌉. Cenários onde var/user ≥ preço são marcados como inviáveis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {scenarios.map(s => {
            // Margem unitária: o que sobra de cada assinante depois de pagar o IA dele.
            const unitMargin = s.price - aiPerUser;

            if (unitMargin <= 0) {
              return (
                <div key={s.price} className="bg-bg-card border border-danger/40 rounded-xl p-5">
                  <div className="text-text-dim text-xs uppercase tracking-widest mb-2">{s.label}</div>
                  <div className="font-display text-xl text-danger">Inviável</div>
                  <div className="text-xs text-text-muted mt-2">
                    Custo IA por assinante ({fmtUSD(aiPerUser)}) excede ou iguala o preço do plano.
                    Reduza custos de IA ou aumente o preço.
                  </div>
                </div>
              );
            }

            // Break-even real: cobre fixo após sobrar margem unitária por assinante.
            const breakeven = Math.ceil(fixedTotalUsd / unitMargin);
            const withMargin = Math.ceil(breakeven * ELITE_MARGIN);

            const breakevenRevenue = breakeven * s.price;
            const breakevenVarCost = breakeven * aiPerUser;
            const breakevenTotalCost = fixedTotalUsd + breakevenVarCost;

            const eliteRevenue = withMargin * s.price;
            const eliteVarCost = withMargin * aiPerUser;
            const eliteTotalCost = fixedTotalUsd + eliteVarCost;
            const eliteProfit = eliteRevenue - eliteTotalCost;

            return (
              <div key={s.price} className="bg-bg-card border border-border rounded-xl p-5">
                <div className="text-text-dim text-xs uppercase tracking-widest mb-2">{s.label}</div>

                {/* Break-even */}
                <div className="font-mono text-2xl text-text">{breakeven.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-text-muted mt-1">assinantes break-even</div>
                <div className="text-[11px] text-text-dim mt-1.5 space-y-0.5">
                  <div>Receita: <span className="font-mono text-text-muted">{fmtUSD(breakevenRevenue)}</span></div>
                  <div>Custo total: <span className="font-mono text-text-muted">{fmtUSD(breakevenTotalCost)}</span></div>
                  <div>(fixo {fmtUSD(fixedTotalUsd)} + IA {fmtUSD(breakevenVarCost)})</div>
                </div>

                {/* Margem Elite */}
                <div className="border-t border-border mt-3 pt-3">
                  <div className="font-mono text-lg text-jade">{withMargin.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-text-dim mt-0.5">com margem 1,7× (Elite)</div>
                  <div className="text-[11px] text-text-dim mt-1.5 space-y-0.5">
                    <div>Receita: <span className="font-mono text-jade">{fmtUSD(eliteRevenue)}</span></div>
                    <div>Custo total: <span className="font-mono text-text-muted">{fmtUSD(eliteTotalCost)}</span></div>
                    <div>Lucro líquido: <span className="font-mono text-jade font-bold">{fmtUSD(eliteProfit)}</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lista de itens — editável inline */}
      <CostsManager items={d.items} />

      {/* Por vendor */}
      {byVendor.length > 0 && (
        <section>
          <h2 className="text-ametista text-xs uppercase tracking-wider font-medium mb-3">
            Por vendor
          </h2>
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-deep text-text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left  p-4 font-medium">Vendor</th>
                  <th className="text-right p-4 font-medium">Mensal USD</th>
                  <th className="text-right p-4 font-medium">Anualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byVendor.map(v => (
                  <tr key={v.vendor} className="hover:bg-bg-deep/40">
                    <td className="p-4 font-medium">{v.vendor}</td>
                    <td className="p-4 text-right font-mono">{fmtUSD(v.total)}</td>
                    <td className="p-4 text-right font-mono text-text-muted">{fmtUSD(v.total * 12)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="text-text-dim text-xs italic text-center pt-4">
        Edição inline: clique no lápis ao lado de cada item, ou em "Adicionar custo" pra incluir um novo.
        Para BRL/EUR/etc., informe o valor na moeda original e a cotação — o USD é calculado automaticamente.
      </p>
    </div>
  );
}
