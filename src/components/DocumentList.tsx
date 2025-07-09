import React, { useState } from 'react';
import { Document } from '../types/document';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, FileText, Trash2, Edit, Calendar, SortAsc } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onSelectDocument: (document: Document) => void;
  onDeleteDocument: (documentId: string) => void;
  type: 'system' | 'template';
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onSelectDocument,
  onDeleteDocument,
  type
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
    }
  });

  const toggleSort = () => {
    setSortBy(sortBy === 'name' ? 'date' : 'name');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={toggleSort} title={`Sort by ${sortBy === 'name' ? 'date' : 'name'}`}>
          <SortAsc className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {sortedDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm 
                ? 'No documents match your search' 
                : `No ${type === 'system' ? 'system' : 'user'} documents found`}
            </p>
          </div>
        ) : (
          sortedDocuments.map(document => (
            <Card 
              key={document.id} 
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectDocument(document)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">{document.name}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(document.modifiedAt).toLocaleDateString()} 
                          {' · '}
                          {document.blankSpaces.length} blank spaces
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Badge variant={type === 'system' ? 'secondary' : 'default'} className="mr-2">
                      {type === 'system' ? 'System' : 'Template'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(document.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentList;