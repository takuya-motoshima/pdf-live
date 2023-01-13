/**
 * Checks whether a value is an async function.
 */
export default (fn: Function): boolean => {
  return fn && fn.constructor && fn.constructor === Object.getPrototypeOf(async function(){}).constructor;
}