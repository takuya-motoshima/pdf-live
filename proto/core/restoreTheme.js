import setTheme from './setTheme.js';

/**
 * Restore theme.
 */
export default () => {
  // Last saved theme.
  const theme = localStorage.getItem('theme');

  // Restore if you have a saved theme.
  if (theme)
    setTheme(theme);
}