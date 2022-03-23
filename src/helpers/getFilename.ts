/**
 * Returns the PDF file name from the URL.
 *
 * @param   {string} url
 * @returns {string} PDF file name.
 */
export default (url: string): string => {
  // Find the file name without the extension from the URL.
  const matches = url.match(/([^/]+)\.pdf$/i);

  // If the file name cannot be found in the URL.
  if (!matches)
    return 'document.pdf';

  // Returns the filename found from the URL.
  return `${matches[1]}.pdf`;
}