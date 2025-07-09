import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { parseWordDocument, validateDocumentFile } from '../utils/documentParser';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileProcessed: (content: string, fileName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    setError(null);
    
    if (!validateDocumentFile(selectedFile)) {
      setError('Invalid file type. Please upload a Word document (.docx, .doc), text file, or HTML file.');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    setError(null);
    
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    if (!validateDocumentFile(droppedFile)) {
      setError('Invalid file type. Please upload a Word document (.docx, .doc), text file, or HTML file.');
      return;
    }
    
    if (droppedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setFile(droppedFile);
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log(`Processing file: ${file.name} (${file.type})`);
      let content: string;
      
      if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        console.log('Processing as Word document');
        content = await parseWordDocument(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        console.log('Processing as plain text');
        content = await file.text();
        // Wrap plain text in paragraph tags for consistent formatting
        content = `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
        console.log('Processing as HTML');
        content = await file.text();
      } else {
        throw new Error('Unsupported file type');
      }
      
      console.log('File processed successfully');
      
      // Pass the processed content to the parent component
      onFileProcessed(content, file.name.replace(/\.[^/.]+$/, ""));
      
      // Reset the file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          } transition-colors`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-3">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="flex justify-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setError(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Change File
                </Button>
                <Button 
                  size="sm"
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process Document'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Drag and drop your document here</p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <input
                type="file"
                accept=".doc,.docx,.txt,.html"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
                id="document-upload"
              />
              <Button variant="outline" asChild>
                <Label htmlFor="document-upload" className="cursor-pointer">
                  Browse Files
                </Label>
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: Word (.docx, .doc), Text (.txt), HTML (.html)
              </p>
            </>
          )}
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;