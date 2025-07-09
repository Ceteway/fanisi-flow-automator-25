import React from 'react';
import { Document } from '../types/document';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { exportToWord, exportToHTML, exportToText } from '../utils/exportHandler';
import { ArrowLeft, Download, FileText } from 'lucide-react';

interface DocumentPreviewProps {
  document: Document;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose }) => {
  const handleExportWord = async () => {
    try {
      await exportToWord(document);
    } catch (error) {
      console.error('Error exporting to Word:', error);
    }
  };

  const handleExportHTML = () => {
    try {
      exportToHTML(document);
    } catch (error) {
      console.error('Error exporting to HTML:', error);
    }
  };

  const handleExportText = () => {
    try {
      exportToText(document);
    } catch (error) {
      console.error('Error exporting to text:', error);
    }
  };

  // Count filled and empty blank spaces
  const filledSpaces = document.blankSpaces.filter(bs => bs.filled).length;
  const totalSpaces = document.blankSpaces.length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-xl">{document.name}</CardTitle>
          <Badge variant="outline">
            {document.type === 'system' ? 'System Document' : 'User Template'}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={handleExportWord}>
              <Download className="h-4 w-4 mr-1" />
              DOCX
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportHTML}>
              <Download className="h-4 w-4 mr-1" />
              HTML
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportText}>
              <Download className="h-4 w-4 mr-1" />
              TXT
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            Last modified: {document.modifiedAt.toLocaleString()}
          </div>
          <Badge variant={filledSpaces === totalSpaces ? "success" : "secondary"}>
            {filledSpaces}/{totalSpaces} blanks filled
          </Badge>
        </div>
        
        <div className="border rounded-md p-6 bg-white min-h-[500px] max-h-[600px] overflow-y-auto">
          {document.content ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: document.content }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText className="h-12 w-12 mb-2" />
              <p>No content to preview</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentPreview;