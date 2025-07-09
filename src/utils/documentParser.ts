import mammoth from 'mammoth';
import { BlankSpace } from '../types/document';

export const parseWordDocument = async (file: File): Promise<string> => {
  try {
    console.log('Starting Word document parsing...');
    const arrayBuffer = await file.arrayBuffer();
    
    // Use mammoth to convert Word document to HTML
    console.log('Converting Word document to HTML with mammoth...');
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    if (!result || !result.value) {
      console.error('Mammoth returned empty result');
      throw new Error('Failed to extract content from Word document');
    }
    
    console.log('Word document converted successfully');
    
    // Clean up the HTML
    let html = result.value;
    
    // Replace common placeholder patterns with blank spaces
    html = detectAndConvertBlankSpaces(html);
    
    return html;
  } catch (error) {
    console.error('Error parsing Word document:', error);
    throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const validateDocumentFile = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain', // .txt
    'application/rtf', // .rtf
    'text/html' // .html
  ];
  
  // Check by MIME type
  if (validTypes.includes(file.type)) {
    return true;
  }
  
  // Check by extension as fallback
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['docx', 'doc', 'txt', 'rtf', 'html'].includes(extension || '');
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove invalid characters and trim
  return fileName
    .replace(/[^\w\s.-]/g, '') // Remove invalid chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
};

export const detectFileType = async (file: File): Promise<string> => {
  // Check by MIME type first
  if (file.type) {
    return file.type;
  }
  
  // Fallback to extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    case 'txt':
      return 'text/plain';
    case 'rtf':
      return 'application/rtf';
    case 'html':
      return 'text/html';
    default:
      return 'application/octet-stream';
  }
};

export const detectAndConvertBlankSpaces = (content: string): string => {
  // Patterns to detect common placeholders in documents
  const patterns = [
    { regex: /_{3,}/g, type: 'underscores' }, // Three or more underscores
    { regex: /\.{3,}/g, type: 'dots' }, // Three or more dots
    { regex: /\[([^\]]*)\]/g, type: 'brackets' }, // Text in square brackets
    { regex: /\{\{([^}]*)\}\}/g, type: 'curly' }, // Text in double curly braces
    { regex: /__+([^_]*)__+/g, type: 'underscores_with_text' }, // Text surrounded by underscores
    { regex: /\(\s*\)/g, type: 'empty_parentheses' }, // Empty parentheses
  ];
  
  let modifiedContent = content;
  let blankSpaceId = 1;
  
  patterns.forEach(pattern => {
    modifiedContent = modifiedContent.replace(pattern.regex, (match, capturedText) => {
      const id = `blank_${Date.now()}_${blankSpaceId++}`;
      const length = match.length;
      const text = capturedText || '';
      
      // If there's captured text (like in brackets or curly braces), use it as a filled value
      if (text && text.trim() !== '') {
        return `<span class="blank-space filled" data-id="${id}" data-length="${length}">${text}</span>`;
      }
      
      // Otherwise, create an empty blank space
      return `<span class="blank-space" data-id="${id}" data-length="${length}">${'.'.repeat(length)}</span>`;
    });
  });
  
  return modifiedContent;
};

export const extractBlankSpacesFromContent = (content: string): BlankSpace[] => {
  const blankSpaces: BlankSpace[] = [];
  const blankSpaceRegex = /<span class="blank-space([^"]*)" data-id="([^"]*)" data-length="([^"]*)"[^>]*>(.*?)<\/span>/g;
  
  let match;
  while ((match = blankSpaceRegex.exec(content)) !== null) {
    const isFilled = match[1]?.includes('filled') || false;
    const id = match[2];
    const length = parseInt(match[3]);
    const innerContent = match[4];
    
    blankSpaces.push({
      id,
      position: match.index,
      length,
      filled: isFilled,
      content: isFilled ? innerContent : undefined,
      placeholder: isFilled ? undefined : `${'_'.repeat(length)}`
    });
  }
  
  return blankSpaces;
};