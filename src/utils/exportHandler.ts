import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Document } from '../types/document';

export const exportToWord = async (document: Document): Promise<void> => {
  try {
    // Convert HTML content to plain text for DOCX
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = document.content;
    
    // Extract text content, preserving paragraph structure
    const paragraphTexts: string[] = [];
    const paragraphElements = tempDiv.querySelectorAll('p');
    
    if (paragraphElements.length > 0) {
      paragraphElements.forEach(p => {
        // Replace blank spaces with their content or underscores
        const paragraphText = p.innerHTML
          .replace(/<span class="blank-space[^>]*>(.*?)<\/span>/g, (match, content) => {
            return content.startsWith('.') ? '_'.repeat(content.length) : content;
          })
          .replace(/<[^>]*>/g, ''); // Remove all HTML tags
        
        paragraphTexts.push(paragraphText);
      });
    } else {
      // If no paragraphs, use the whole content
      const plainText = document.content
        .replace(/<span class="blank-space[^>]*>(.*?)<\/span>/g, (match, content) => {
          return content.startsWith('.') ? '_'.repeat(content.length) : content;
        })
        .replace(/<[^>]*>/g, ''); // Remove all HTML tags
      
      paragraphTexts.push(plainText);
    }
    
    // Create DOCX paragraphs
    const paragraphs = paragraphTexts.map(text => {
      return new Paragraph({
        children: [new TextRun({ text })],
        alignment: AlignmentType.LEFT
      });
    });
    
    // Create DOCX document
    const doc = new DocxDocument({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });
    
    // Generate and save the file
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${document.name}.docx`);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw new Error('Failed to export document to Word format');
  }
};

export const exportToHTML = (document: Document): void => {
  try {
    // Create a blob with the HTML content
    const blob = new Blob([document.content], { type: 'text/html' });
    saveAs(blob, `${document.name}.html`);
  } catch (error) {
    console.error('Error exporting to HTML:', error);
    throw new Error('Failed to export document to HTML format');
  }
};

export const exportToText = (document: Document): void => {
  try {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = document.content;
    
    // Convert HTML to plain text
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Create a blob with the plain text content
    const blob = new Blob([plainText], { type: 'text/plain' });
    saveAs(blob, `${document.name}.txt`);
  } catch (error) {
    console.error('Error exporting to text:', error);
    throw new Error('Failed to export document to text format');
  }
};

export const exportToJSON = (document: Document): void => {
  try {
    // Create a JSON representation of the document
    const json = JSON.stringify(document, null, 2);
    
    // Create a blob with the JSON content
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${document.name}.json`);
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw new Error('Failed to export document to JSON format');
  }
};