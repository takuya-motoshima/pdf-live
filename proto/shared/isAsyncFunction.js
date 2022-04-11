/**
 * Checks whether a value is an async function.
 *
 * @param   {Function}
 * @returns {boolean}
 */
export default fn => {
  return fn && fn.constructor && fn.constructor === Object.getPrototypeOf(async function(){}).constructor;
}