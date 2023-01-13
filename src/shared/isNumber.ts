/**
 * Check if `value` is a number.
 */
export default (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
}