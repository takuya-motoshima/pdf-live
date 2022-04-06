/**
 * Set the theme.
 *
 * @param {string} theme
 */
export default theme => {
  // Returns an error if the theme is anything other than light or dark.
  if (theme !== 'dark' && theme !== 'light')
    throw new Error('The theme can be either light or dark');

  // Update theme.
  document.documentElement.setAttribute('data-theme', theme);

  // Save updated themes to local storage.
  localStorage.setItem('theme', theme);
}