/**
 * Returns the PDF file name from the URL.
 */
export default (documentUrl: string): string => {
  // Find the file name without the extension from the URL.
  const matches = documentUrl.match(/([^/]+)\.pdf$/i);

  // If the file name cannot be found in the URL.
  if (!matches)
    return 'document.pdf';

  // Returns the filename found from the URL.
  return `${matches[1]}.pdf`;
}