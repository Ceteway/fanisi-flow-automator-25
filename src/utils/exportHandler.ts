import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Document } from '../types/document';

export const exportToWord = async (document: Document): Promise<void> => {
  try {
    // Convert HTML content to plain text for DOCX
    const plainText = document.content
      .replace(/<span class="blank-space[^>]*>(.*?)<\/span>/g, (match, content) => {
        // Replace blank spaces with their content or underscores
        return content.startsWith('.') ? '_'.repeat(content.length) : content;
      })
      .replace(/<[^>]*>/g, ''); // Remove all HTML tags
    
    // Split text into paragraphs
    const paragraphs = plainText.split('\n').map(text => {
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
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${document.name}.docx`);
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
    // Convert HTML to plain text
    const plainText = document.content
      .replace(/<span class="blank-space[^>]*>(.*?)<\/span>/g, (match, content) => {
        // Replace blank spaces with their content or underscores
        return content.startsWith('.') ? '_'.repeat(content.length) : content;
      })
      .replace(/<[^>]*>/g, ''); // Remove all HTML tags
    
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