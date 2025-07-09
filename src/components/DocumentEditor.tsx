import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Document, BlankSpace } from '../types/document';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { extractBlankSpacesFromContent, detectAndConvertBlankSpaces } from '../utils/documentParser';
import { fillBlankSpace, insertBlankSpace } from '../utils/blankSpaceManager';
import { Save, Eye, Plus, Type } from 'lucide-react';
import BlankSpaceNavigator from './BlankSpaceNavigator';
import DocumentPreview from './DocumentPreview';

interface DocumentEditorProps {
  document: Document | null;
  onSave: (document: Document) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document, onSave }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [blankSpaces, setBlankSpaces] = useState<BlankSpace[]>([]);
  const [currentBlankSpaceId, setCurrentBlankSpaceId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (document) {
      setName(document.name);
      setContent(document.content);
      setBlankSpaces(document.blankSpaces);
    }
  }, [document]);

  const handleContentChange = (value: string) => {
    setContent(value);
    // Extract blank spaces from the updated content
    const updatedBlankSpaces = extractBlankSpacesFromContent(value);
    setBlankSpaces(updatedBlankSpaces);
  };

  const handleSave = () => {
    if (!document) return;
    
    const updatedDocument: Document = {
      ...document,
      name,
      content,
      blankSpaces,
      modifiedAt: new Date()
    };
    
    onSave(updatedDocument);
  };

  const handleAddBlankSpace = () => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    
    if (selection) {
      const position = selection.index;
      const { content: newContent, blankSpace } = insertBlankSpace(content, position);
      
      setContent(newContent);
      setBlankSpaces([...blankSpaces, blankSpace]);
      setCurrentBlankSpaceId(blankSpace.id);
    }
  };

  const handleSelectBlankSpace = (id: string) => {
    setCurrentBlankSpaceId(id);
    
    // Find the blank space in the content and scroll to it
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const blankSpaceRegex = new RegExp(`<span class="blank-space[^"]*" data-id="${id}"[^>]*>.*?<\/span>`);
      const match = blankSpaceRegex.exec(content);
      
      if (match) {
        const index = match.index;
        quill.setSelection(index, 0);
        
        // Scroll the blank space into view
        const editorContainer = quillRef.current.getEditor().root.parentElement;
        if (editorContainer) {
          const blankSpaceElement = editorContainer.querySelector(`[data-id="${id}"]`);
          if (blankSpaceElement) {
            blankSpaceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }
  };

  const handleFillBlankSpace = (id: string, text: string) => {
    const newContent = fillBlankSpace(content, id, text);
    setContent(newContent);
    
    // Update the blank space in the list
    const updatedBlankSpaces = blankSpaces.map(bs => 
      bs.id === id 
        ? { ...bs, filled: true, content: text } 
        : bs
    );
    
    setBlankSpaces(updatedBlankSpaces);
  };

  const handleDetectBlankSpaces = () => {
    const enhancedContent = detectAndConvertBlankSpaces(content);
    setContent(enhancedContent);
    
    // Extract blank spaces from the enhanced content
    const detectedBlankSpaces = extractBlankSpacesFromContent(enhancedContent);
    setBlankSpaces(detectedBlankSpaces);
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No document selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="document-name">Document Name</Label>
          <Input
            id="document-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDetectBlankSpaces}>
            <Type className="h-4 w-4 mr-2" />
            Detect Blanks
          </Button>
          <Button variant="outline" onClick={handleAddBlankSpace}>
            <Plus className="h-4 w-4 mr-2" />
            Add Blank
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Document Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[500px]">
                <ReactQuill
                  ref={quillRef}
                  value={content}
                  onChange={handleContentChange}
                  theme="snow"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'indent': '-1'}, { 'indent': '+1' }],
                      [{ 'align': [] }],
                      ['clean']
                    ],
                  }}
                  className="h-[450px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <BlankSpaceNavigator
            blankSpaces={blankSpaces}
            currentBlankSpaceId={currentBlankSpaceId}
            onSelectBlankSpace={handleSelectBlankSpace}
            onFillBlankSpace={handleFillBlankSpace}
          />
        </div>
      </div>

      {showPreview && (
        <DocumentPreview
          document={{
            ...document,
            name,
            content,
            blankSpaces,
            modifiedAt: new Date()
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default DocumentEditor;