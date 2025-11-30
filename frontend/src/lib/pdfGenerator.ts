import jsPDF from 'jspdf';

export interface ItineraryData {
  artistName: string;
  eventName: string;
  eventBannerUrl?: string | null;
  venueAddress?: string;
  promotorName?: string;
  promotorPhone?: string;
  artistLiaisonName?: string;
  artistLiaisonPhone?: string;
  runningOrder?: string;
  stageSetDetails?: string;
  travelDetails?: string;
  hotelDetails?: string;
  groundDetails?: string;
  technicalRiderDetails?: string;
}

export async function generateItineraryPDF(data: ItineraryData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap and return height used
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, fontStyle: string = 'normal'): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    const lines = doc.splitTextToSize(text || '', maxWidth);
    doc.text(lines, x, y);
    return lines.length * (fontSize * 0.4); // Approximate line height in mm
  };

  // Add banner image if available
  if (data.eventBannerUrl) {
    try {
      const bannerUrl = data.eventBannerUrl.startsWith('http') 
        ? data.eventBannerUrl 
        : `${window.location.origin}${data.eventBannerUrl}`;
      
      // Determine image format from URL
      const getImageFormat = (url: string): string => {
        const lower = url.toLowerCase();
        if (lower.includes('.png')) return 'PNG';
        if (lower.includes('.gif')) return 'GIF';
        if (lower.includes('.webp')) return 'WEBP';
        return 'JPEG'; // Default
      };
      
      const imgFormat = getImageFormat(bannerUrl);
      
      // Fetch image as blob to handle CORS and convert to base64
      const response = await fetch(bannerUrl);
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            try {
              const imgData = reader.result as string;
              const img = new Image();
              
              img.onload = () => {
                const imgWidth = contentWidth;
                const imgHeight = (img.height / img.width) * imgWidth;
                const maxHeight = 50; // Max banner height in mm
                
                if (imgHeight > maxHeight) {
                  const scaledWidth = (img.width / img.height) * maxHeight;
                  doc.addImage(imgData, imgFormat, margin, yPos, scaledWidth, maxHeight);
                  yPos += maxHeight + 10;
                } else {
                  doc.addImage(imgData, imgFormat, margin, yPos, imgWidth, imgHeight);
                  yPos += imgHeight + 10;
                }
                resolve();
              };
              
              img.onerror = () => {
                console.error('Failed to load banner image');
                resolve(); // Continue without banner
              };
              
              img.src = imgData;
            } catch (error) {
              console.error('Error processing banner:', error);
              resolve(); // Continue without banner
            }
          };
          
          reader.onerror = () => {
            console.error('Failed to read banner image');
            resolve(); // Continue without banner
          };
          
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error('Error processing banner:', error);
      // Continue without banner
    }
  }

  // Title
  checkPageBreak(20);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const title = `Itinerary for ${data.artistName}`;
  doc.text(title, margin, yPos);
  yPos += 8;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(`for ${data.eventName}`, margin, yPos);
  yPos += 15;

  // Event Details Section
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Details', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (data.venueAddress) {
    const height = addText(`Venue Address: ${data.venueAddress}`, margin, yPos, contentWidth, 10);
    yPos += height + 2;
  }
  
  if (data.promotorName) {
    const promotorText = `Promotor: ${data.promotorName}${data.promotorPhone ? ` - ${data.promotorPhone}` : ''}`;
    const height = addText(promotorText, margin, yPos, contentWidth, 10);
    yPos += height + 2;
  }
  
  if (data.artistLiaisonName) {
    const liaisonText = `Artist Liaison: ${data.artistLiaisonName}${data.artistLiaisonPhone ? ` - ${data.artistLiaisonPhone}` : ''}`;
    const height = addText(liaisonText, margin, yPos, contentWidth, 10);
    yPos += height + 2;
  }
  
  yPos += 5;

  // Running Order
  if (data.runningOrder) {
    checkPageBreak(30);
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Running Order', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const runningOrderLines = doc.splitTextToSize(data.runningOrder, contentWidth);
    doc.text(runningOrderLines, margin, yPos);
    yPos += runningOrderLines.length * 4 + 5;
  }

  // Artist Details Section (no header, just show the details directly)
  checkPageBreak(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Stage & Set Details
  if (data.stageSetDetails) {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Stage & Set Details', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const stageLines = doc.splitTextToSize(data.stageSetDetails, contentWidth);
    doc.text(stageLines, margin, yPos);
    yPos += stageLines.length * 4 + 5;
  }

  // Travel Details
  if (data.travelDetails) {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Travel Details', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const travelLines = doc.splitTextToSize(data.travelDetails, contentWidth);
    doc.text(travelLines, margin, yPos);
    yPos += travelLines.length * 4 + 5;
  }

  // Hotel Details
  if (data.hotelDetails) {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Hotel Details', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const hotelLines = doc.splitTextToSize(data.hotelDetails, contentWidth);
    doc.text(hotelLines, margin, yPos);
    yPos += hotelLines.length * 4 + 5;
  }

  // Ground Details
  if (data.groundDetails) {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ground Details', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const groundLines = doc.splitTextToSize(data.groundDetails, contentWidth);
    doc.text(groundLines, margin, yPos);
    yPos += groundLines.length * 4 + 5;
  }

  // Technical Rider Details
  if (data.technicalRiderDetails) {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Technical Rider Details', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const techLines = doc.splitTextToSize(data.technicalRiderDetails, contentWidth);
    doc.text(techLines, margin, yPos);
    yPos += techLines.length * 4 + 5;
  }

  return doc;
}

