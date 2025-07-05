export const generateInvoicePDF = async (element: HTMLElement | null, invoiceNumber: string) => {
  if (!element) {
    console.error('Element not found for PDF generation');
    return;
  }

  try {
    // Import html2canvas and jsPDF dynamically
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    // Configure html2canvas options for better quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions - A4 size
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    
    // Calculate image dimensions to fit A4
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF with A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add logo to PDF
    const logoUrl = "/logo.jpg";
    try {
      // Create a temporary image element to load the logo
      const logoImg = new Image();
      logoImg.crossOrigin = "Anonymous";  // Important for CORS
      logoImg.src = logoUrl;
      
      // Wait for the image to load
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      
      // Create a canvas for the logo
      const logoCanvas = document.createElement('canvas');
      logoCanvas.width = logoImg.width;
      logoCanvas.height = logoImg.height;
      const logoCtx = logoCanvas.getContext('2d');
      logoCtx?.drawImage(logoImg, 0, 0);
      
      // Add logo to PDF
      const logoData = logoCanvas.toDataURL('image/png');
      const logoWidth = 30; // in mm
      const logoHeight = 30; // in mm
      const logoX = (pdfWidth - logoWidth) / 2; // Center horizontally
      pdf.addImage(logoData, 'PNG', logoX, 5, logoWidth, logoHeight);
    } catch (logoError) {
      console.warn('Could not add logo to PDF:', logoError);
      // Continue without logo if there's an error
    }
    
    // Add image to PDF, centered and scaled to fit
    pdf.addImage(imgData, 'PNG', 0, 40, imgWidth, Math.min(imgHeight, pdfHeight - 40));
    
    // Download the PDF
    pdf.save(`Invoice-${invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Fallback: open print dialog
    window.print();
  }
};