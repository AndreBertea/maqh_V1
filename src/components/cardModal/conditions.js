const CURRENT_YEAR = 2024;
let CONFIG = {};
let CONDITIONS = [];

/**
 * Nettoie la valeur en gérant le cas où on a "—".
 */
function handleDashes(value) {
  if (value === '—') {
    return null;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    const allDashes = entries.every(([_, v]) => v === '—');
    if (allDashes) return null;

    const cleaned = {};
    for (const [k, v] of entries) {
      if (v !== '—') {
        cleaned[k] = v;
      }
    }
    if (Object.keys(cleaned).length === 0) {
      return null;
    }
    return cleaned;
  }
  return value;
}

/**
 * Extrait la valeur en suivant un chemin de clés. Retourne null
 * si la clé n'existe pas ou si la valeur est "—" (via handleDashes).
 */
function extractValue(data, key) {
  const keys = key.split('.');
  let value = data;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return null;
    }
  }
  return handleDashes(value);
}

function convertMarketCap(cap) {
  try {
    const clean = cap.replace(/[^0-9.,BKMbkm]/g, '').toUpperCase();
    const num = parseFloat(clean.replace(/[^\d.]/g, ''));
    if (clean.includes('B')) return num;
    if (clean.includes('M')) return num / 1000;
    if (clean.includes('K')) return num / 1e6;
    return num / 1e9;
  } catch {
    return 0;
  }
}

// Conditions
function condition1(dps) {
  try {
    return Object.values(dps).every(v => parseFloat(v) > 0);
  } catch {
    return false;
  }
}
function condition2(g) {
  try {
    return parseFloat(g.replace('%', '')) > CONFIG.condition2;
  } catch {
    return false;
  }
}
function condition3(y) {
  try {
    return parseFloat(y.replace('%', '')) > CONFIG.condition3;
  } catch {
    return false;
  }
}
function condition4(cap) {
  try {
    return convertMarketCap(cap) > CONFIG.condition4;
  } catch {
    return false;
  }
}
function condition5(val) {
  try {
    return parseFloat(val[CURRENT_YEAR]) < CONFIG.condition5;
  } catch {
    return false;
  }
}
function condition6(val) {
  try {
    return parseFloat(val[CURRENT_YEAR]) < CONFIG.condition6;
  } catch {
    return false;
  }
}
function condition7(val) {
  try {
    const years = Object.keys(val).map(Number);
    const minYear = Math.min(...years);
    return parseFloat(val[CURRENT_YEAR]) / parseFloat(val[minYear]) > CONFIG.condition7;
  } catch {
    return false;
  }
}
function condition8(val) {
  try {
    const years = Object.keys(val).map(Number);
    const minYear = Math.min(...years);
    return parseFloat(val[CURRENT_YEAR]) / parseFloat(val[minYear]) > CONFIG.condition8;
  } catch {
    return false;
  }
}
function condition9(val) {
  try {
    const years = Object.keys(val).map(Number);
    const minYear = Math.min(...years);
    const current = parseFloat(val[CURRENT_YEAR]);
    const past = parseFloat(val[minYear]);
    return (current / past - 1) >= CONFIG.condition9;
  } catch {
    return false;
  }
}
function condition10(val) {
  try {
    const pe = parseFloat(val['P/E']);
    const perSec = parseFloat(val['PER_sec']);
    if (isNaN(pe) || isNaN(perSec)) return false;
    const tolerance = CONFIG.condition10 / 100;
    const lower = perSec * (1 - tolerance);
    const upper = perSec * (1 + tolerance);
    return pe >= lower && pe <= upper;
  } catch {
    return false;
  }
}
function condition11(val) {
  try {
    return parseFloat(val) < CONFIG.condition11;
  } catch {
    return false;
  }
}
function condition12(val) {
  try {
    const years = Object.keys(val).map(Number);
    const minYear = Math.min(...years);
    return parseFloat(val[CURRENT_YEAR]) - parseFloat(val[minYear]) > 0;
  } catch {
    return false;
  }
}
function condition13(val) {
  try {
    return parseFloat(val.replace('%', '')) < CONFIG.condition13;
  } catch {
    return false;
  }
}
function condition14(val) {
  try {
    return parseFloat(val.replace('%', '')) > CONFIG.condition14;
  } catch {
    return false;
  }
}
function condition15(val) {
  try {
    return parseFloat(val.replace('%', '')) > CONFIG.condition15;
  } catch {
    return false;
  }
}
function condition16(val) {
  try {
    const years = Object.keys(val).map(Number);
    const minYear = Math.min(...years);
    return parseFloat(val[minYear]) / parseFloat(val[CURRENT_YEAR]) > CONFIG.condition16;
  } catch {
    return false;
  }
}

export async function loadUserNotationConfig() {
  try {
    const config = await window.configAPI?.loadNotationConfig?.();
    CONFIG = config?.perso || {};

    CONDITIONS = [
      {
        name: 'Dividende versé depuis plus de 5 ans',
        key: 'DPS',
        condition: condition1,
        description: (data) => {
          const dps = extractValue(data, 'DPS');
          if (!dps) {
            return `Aucune donnée pour les dividendes de ${data.Name}.`;
          }
          const years = Object.keys(dps);
          if (!years.length) {
            return `Aucune donnée pour les dividendes de ${data.Name}.`;
          }
          const invalidYears = years.filter(y => parseFloat(dps[y]) <= 0);
          if (invalidYears.length === 0) {
            return `Dividende versé depuis plus de 5 ans.`;
          } else {
            return `Dividende non versé ou nul en ${invalidYears.join(', ')}.`;
          }
        }
      },
      {
        name: `Croissance du dividende sur 5 ans > ${CONFIG.condition2}%`,
        key: 'Dividends.DPS Growth 5Yr',
        condition: condition2,
        description: (data) => {
          const val = extractValue(data, 'Dividends.DPS Growth 5Yr');
          if (!val) {
            return `Aucune donnée sur la croissance du dividende pour ${data.Name}.`;
          }
          const number = parseFloat(val.replace('%', ''));
          if (isNaN(number)) {
            return `Valeur invalide pour la croissance du dividende: "${val}".`;
          }
          return `La croissance du dividende sur 5 ans est de ${number}%. (Condition > ${CONFIG.condition2}%)`;
        }
      },
      {
        name: `Rendement du dividende > ${CONFIG.condition3}%`,
        key: 'Dividends.Yield',
        condition: condition3,
        description: (data) => {
          const val = extractValue(data, 'Dividends.Yield');
          if (!val) {
            return `Aucune donnée de rendement du dividende pour ${data.Name}.`;
          }
          const number = parseFloat(val.replace('%', ''));
          if (isNaN(number)) {
            return `Valeur invalide pour le rendement du dividende: "${val}".`;
          }
          return `Le rendement du dividende est de ${number}%. (Condition > ${CONFIG.condition3}%)`;
        }
      },
      {
        name: 'Capitalisation',
        key: 'Profile.Market Cap',
        condition: condition4,
        description: (data) => {
          const val = extractValue(data, 'Profile.Market Cap');
          if (!val) {
            return `Aucune donnée de capitalisation pour ${data.Name}.`;
          }
          const cap = convertMarketCap(val);
          if (isNaN(cap) || cap === 0) {
            return `Valeur invalide pour la capitalisation de ${data.Name}: "${val}".`;
          }
          return `La capitalisation de ${data.Name} est d'environ ${cap} Mrd (Condition > ${CONFIG.condition4} Mrd).`;
        }
      },
      {
        name: 'Dettes / EBE',
        key: 'Net Debt / EBITDA',
        condition: condition5,
        description: (data) => {
          const val = extractValue(data, 'Net Debt / EBITDA');
          if (!val) {
            return `Aucune donnée pour la dette/EBITDA de ${data.Name}.`;
          }
          const currentVal = parseFloat(val[CURRENT_YEAR]);
          if (isNaN(currentVal)) {
            return `Valeur invalide pour la dette/EBITDA de ${data.Name}.`;
          }
          return `Le ratio Net Debt/EBITDA pour ${CURRENT_YEAR} est de ${currentVal}. (Condition < ${CONFIG.condition5})`;
        }
      },
      {
        name: 'Dettes / FCF',
        key: 'Debt / Equity',
        condition: condition6,
        description: (data) => {
          const val = extractValue(data, 'Debt / Equity');
          if (!val) {
            return `Aucune donnée pour la dette/FCF de ${data.Name}.`;
          }
          const currentVal = parseFloat(val[CURRENT_YEAR]);
          if (isNaN(currentVal)) {
            return `Valeur invalide pour la dette/FCF de ${data.Name}.`;
          }
          return `Le ratio Net Debt/FCF pour ${CURRENT_YEAR} est de ${currentVal}. (Condition < ${CONFIG.condition6})`;
        }
      },
      {
        name: 'Ratio FCF en augmentation sur 5 ans',
        key: 'Free Cash Flow',
        condition: condition7,
        description: (data) => {
          const val = extractValue(data, 'Free Cash Flow');
          if (!val) {
            return `Aucune donnée pour le FCF de ${data.Name}.`;
          }
          const years = Object.keys(val).map(Number);
          if (!years.length) {
            return `Aucune donnée de FCF pour ${data.Name}.`;
          }
          const minYear = Math.min(...years);
          const oldVal = parseFloat(val[minYear]);
          const curVal = parseFloat(val[CURRENT_YEAR]);
          if (isNaN(oldVal) || isNaN(curVal)) {
            return `Valeur FCF invalide pour ${data.Name}.`;
          }
          const ratio = (curVal / oldVal).toFixed(2);
          return `Le FCF ${CURRENT_YEAR} / FCF de ${minYear} = ${ratio} (Condition > ${CONFIG.condition7}).`;
        }
      },
      {
        name: 'Résultat net en augmentation sur 5 ans',
        key: 'Net Income to Common Incl Extra Items',
        condition: condition8,
        description: (data) => {
          const val = extractValue(data, 'Net Income to Common Incl Extra Items');
          if (!val) {
            return `Aucune donnée pour le résultat net de ${data.Name}.`;
          }
          const years = Object.keys(val).map(Number);
          if (!years.length) {
            return `Aucune donnée de résultat net pour ${data.Name}.`;
          }
          const minYear = Math.min(...years);
          const oldVal = parseFloat(val[minYear]);
          const curVal = parseFloat(val[CURRENT_YEAR]);
          if (isNaN(oldVal) || isNaN(curVal)) {
            return `Valeur invalide pour le résultat net de ${data.Name}.`;
          }
          const ratio = (curVal / oldVal).toFixed(2);
          return `Le résultat net de ${CURRENT_YEAR} / celui de ${minYear} = ${ratio} (Condition > ${CONFIG.condition8}).`;
        }
      },
      {
        name: `Augmentation de CA > ${CONFIG.condition9 * 100}% sur 5 ans`,
        key: 'Total Revenues',
        condition: condition9,
        description: (data) => {
          const val = extractValue(data, 'Total Revenues');
          if (!val) {
            return `Aucune donnée pour le Chiffre d'Affaires de ${data.Name}.`;
          }
          const years = Object.keys(val).map(Number);
          if (!years.length) {
            return `Aucune donnée de CA pour ${data.Name}.`;
          }
          const minYear = Math.min(...years);
          const current = parseFloat(val[CURRENT_YEAR]);
          const past = parseFloat(val[minYear]);
          if (isNaN(current) || isNaN(past)) {
            return `Valeur invalide pour le CA de ${data.Name}.`;
          }
          const growth = ((current / past - 1) * 100).toFixed(2);
          return `Le CA a augmenté de ${growth}% sur la période ${minYear}-${CURRENT_YEAR}. (Condition > ${CONFIG.condition9 * 100}%)`;
        }
      },
      {
        name: `PER de l’action ±${CONFIG.condition10}%`,
        key: 'Valuation (TTM)',
        condition: condition10,
        description: (data) => {
          const val = extractValue(data, 'Valuation (TTM)');
          if (!val) {
            return `Aucune donnée de PER pour ${data.Name}.`;
          }
          const pe = parseFloat(val['P/E']);
          const perSec = parseFloat(val['PER_sec']);
          if (isNaN(pe) || isNaN(perSec)) {
            return `Valeur invalide de PER pour ${data.Name}.`;
          }
          return `Le PER de ${data.Name} est de ${pe}, PER secteur = ${perSec} (Tolérance ±${CONFIG.condition10}%).`;
        }
      },
      {
        name: `Ratio PEG < ${CONFIG.condition11}`,
        key: 'Valuation (NTM).PEG',
        condition: condition11,
        description: (data) => {
          const val = extractValue(data, 'Valuation (NTM).PEG');
          if (!val) {
            return `Aucune donnée de PEG pour ${data.Name}.`;
          }
          const peg = parseFloat(val);
          if (isNaN(peg)) {
            return `Valeur invalide du PEG pour ${data.Name}.`;
          }
          return `Le PEG de ${data.Name} est de ${peg}. (Condition < ${CONFIG.condition11})`;
        }
      },
      {
        name: 'CA stable ou croissant sur 5 ans',
        key: 'Total Revenues',
        condition: condition12,
        description: (data) => {
          const val = extractValue(data, 'Total Revenues');
          if (!val) {
            return `Aucune donnée de Chiffre d'Affaires pour ${data.Name}.`;
          }
          const years = Object.keys(val).map(Number);
          if (!years.length) {
            return `Aucune donnée de CA pour ${data.Name}.`;
          }
          const minYear = Math.min(...years);
          const start = parseFloat(val[minYear]);
          const end = parseFloat(val[CURRENT_YEAR]);
          if (isNaN(start) || isNaN(end)) {
            return `Valeur invalide pour le CA de ${data.Name}.`;
          }
          const diff = end - start;
          if (diff >= 0) {
            return `Le CA de ${data.Name} est stable ou en hausse (diff: +${diff} sur 5 ans).`;
          } else {
            return `Le CA de ${data.Name} est en baisse (diff: ${diff} sur 5 ans).`;
          }
        }
      },
      {
        name: `Payout ratio < ${CONFIG.condition13}%`,
        key: 'Dividends.Payout',
        condition: condition13,
        description: (data) => {
          const val = extractValue(data, 'Dividends.Payout');
          if (!val) {
            return `Aucune donnée de payout ratio pour ${data.Name}.`;
          }
          const number = parseFloat(val.replace('%', ''));
          if (isNaN(number)) {
            return `Valeur invalide pour le payout ratio de ${data.Name}: "${val}".`;
          }
          return `Le payout ratio de ${data.Name} est de ${number}%. (Condition < ${CONFIG.condition13}%)`;
        }
      },
      {
        name: `ROA > ${CONFIG.condition14}%`,
        key: 'Returns (5Yr Avg).ROA',
        condition: condition14,
        description: (data) => {
          const val = extractValue(data, 'Returns (5Yr Avg).ROA');
          if (!val) {
            return `Aucune donnée de ROA (5 ans) pour ${data.Name}.`;
          }
          const number = parseFloat(val.replace('%', ''));
          if (isNaN(number)) {
            return `Valeur invalide pour le ROA de ${data.Name}: "${val}".`;
          }
          return `Le ROA (moy. 5 ans) de ${data.Name} est de ${number}%. (Condition > ${CONFIG.condition14}%)`;
        }
      },
      {
        name: `ROE > ${CONFIG.condition15}%`,
        key: 'Returns (5Yr Avg).ROE',
        condition: condition15,
        description: (data) => {
          const val = extractValue(data, 'Returns (5Yr Avg).ROE');
          if (!val) {
            return `Aucune donnée de ROE (5 ans) pour ${data.Name}.`;
          }
          const number = parseFloat(val.replace('%', ''));
          if (isNaN(number)) {
            return `Valeur invalide pour le ROE de ${data.Name}: "${val}".`;
          }
          return `Le ROE (moy. 5 ans) de ${data.Name} est de ${number}%. (Condition > ${CONFIG.condition15}%)`;
        }
      },
      {
        name: `Nombre d'actions en baisse de ${CONFIG.condition16}x`,
        key: 'Weighted Avg Shares Outstanding Dil',
        condition: condition16,
        description: (data) => {
          const val = extractValue(data, 'Weighted Avg Shares Outstanding Dil');
          if (!val) {
            return `Aucune donnée sur le nombre d'actions pour ${data.Name}.`;
          }
          const years = Object.keys(val).map(Number);
          if (!years.length) {
            return `Aucune donnée sur l'historique du nombre d'actions de ${data.Name}.`;
          }
          const minYear = Math.min(...years);
          const oldVal = parseFloat(val[minYear]);
          const curVal = parseFloat(val[CURRENT_YEAR]);
          if (isNaN(oldVal) || isNaN(curVal)) {
            return `Valeur invalide pour le nombre d'actions de ${data.Name}.`;
          }
          const ratio = (oldVal / curVal).toFixed(2);
          return `Le nombre d'actions a été multiplié par ${ratio} entre ${minYear} et ${CURRENT_YEAR} (Condition > ${CONFIG.condition16}).`;
        }
      }
    ];
  } catch (err) {
    console.error("Erreur lors du chargement de la config notation:", err);
    CONFIG = {};
    CONDITIONS = [];
  }
}

export async function evaluateConditions(data) {
  // 🔁 Toujours recharger la dernière version de la config utilisateur
  await loadUserNotationConfig();

  return CONDITIONS.map(c => {
    const value = extractValue(data, c.key);
    let note = 0;
    let displayNote = 0;

    if (value === null) {
      note = 0;
      displayNote = "⚠️";
    } else if (c.condition(value)) {
      note = 1;
      displayNote = 1;
    } else {
      note = 0;
      displayNote = 0;
    }

    const descr = (typeof c.description === 'function')
      ? c.description(data)
      : c.description;

    return {
      condition: c.name,
      note,
      displayNote,
      description: descr
    };
  });
}

