/**
 * Check if `value` is a number.
 *
 * @param   {any}     value The value to check.
 * @returns {boolean}       Returns `true` if `value` is a number, else `false`.
 */
export default value => {
  return !isNaN(parseFloat(value)) && isFinite(value);
}