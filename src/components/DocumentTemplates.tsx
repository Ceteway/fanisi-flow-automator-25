import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { extractBlankSpacesFromContent } from '../utils/documentParser';
import { Document, BlankSpace } from '../types/document';
import TabSystem from './TabSystem';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';
import DocumentEditor from './DocumentEditor';
import { FileText, Upload } from 'lucide-react';

const DocumentTemplates: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'system' | 'templates'>('upload');
  const [systemDocuments, setSystemDocuments] = useState<Document[]>([]);
  const [userTemplates, setUserTemplates] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load documents from localStorage on component mount
  useEffect(() => {
    const savedSystemDocuments = localStorage.getItem('systemDocuments');
    const savedUserTemplates = localStorage.getItem('userTemplates');
    
    if (savedSystemDocuments) {
      try {
        const parsed = JSON.parse(savedSystemDocuments);
        // Convert string dates back to Date objects
        const documents = parsed.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          modifiedAt: new Date(doc.modifiedAt)
        }));
        setSystemDocuments(documents);
      } catch (error) {
        console.error('Error parsing system documents:', error);
      }
    }
    
    if (savedUserTemplates) {
      try {
        const parsed = JSON.parse(savedUserTemplates);
        // Convert string dates back to Date objects
        const templates = parsed.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          modifiedAt: new Date(template.modifiedAt)
        }));
        setUserTemplates(templates);
      } catch (error) {
        console.error('Error parsing user templates:', error);
      }
    }
  }, []);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('systemDocuments', JSON.stringify(systemDocuments));
  }, [systemDocuments]);

  useEffect(() => {
    localStorage.setItem('userTemplates', JSON.stringify(userTemplates));
  }, [userTemplates]);

  const handleFileProcessed = (content: string, fileName: string) => {
    // Extract blank spaces from the content
    const blankSpaces = extractBlankSpacesFromContent(content);
    
    // Create a new document
    const newDocument: Document = {
      id: `doc_${Date.now()}`,
      name: fileName,
      content,
      originalContent: content,
      createdAt: new Date(),
      modifiedAt: new Date(),
      type: 'system',
      blankSpaces
    };
    
    // Add to system documents
    setSystemDocuments([newDocument, ...systemDocuments]);
    
    // Set as current document and switch to editing mode
    setCurrentDocument(newDocument);
    setIsEditing(true);
    
    // Switch to system tab
    setActiveTab('system');
  };

  const handleSelectDocument = (document: Document) => {
    setCurrentDocument(document);
    setIsEditing(true);
  };

  const handleDeleteDocument = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      if (activeTab === 'system') {
        setSystemDocuments(systemDocuments.filter(doc => doc.id !== documentId));
        if (currentDocument?.id === documentId) {
          setCurrentDocument(null);
          setIsEditing(false);
        }
      } else {
        setUserTemplates(userTemplates.filter(template => template.id !== documentId));
        if (currentDocument?.id === documentId) {
          setCurrentDocument(null);
          setIsEditing(false);
        }
      }
    }
  };

  const handleSaveDocument = (updatedDocument: Document) => {
    if (updatedDocument.type === 'system') {
      setSystemDocuments(systemDocuments.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      ));
    } else {
      setUserTemplates(userTemplates.map(template => 
        template.id === updatedDocument.id ? updatedDocument : template
      ));
    }
    
    setCurrentDocument(updatedDocument);
    
    // Show success message
    alert('Document saved successfully!');
  };

  const handleCreateTemplate = () => {
    if (!currentDocument) return;
    
    // Create a new template from the current document
    const newTemplate: Document = {
      ...currentDocument,
      id: `template_${Date.now()}`,
      name: `${currentDocument.name} (Template)`,
      type: 'template',
      createdAt: new Date(),
      modifiedAt: new Date()
    };
    
    // Add to user templates
    setUserTemplates([newTemplate, ...userTemplates]);
    
    // Switch to templates tab
    setActiveTab('templates');
    
    // Show success message
    alert('Template created successfully!');
  };

  const handleBackToList = () => {
    setIsEditing(false);
    setCurrentDocument(null);
  };

  const renderTabContent = () => {
    if (isEditing && currentDocument) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBackToList}>
              Back to List
            </Button>
            {currentDocument.type === 'system' && (
              <Button onClick={handleCreateTemplate}>
                Save as Template
              </Button>
            )}
          </div>
          <DocumentEditor 
            document={currentDocument} 
            onSave={handleSaveDocument} 
          />
        </div>
      );
    }
    
    switch (activeTab) {
      case 'upload':
        return <FileUpload onFileProcessed={handleFileProcessed} />;
      case 'system':
        return (
          <DocumentList 
            documents={systemDocuments} 
            onSelectDocument={handleSelectDocument} 
            onDeleteDocument={handleDeleteDocument}
            type="system"
          />
        );
      case 'templates':
        return (
          <DocumentList 
            documents={userTemplates} 
            onSelectDocument={handleSelectDocument} 
            onDeleteDocument={handleDeleteDocument}
            type="template"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Templates</h2>
          <p className="text-gray-600">Create, edit, and manage document templates with blank spaces</p>
        </div>
        {!isEditing && (
          <div className="flex space-x-2">
            <Button 
              onClick={() => setActiveTab('upload')}
              variant={activeTab === 'upload' ? 'default' : 'outline'}
              className="flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
            <Button 
              onClick={() => {
                // Create a new blank template
                const newTemplate: Document = {
                  id: `template_${Date.now()}`,
                  name: 'New Template',
                  content: '<p>Start typing your template here...</p>',
                  createdAt: new Date(),
                  modifiedAt: new Date(),
                  type: 'template',
                  blankSpaces: []
                };
                
                setUserTemplates([newTemplate, ...userTemplates]);
                setCurrentDocument(newTemplate);
                setIsEditing(true);
                setActiveTab('templates');
              }}
              variant="outline"
              className="flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <TabSystem activeTab={activeTab} onTabChange={setActiveTab}>
            {renderTabContent()}
          </TabSystem>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentTemplates;