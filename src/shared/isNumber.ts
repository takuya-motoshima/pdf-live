/**
 * Check if `value` is a number.
 *
 * @param   {any}     value The value to check.
 * @returns {boolean}       Returns `true` if `value` is a number, else `false`.
 */
export default (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
}