/**
 * Relative path to URL.
 */
export default (rel: string): string => {
  // If rel is already an absolute path, return it as is.
  if (rel.match(/^(https?:)?\/\//))
    return rel;
  else if (rel.match(/^\//))
    return `${location.origin}/${rel.replace(/^\//, '')}`
  const base = location.href;
  const st = base.split('/');
  const arr = rel.split('/');

  // ignore the current file name (or no string)
  st.pop();
  // (ignore if 'base' is the current folder without having slash in trail)
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == '.')
      continue;
    if (arr[i] == '..')
      st.pop();
    else
      st.push(arr[i]);
  }
  return st.join('/');
}