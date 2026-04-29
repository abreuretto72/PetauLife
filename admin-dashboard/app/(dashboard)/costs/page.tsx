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

  // ── Break-even com custo variável + taxas + impostos ──────────────────────
  // Fórmula REAL:
  //   N × (preço × NET_REVENUE_RATE) = (Fixo + Var/user × N) × COST_MULTIPLIER
  //   → N = ceil((Fixo × COST_MULTIPLIER) / (preço_líquido − Var/user × COST_MULTIPLIER))
  //
  // ▸ RECEITA (descontos sobre o preço cheio até chegar no caixa):
  //   - Apple/Google Play: 15% (Small Business Program; 30% sem programa)
  //   - RevenueCat: 1% (acima de $2,5K MTR; antes disso é 0%)
  //   - Simples Nacional Anexo III faixa 1 (até R$ 180k/ano): 6%
  //     → Aplicado SOBRE o que entra na conta após Apple/Google/RC. A NF é
  //       emitida pelo valor líquido recebido (Apple/Google é compra direta
  //       do consumidor, não revenda). PIS/COFINS/ICMS/ISS/IRPJ/CSLL JÁ
  //       estão inclusos no DAS — não somar separado.
  //
  // ▸ CUSTO (impostos sobre infraestrutura paga em USD via cartão PJ):
  //   - IOF Câmbio cartão internacional 2026: 3,38%
  //     → Decreto 12.466/2025 reduz gradualmente: 3,88% (2025) → 3,38% (2026)
  //       → 2,88% (2027) → ... → 0% (2030).
  //   - IRRF 15% / CIDE 10% / PIS-COFINS Importação 9,25%: NÃO se aplicam
  //     em compras via cartão de crédito PJ (são pra remessa formal por
  //     wire/SWIFT). Confirmar com contador antes de mudar regime tributário.
  //
  // Mover pra app_config quando o app escalar e mudar de regime/faixa.
  const STORE_FEE_PCT = 0.15;
  const RC_FEE_PCT    = 0.01;
  const SIMPLES_PCT   = 0.06;  // DAS Anexo III faixa 1
  const NET_REVENUE_RATE =
    (1 - STORE_FEE_PCT) * (1 - RC_FEE_PCT) * (1 - SIMPLES_PCT);  // ≈ 0.7910

  const IOF_RATE = 0.0338;     // IOF câmbio cartão internacional 2026
  const COST_MULTIPLIER = 1 + IOF_RATE;  // ≈ 1.0338

  const fixedTotalUsd =
    Number(d.fixed_monthly_usd) + Number(d.one_time_paid_this_month_usd);
  const variableAiUsd = Number(d.variable_ai_usd);
  const aiPerUser = activeTutors > 0 ? variableAiUsd / activeTutors : 0;

  // Custos efetivos (USD nominal × IOF) — o que realmente sai da conta em BRL,
  // expresso em USD pra manter coerência visual com o resto da página.
  const effectiveFixedTotalUsd  = fixedTotalUsd * COST_MULTIPLIER;
  const effectiveAiPerUser      = aiPerUser * COST_MULTIPLIER;
  const effectiveVariableAiUsd  = variableAiUsd * COST_MULTIPLIER;

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
            <div className="text-warning text-xs mt-1 font-mono">
              Efetivo c/ IOF {(IOF_RATE * 100).toFixed(2)}%: {fmtUSD(Number(d.grand_total_usd) * COST_MULTIPLIER)}/mês
              · {fmtUSD(grandTotalAnnual * COST_MULTIPLIER)}/ano
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

      {/* Cenarios de assinatura — fórmula com taxas + custo fixo + variável + lucro */}
      <section>
        <h2 className="text-ametista text-xs uppercase tracking-wider font-medium mb-3">
          Break-even por cenário de assinatura
        </h2>
        <p className="text-text-muted text-sm mb-2">
          Cada assinatura passa por <strong>3 descontos na receita</strong>:
          stores ({(STORE_FEE_PCT * 100).toFixed(0)}%), RevenueCat ({(RC_FEE_PCT * 100).toFixed(0)}%) e DAS Simples Nacional ({(SIMPLES_PCT * 100).toFixed(0)}%).
          Sobra <strong className="text-jade">{(NET_REVENUE_RATE * 100).toFixed(2)}%</strong> da receita bruta.
          Do lado dos custos, infraestrutura em USD via cartão PJ paga <strong>IOF câmbio</strong> de{' '}
          {(IOF_RATE * 100).toFixed(2)}% — então o custo efetivo é {(COST_MULTIPLIER * 100).toFixed(2)}% do nominal.
          O líquido cobre <strong>fixo efetivo</strong> ({fmtUSD(effectiveFixedTotalUsd)}) +{' '}
          <strong>IA por assinante efetiva</strong> ({fmtUSD(effectiveAiPerUser)}/mês, em {activeTutors}{' '}
          tutor{activeTutors === 1 ? '' : 'es'} ativo{activeTutors === 1 ? '' : 's'}) + <strong>lucro</strong>.
          Margem Elite é 1,7× sobre o break-even.
        </p>
        <p className="text-text-dim text-xs mb-3">
          Fórmula: N = ⌈Fixo×{COST_MULTIPLIER.toFixed(4)} / (preço×{NET_REVENUE_RATE.toFixed(4)} − var×{COST_MULTIPLIER.toFixed(4)})⌉.
          Cenários onde o líquido após taxas+impostos não cobre o IA efetivo por usuário são marcados como inviáveis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {scenarios.map(s => {
            // Receita líquida POR assinante = preço × (1-store) × (1-rc) × (1-simples)
            const netPerUser   = s.price * NET_REVENUE_RATE;
            const feesPerUser  = s.price - netPerUser;
            // Custo efetivo unitário: IA por user × IOF câmbio
            const effAiPerUser = effectiveAiPerUser;
            // Margem unitária: líquido após receita − custo IA efetivo
            const unitMargin   = netPerUser - effAiPerUser;

            if (unitMargin <= 0) {
              return (
                <div key={s.price} className="bg-bg-card border border-danger/40 rounded-xl p-5">
                  <div className="text-text-dim text-xs uppercase tracking-widest mb-2">{s.label}</div>
                  <div className="font-display text-xl text-danger">Inviável</div>
                  <div className="text-xs text-text-muted mt-2 leading-relaxed">
                    Líquido após taxas+DAS ({fmtUSD(netPerUser)}) ≤ IA efetiva/assinante com IOF ({fmtUSD(effAiPerUser)}).
                    Aumente preço, reduza IA ou negocie taxa enterprise.
                  </div>
                </div>
              );
            }

            const breakeven = Math.ceil(effectiveFixedTotalUsd / unitMargin);
            const withMargin = Math.ceil(breakeven * ELITE_MARGIN);

            // Bruto vs líquido — o que entra na conta
            const breakevenGross = breakeven * s.price;
            const breakevenNet   = breakeven * netPerUser;
            const breakevenFees  = breakeven * feesPerUser;
            const breakevenVarCost = breakeven * effAiPerUser;
            const breakevenTotalCost = effectiveFixedTotalUsd + breakevenVarCost;

            const eliteGross = withMargin * s.price;
            const eliteNet   = withMargin * netPerUser;
            const eliteFees  = withMargin * feesPerUser;
            const eliteVarCost = withMargin * effAiPerUser;
            const eliteTotalCost = effectiveFixedTotalUsd + eliteVarCost;
            const eliteProfit = eliteNet - eliteTotalCost;

            return (
              <div key={s.price} className="bg-bg-card border border-border rounded-xl p-5">
                <div className="text-text-dim text-xs uppercase tracking-widest mb-1">{s.label}</div>
                <div className="text-[10px] text-text-dim mb-3">
                  líquido por user: <span className="font-mono text-jade">{fmtUSD(netPerUser)}</span>
                </div>

                {/* Break-even */}
                <div className="font-mono text-2xl text-text">{breakeven.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-text-muted mt-1">assinantes break-even</div>
                <div className="text-[11px] text-text-dim mt-1.5 space-y-0.5">
                  <div>Bruto: <span className="font-mono text-text-muted">{fmtUSD(breakevenGross)}</span></div>
                  <div>− Taxas+DAS: <span className="font-mono text-warning">{fmtUSD(breakevenFees)}</span></div>
                  <div>= Líquido: <span className="font-mono text-text">{fmtUSD(breakevenNet)}</span></div>
                  <div>Custo efetivo: <span className="font-mono text-text-muted">{fmtUSD(breakevenTotalCost)}</span></div>
                  <div>(fixo×IOF {fmtUSD(effectiveFixedTotalUsd)} + IA×IOF {fmtUSD(breakevenVarCost)})</div>
                </div>

                {/* Margem Elite */}
                <div className="border-t border-border mt-3 pt-3">
                  <div className="font-mono text-lg text-jade">{withMargin.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-text-dim mt-0.5">com margem 1,7× (Elite)</div>
                  <div className="text-[11px] text-text-dim mt-1.5 space-y-0.5">
                    <div>Bruto: <span className="font-mono text-text-muted">{fmtUSD(eliteGross)}</span></div>
                    <div>− Taxas+DAS: <span className="font-mono text-warning">{fmtUSD(eliteFees)}</span></div>
                    <div>= Líquido: <span className="font-mono text-jade">{fmtUSD(eliteNet)}</span></div>
                    <div>Custo efetivo: <span className="font-mono text-text-muted">{fmtUSD(eliteTotalCost)}</span></div>
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

      {/* Metodologia — explicação completa do cálculo de break-even */}
      <section className="bg-bg-card border border-border rounded-xl p-6 mt-4">
        <h2 className="text-ametista text-xs uppercase tracking-wider font-medium mb-4">
          Como o cálculo de break-even funciona
        </h2>

        <div className="space-y-5 text-sm text-text-muted leading-relaxed">

          {/* 1. Fórmula */}
          <div>
            <h3 className="text-text font-semibold mb-2">A fórmula completa</h3>
            <p className="mb-2">
              O preço cobrado pelo app não é tudo que entra na conta da empresa, e o custo
              em USD do servidor não é tudo que sai dela. Há 3 descontos sobre a receita e 1
              imposto sobre o custo. Premissa: <strong className="text-text">empresa do Simples Nacional Anexo III faixa 1</strong> pagando infraestrutura via cartão de crédito PJ internacional.
            </p>

            <p className="mb-2 mt-3"><strong className="text-text">Lado RECEITA</strong> — descontos até chegar no caixa:</p>
            <ul className="list-disc list-inside text-text-dim space-y-1 ml-2 mb-3">
              <li><strong className="text-text">Apple App Store / Google Play</strong>: 30% padrão, 15% pra Small Business Program (receita anual {`<`} $1M) e pra assinaturas após 12 meses do mesmo assinante. Configuração atual: <strong className="text-jade">{(STORE_FEE_PCT * 100).toFixed(0)}%</strong></li>
              <li><strong className="text-text">RevenueCat</strong>: 0% até $2,5K MTR, 1% acima. Configuração atual: <strong className="text-jade">{(RC_FEE_PCT * 100).toFixed(0)}%</strong></li>
              <li><strong className="text-text">DAS Simples Nacional Anexo III faixa 1</strong> (receita {`<`} R$ 180k/ano): {(SIMPLES_PCT * 100).toFixed(0)}%. Inclui PIS, COFINS, ICMS, ISS, IRPJ e CSLL — não somar separado. Aplica sobre o valor que efetivamente entra na conta após Apple/Google/RC. Configuração atual: <strong className="text-jade">{(SIMPLES_PCT * 100).toFixed(0)}%</strong></li>
            </ul>

            <p className="mb-2"><strong className="text-text">Lado CUSTO</strong> — imposto sobre infra em USD:</p>
            <ul className="list-disc list-inside text-text-dim space-y-1 ml-2 mb-3">
              <li><strong className="text-text">IOF Câmbio cartão internacional</strong>: 3,38% em 2026 (Decreto 12.466/2025 reduz gradualmente: 3,88% em 2025 → 3,38% em 2026 → 2,88% em 2027 → ... → 0% em 2030). Aplica sobre cada compra em USD via cartão PJ (Anthropic, Gemini, Supabase, Vercel, etc.). Configuração atual: <strong className="text-jade">{(IOF_RATE * 100).toFixed(2)}%</strong></li>
              <li><strong className="text-text-dim">IRRF (15%) / CIDE-Remessa (10%) / PIS-COFINS Importação (9,25%)</strong>: <em>não</em> se aplicam em compras via cartão de crédito PJ. Esses tributos incidem em remessa formal por wire/SWIFT, não em fatura de cartão. Confirmar com contador antes de mudar de regime ou usar conta global.</li>
            </ul>

            <p className="mb-2">Receita líquida por assinante:</p>
            <pre className="bg-bg-deep border border-border rounded-lg p-3 text-xs font-mono text-text overflow-x-auto">
preço_líquido = preço × (1−{STORE_FEE_PCT}) × (1−{RC_FEE_PCT}) × (1−{SIMPLES_PCT}) = preço × {NET_REVENUE_RATE.toFixed(4)}
            </pre>

            <p className="mt-3 mb-2">Custo efetivo (USD nominal × IOF câmbio):</p>
            <pre className="bg-bg-deep border border-border rounded-lg p-3 text-xs font-mono text-text overflow-x-auto">
custo_efetivo = custo_nominal × (1 + {IOF_RATE}) = custo_nominal × {COST_MULTIPLIER.toFixed(4)}
            </pre>

            <p className="mt-3 mb-2">A receita líquida precisa cobrir <strong className="text-text">fixo efetivo</strong> + <strong className="text-text">IA efetiva por assinante × N</strong> + <strong className="text-text">lucro</strong>:</p>
            <pre className="bg-bg-deep border border-border rounded-lg p-3 text-xs font-mono text-text overflow-x-auto">
N × preço_líquido = (Fixo + Var × N) × IOF + Lucro
            </pre>

            <p className="mt-2">Resolvendo para break-even (Lucro = 0):</p>
            <pre className="bg-bg-deep border border-border rounded-lg p-3 text-xs font-mono text-jade overflow-x-auto">
N = ⌈ (Fixo × IOF) ÷ (preço_líquido − Var × IOF) ⌉
            </pre>

            <p className="mt-2 text-text-dim">
              A margem Elite 1,7× é aplicada sobre N, e o lucro líquido real é calculado
              com receita líquida (após taxas+DAS) menos custo efetivo (fixo+IA, ambos
              multiplicados por IOF). Lucro NÃO inclui taxas/impostos porque eles saem antes.
            </p>
          </div>

          {/* 1b. Quando ajustar as taxas e impostos */}
          <div>
            <h3 className="text-text font-semibold mb-2">Quando revisar taxas e impostos</h3>
            <ul className="list-disc list-inside text-text-dim space-y-1 ml-2">
              <li><strong className="text-text">STORE_FEE_PCT</strong>: {`>`} $1M/ano sem Small Business → trocar pra 0,30. Sair do programa Apple → também 0,30 (Apple é por developer, não por app).</li>
              <li><strong className="text-text">RC_FEE_PCT</strong>: já está em 0,01 ({`>`} $2,5K MTR). Acima de $10K MTR negociar enterprise ({`<`} 1%).</li>
              <li><strong className="text-text">SIMPLES_PCT</strong>: faixa progressiva. Hoje 6% (Anexo III faixa 1, receita anual {`<`} R$ 180k). Próximas faixas: 11,2% (até R$ 360k), 13,5% (até R$ 720k), 16% (até R$ 1,8M), 21% (até R$ 3,6M), 33% (até R$ 4,8M). Trocar conforme receita acumulada bruta dos últimos 12 meses subir. Acima de R$ 4,8M sair do Simples para Lucro Presumido.</li>
              <li><strong className="text-text">IOF_RATE</strong>: cronograma legal — 3,88% (2025), <strong className="text-jade">3,38% (2026 atual)</strong>, 2,88% (2027), 2,38% (2028), 1,88% (2029), 0,38% (até jun/2030), 0% (após jul/2030). Atualizar 1× ao ano.</li>
              <li>Se mudar pra Lucro Presumido: zerar SIMPLES_PCT e adicionar PIS (0,65%), COFINS (3%), IRPJ+CSLL (~13% sobre lucro presumido de 32%) e ISS municipal — mais complexo, exige refator.</li>
              <li>Se passar a pagar infra por wire/SWIFT em vez de cartão: zerar IOF_RATE pra 0,38% (alíquota wire), mas <em>adicionar</em> IRRF 15% + CIDE 10% + PIS-COFINS Importação 9,25% sobre cada remessa (aumenta muito o custo).</li>
            </ul>
            <p className="text-text-dim text-xs mt-2 italic">
              Constantes hardcoded em <code className="bg-bg-deep px-1.5 py-0.5 rounded font-mono text-[11px]">costs/page.tsx</code>:
              <code className="bg-bg-deep px-1.5 py-0.5 rounded font-mono text-[11px] ml-1">STORE_FEE_PCT</code>,
              <code className="bg-bg-deep px-1.5 py-0.5 rounded font-mono text-[11px] ml-1">RC_FEE_PCT</code>,
              <code className="bg-bg-deep px-1.5 py-0.5 rounded font-mono text-[11px] ml-1">SIMPLES_PCT</code>,
              <code className="bg-bg-deep px-1.5 py-0.5 rounded font-mono text-[11px] ml-1">IOF_RATE</code>.
              Caminho futuro: migrar pra <code className="bg-bg-deep px-1.5 py-0.5 rounded font-mono text-[11px]">app_config</code> pra editar via UI sem deploy.
            </p>
          </div>

          {/* 2. Por que a fórmula simples (custo total ÷ preço) está errada */}
          <div>
            <h3 className="text-text font-semibold mb-2">Por que NÃO é só "custo total ÷ preço"</h3>
            <p>
              Dividir o custo total mensal pelo preço da assinatura trata todo o custo como fixo —
              ignora que mais assinantes geram mais custo de IA. Se 187 tutores geram um certo
              consumo de IA, 318 tutores geram <strong>mais</strong> consumo. A fórmula simples
              dá uma falsa sensação de break-even porque os 131 tutores extras (de 187 para 318)
              também trazem custo variável que precisa ser coberto.
            </p>
          </div>

          {/* 3. Estado atual vs cenário escalado */}
          <div>
            <h3 className="text-text font-semibold mb-2">Estado atual vs escala saudável</h3>
            <p className="mb-3">
              Hoje temos <strong className="text-text">{activeTutors} tutor{activeTutors === 1 ? '' : 'es'} ativo{activeTutors === 1 ? '' : 's'}</strong>{' '}
              consumindo <strong className="text-text">{fmtUSD(variableAiUsd)}/mês</strong> de IA nominal, ou{' '}
              <strong className="text-text">{fmtUSD(effectiveVariableAiUsd)}/mês</strong> efetivos com IOF — ou seja,{' '}
              <strong className="text-jade">{fmtUSD(effectiveAiPerUser)}/user</strong> efetivo. Esse número é alto
              porque a base é pequena (beta-testers concentrando uso). Conforme escalar, ele cai —
              o custo de IA se dilui em mais usuários e o uso médio por tutor tende a ser
              razoavelmente esparso (cache de prompt, períodos sem ativar nenhum agente).
            </p>
            <div className="bg-bg-deep border border-border rounded-lg p-4 space-y-3">
              <div>
                <div className="text-text-dim text-[10px] uppercase tracking-widest font-medium mb-1">
                  Cenário 1 — hoje ({activeTutors} tutor{activeTutors === 1 ? '' : 'es'})
                </div>
                {(() => {
                  const netUnit = 50 * NET_REVENUE_RATE;
                  const margem = netUnit - effectiveAiPerUser;
                  return (
                    <div className="text-xs space-y-0.5 font-mono">
                      <div>preço líquido = $50 × {NET_REVENUE_RATE.toFixed(4)} = <span className="text-jade">{fmtUSD(netUnit)}</span></div>
                      <div>IA efetiva/user = {fmtUSD(aiPerUser)} × {COST_MULTIPLIER.toFixed(4)} = <span className="text-warning">{fmtUSD(effectiveAiPerUser)}</span></div>
                      <div>margem unitária = {fmtUSD(netUnit)} − {fmtUSD(effectiveAiPerUser)} ={' '}
                        {margem <= 0
                          ? <span className="text-danger">{fmtUSD(margem)} → Inviável</span>
                          : <span className="text-jade">{fmtUSD(margem)}</span>}
                      </div>
                    </div>
                  );
                })()}
                {effectiveAiPerUser >= 50 * NET_REVENUE_RATE && (
                  <div className="text-text-dim text-xs italic mt-1">
                    IA efetiva por assinante excede o preço líquido — qualquer aumento de base agrava o prejuízo.
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3">
                <div className="text-text-dim text-[10px] uppercase tracking-widest font-medium mb-1">
                  Cenário 2 — com escala saudável (Var/user nominal = $5)
                </div>
                {(() => {
                  const varNominal = 5;
                  const varEfetiva = varNominal * COST_MULTIPLIER;
                  const netUnit = 50 * NET_REVENUE_RATE;
                  const margem = netUnit - varEfetiva;
                  const N = Math.ceil(effectiveFixedTotalUsd / margem);
                  const bruto = N * 50;
                  const liquido = N * netUnit;
                  const custoEfetivo = effectiveFixedTotalUsd + N * varEfetiva;
                  return (
                    <div className="text-xs space-y-0.5 font-mono">
                      <div>preço líquido = $50 × {NET_REVENUE_RATE.toFixed(4)} = <span className="text-jade">{fmtUSD(netUnit)}</span></div>
                      <div>IA efetiva = $5 × {COST_MULTIPLIER.toFixed(4)} = <span className="text-warning">{fmtUSD(varEfetiva)}</span></div>
                      <div>fixo efetivo = {fmtUSD(fixedTotalUsd)} × {COST_MULTIPLIER.toFixed(4)} = <span className="text-warning">{fmtUSD(effectiveFixedTotalUsd)}</span></div>
                      <div>margem unitária = {fmtUSD(netUnit)} − {fmtUSD(varEfetiva)} = <span className="text-jade">{fmtUSD(margem)}</span></div>
                      <div>N break-even = ⌈ {fmtUSD(effectiveFixedTotalUsd)} ÷ {fmtUSD(margem)} ⌉ = <span className="text-jade">{N} assinantes</span></div>
                      <div>Receita bruta = {N} × $50 = {fmtUSD(bruto)}</div>
                      <div>Receita líquida = {N} × {fmtUSD(netUnit)} = {fmtUSD(liquido)}</div>
                      <div>Custo efetivo = {fmtUSD(effectiveFixedTotalUsd)} + ({N} × {fmtUSD(varEfetiva)}) = {fmtUSD(custoEfetivo)} <span className="text-jade">✓</span></div>
                    </div>
                  );
                })()}
              </div>

              <div className="border-t border-border pt-3">
                <div className="text-text-dim text-[10px] uppercase tracking-widest font-medium mb-1">
                  Margem Elite 1,7× sobre o cenário 2
                </div>
                {(() => {
                  const varNominal = 5;
                  const varEfetiva = varNominal * COST_MULTIPLIER;
                  const netUnit = 50 * NET_REVENUE_RATE;
                  const margem = netUnit - varEfetiva;
                  const N = Math.ceil(effectiveFixedTotalUsd / margem);
                  const elite = Math.ceil(N * 1.7);
                  const eliteBruto = elite * 50;
                  const eliteLiquido = elite * netUnit;
                  const eliteFees = eliteBruto - eliteLiquido;
                  const eliteCost = effectiveFixedTotalUsd + elite * varEfetiva;
                  const eliteProfit = eliteLiquido - eliteCost;
                  return (
                    <div className="text-xs space-y-0.5 font-mono">
                      <div>N Elite = ⌈ {N} × 1,7 ⌉ = <span className="text-jade">{elite} assinantes</span></div>
                      <div>Receita bruta = {elite} × $50 = {fmtUSD(eliteBruto)}</div>
                      <div>− Taxas+DAS (stores {(STORE_FEE_PCT*100).toFixed(0)}% + RC {(RC_FEE_PCT*100).toFixed(0)}% + Simples {(SIMPLES_PCT*100).toFixed(0)}%) = <span className="text-warning">{fmtUSD(eliteFees)}</span></div>
                      <div>= Receita líquida = {fmtUSD(eliteLiquido)}</div>
                      <div>Custo efetivo = {fmtUSD(effectiveFixedTotalUsd)} + ({elite} × {fmtUSD(varEfetiva)}) = {fmtUSD(eliteCost)}</div>
                      <div>Lucro líquido = {fmtUSD(eliteLiquido)} − {fmtUSD(eliteCost)} = <span className="text-jade font-bold">{fmtUSD(eliteProfit)}/mês</span></div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 4. Quando o cenário é "Inviável" */}
          <div>
            <h3 className="text-text font-semibold mb-2">Quando aparece "Inviável"</h3>
            <p>
              Se <em>Var/user ≥ preço</em>, a margem unitária é zero ou negativa — cada novo assinante
              piora o prejuízo. Com a base pequena de hoje isso pode acontecer nos planos baixos
              (Massa $10, Acessível $20). É o sinal econômico correto de que a tabela de preços
              precisa ser ajustada <strong>ou</strong> que o custo de IA por usuário precisa cair antes
              do plano fazer sentido. Caminhos pra reduzir <em>Var/user</em>: substituir Opus por
              Sonnet/Haiku onde possível, ampliar prompt caching, mover trabalho síncrono para CRONs
              em lote, esperar a base crescer (diluição natural).
            </p>
          </div>

          {/* 5. Limites da estimativa */}
          <div>
            <h3 className="text-text font-semibold mb-2">Limites desta estimativa</h3>
            <p>
              <em>Var/user</em> é calculado como{' '}
              <code className="bg-bg-deep px-1.5 py-0.5 rounded font-mono text-[11px]">
                IA mensal ÷ tutores ativos
              </code>
              . Com poucos tutores, beta-testers ativos puxam a média para cima. Em produção com
              ~10k assinantes, esse número converge para o uso médio real (provavelmente bem
              menor). Os cenários acima usam $5/user como aproximação de regime de escala —
              ajuste mentalmente conforme suas projeções.
            </p>
          </div>

        </div>
      </section>

      <p className="text-text-dim text-xs italic text-center pt-4">
        Edição inline: clique no lápis ao lado de cada item, ou em "Adicionar custo" pra incluir um novo.
        Para BRL/EUR/etc., informe o valor na moeda original e a cotação — o USD é calculado automaticamente.
      </p>
    </div>
  );
}
