const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~180 dias

/**
 * Retorna true se a data fornecida estiver dentro dos últimos 6 meses.
 * Aceita Date, ISO string ou timestamp Unix (segundos ou ms).
 * Quando não há data disponível, retorna true (inclui a vaga).
 * @param {Date|string|number|null|undefined} value
 * @returns {boolean}
 */
function isWithinSixMonths(value) {
  if (value == null || value === "" || value === "Recentemente") return true;

  let date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    // Segundos (Unix) vs milissegundos: ms se > 1e12
    date = new Date(value > 1e12 ? value : value * 1000);
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) return true; // data inválida → inclui

  return Date.now() - date.getTime() <= SIX_MONTHS_MS;
}

module.exports = { isWithinSixMonths };
