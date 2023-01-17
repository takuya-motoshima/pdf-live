/**
 * Download PDF.
 */
export default async (pdfDocument: any, downloadName: string): Promise<void> => {
  // Access raw PDF data.
  const data = await pdfDocument.getData();

  // Create a Uint8Array object.
  const arr = new Uint8Array(data);

   // Convert Uint8Array to a file object.
  const file = new File([arr], downloadName, {type: 'application/pdf'});

  // Create anchor element for PDF download.
  const a = document.createElement('a');

  // Set the download file name.
  a.download = downloadName;

  // tabnabbing.
  a.rel = 'noopener'; 

  // Load PDF into anchor element.
  a.href = URL.createObjectURL(file);

  // Release the URL so that it doesn't keep the file reference.
  setTimeout(() => URL.revokeObjectURL(a.href), 4E4);

  // Start PDF download.
  setTimeout(() => a.dispatchEvent(new MouseEvent('click')), 0);
}