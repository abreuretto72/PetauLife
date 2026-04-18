/**
 * cardapioPdf.ts — shared HTML body builder for weekly menu PDF export.
 * Used by cardapio.tsx (current menu) and cardapio-detail.tsx (past menus).
 */
import type { Cardapio, CardapioDia, Receita } from '../hooks/useNutricao';

const DAY_HEX = ['#E8813A', '#1B8EAD', '#9B59B6', '#2ECC71', '#F1C40F', '#E84393', '#3498DB'];

export interface PetPdfInfo {
  name: string;
  species: 'dog' | 'cat';
  sex: 'male' | 'female' | null;
  neutered: boolean;
  birth_date: string | null;
  estimated_age_months: number | null;
  avatar_url: string | null;
  breed: string | null;
  modalidade_label: string;
  weight_kg?: number | null;
}

function calcAgeStr(
  birthDate: string | null,
  estimatedAgeMonths: number | null,
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  const source = birthDate
    ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : estimatedAgeMonths ?? null;
  if (source === null) return '—';
  if (source < 12) return t('nutrition.pdfPetAgeMonths', { n: source });
  const years = Math.floor(source / 12);
  const rem = source % 12;
  return rem > 0 ? `${years}a ${rem}m` : t('nutrition.pdfPetAge', { n: years });
}

function buildPetCardHtml(
  pet: PetPdfInfo,
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  const age = calcAgeStr(pet.birth_date, pet.estimated_age_months, t);
  const sexLabel = pet.sex === 'male' ? t('nutrition.sexMale') : pet.sex === 'female' ? t('nutrition.sexFemale') : '—';
  const neuteredLabel = pet.neutered ? t('nutrition.pdfPetNeuteredYes') : t('nutrition.pdfPetNeuteredNo');

  const avatarHtml = pet.avatar_url
    ? `<img src="${pet.avatar_url}" style="width:80px;height:80px;object-fit:cover;" />`
    : `<div style="width:80px;height:80px;background:#E8813A20;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#E8813A;">${pet.species === 'dog' ? '🐕' : '🐱'}</div>`;

  const weightLabel = pet.weight_kg != null
    ? t('nutrition.pdfPetWeight', { weight: pet.weight_kg })
    : null;
  const chips = [
    { label: age, color: '#E8813A' },
    { label: sexLabel, color: '#1B8EAD' },
    { label: neuteredLabel, color: '#9B59B6' },
    ...(weightLabel ? [{ label: weightLabel, color: '#3498DB' }] : []),
    { label: pet.modalidade_label, color: '#2ECC71', textColor: '#1a6e3e' },
  ].filter((c) => c.label && c.label !== '—');

  return `<div style="border:1px solid #ddd;border-radius:8px;margin-bottom:20px;overflow:hidden;display:flex;background:#fafafa;page-break-inside:avoid;">
  <div style="width:80px;min-width:80px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">
    ${avatarHtml}
  </div>
  <div style="flex:1;padding:12px 16px;">
    <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">${pet.name}</div>
    ${pet.breed ? `<div style="font-size:10px;color:#888;margin-bottom:8px;">${pet.breed}</div>` : '<div style="margin-bottom:6px;"></div>'}
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      ${chips.map((c) => `<span style="background:${c.color}20;color:${c.textColor ?? c.color};font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;">${c.label}</span>`).join('')}
    </div>
  </div>
</div>`;
}

function buildRecipeHtml(
  recipe: Receita,
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  const meta: string[] = [];
  if (recipe.prep_minutes) meta.push(t('nutrition.receitaPrepTime', { n: recipe.prep_minutes }));
  if (recipe.portion_g) meta.push(t('nutrition.receitaPortion', { g: recipe.portion_g }));
  if (recipe.servings) meta.push(t('nutrition.receitaServings', { n: recipe.servings }));

  const ingredientsHtml = recipe.ingredients?.length
    ? `<div style="margin-top:8px;">
        <div style="font-size:9px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${t('nutrition.receitaIngredients')}</div>
        <ul style="margin:0;padding-left:16px;">
          ${recipe.ingredients.map((i) => `<li style="font-size:10px;color:#444;margin-bottom:2px;">${i}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const stepsHtml = recipe.steps?.length
    ? `<div style="margin-top:8px;">
        <div style="font-size:9px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${t('nutrition.receitaSteps')}</div>
        <ol style="margin:0;padding-left:16px;">
          ${recipe.steps.map((s) => `<li style="font-size:10px;color:#444;margin-bottom:3px;">${s}</li>`).join('')}
        </ol>
      </div>`
    : '';

  const storageHtml = (recipe.storage_fridge || recipe.storage_freezer)
    ? `<div style="margin-top:8px;font-size:10px;color:#666;">
        ${recipe.storage_fridge ? t('nutrition.receitaFridge', { days: recipe.storage_fridge }) : ''}
        ${recipe.storage_fridge && recipe.storage_freezer ? ' &nbsp;·&nbsp; ' : ''}
        ${recipe.storage_freezer ? t('nutrition.receitaFreezer', { days: recipe.storage_freezer }) : ''}
      </div>`
    : '';

  const aiTipHtml = recipe.ai_tip
    ? `<div style="margin-top:8px;border-left:3px solid #E8813A;padding-left:8px;font-size:10px;color:#555;font-style:italic;">
        <strong style="color:#E8813A;font-style:normal;">${t('nutrition.receitaAITip')}:</strong> ${recipe.ai_tip}
      </div>`
    : '';

  return `<div style="margin:6px 12px 10px 12px;border:1px solid #e8e8e8;border-radius:6px;padding:10px;page-break-inside:avoid;">
    <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:${meta.length ? '3px' : '0'};">${recipe.name}</div>
    ${meta.length ? `<div style="font-size:10px;color:#999;margin-bottom:4px;">${meta.join(' &nbsp;·&nbsp; ')}</div>` : ''}
    ${ingredientsHtml}
    ${stepsHtml}
    ${storageHtml}
    ${aiTipHtml}
  </div>`;
}

function buildDayHtml(
  day: CardapioDia,
  idx: number,
  t: (k: string, o?: Record<string, unknown>) => string,
): string {
  const color = DAY_HEX[idx % DAY_HEX.length];
  const recipeCount = day.recipes?.length ?? 0;

  const ingredientsHtml = day.ingredients?.length
    ? `<div style="padding:4px 14px 8px;display:flex;flex-wrap:wrap;gap:6px;">
        ${day.ingredients.map((i) => `<span style="background:#f0f0f0;border-radius:4px;padding:2px 8px;font-size:10px;color:#555;">${i}</span>`).join('')}
      </div>`
    : '';

  const recipesHtml = recipeCount > 0
    ? day.recipes.map((r) => buildRecipeHtml(r, t)).join('')
    : `<div style="padding:6px 14px 12px;font-size:10px;color:#999;font-style:italic;">${t('nutrition.noRecipes')}</div>`;

  return `<div style="border:1px solid #ddd;border-radius:8px;margin-bottom:14px;page-break-inside:avoid;overflow:hidden;">
    <div style="background:#f7f7f7;padding:10px 14px;border-left:4px solid ${color};display:flex;align-items:center;gap:10px;">
      <span style="background:${color}20;color:${color};font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;">${day.weekday}</span>
      <span style="flex:1;font-size:13px;font-weight:700;color:#1a1a1a;">${day.title}</span>
      <span style="font-size:10px;color:#999;">${recipeCount > 0 ? t('nutrition.cardapioDayRecipes', { n: recipeCount }) : t('nutrition.noRecipes')}</span>
    </div>
    ${day.description ? `<div style="padding:8px 14px 4px;font-size:11px;color:#555;">${day.description}</div>` : ''}
    ${ingredientsHtml}
    ${recipesHtml}
  </div>`;
}

export function buildCardapioPdfBody(
  cardapio: Cardapio,
  t: (k: string, o?: Record<string, unknown>) => string,
  petInfo?: PetPdfInfo,
): string {
  const petCard = petInfo ? buildPetCardHtml(petInfo, t) : '';
  return petCard + (cardapio.days ?? []).map((day, idx) => buildDayHtml(day, idx, t)).join('');
}
