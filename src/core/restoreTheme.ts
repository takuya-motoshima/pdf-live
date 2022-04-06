import setTheme from '~/core/setTheme';

/**
 * Restore theme.
 */
export default (): void => {
  // Last saved theme.
  const theme = localStorage.getItem('theme');

  // Restore if you have a saved theme.
  if (theme)
    setTheme(theme);
}