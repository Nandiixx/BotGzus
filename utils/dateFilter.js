/**
 * Filtro de data removido: todas as vagas são incluídas independentemente
 * da data de publicação. Mantido como passthrough para compatibilidade.
 * @param {Date|string|number|null|undefined} _value
 * @returns {boolean}
 */
function isWithinSixMonths(_value) {
  return true;
}

module.exports = { isWithinSixMonths };
