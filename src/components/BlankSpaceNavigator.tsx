import React from 'react';
import { BlankSpace } from '../types/document';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ChevronUp, ChevronDown, Edit3, Check, X } from 'lucide-react';

interface BlankSpaceNavigatorProps {
  blankSpaces: BlankSpace[];
  currentBlankSpaceId: string | null;
  onSelectBlankSpace: (id: string) => void;
  onFillBlankSpace: (id: string, content: string) => void;
}

const BlankSpaceNavigator: React.FC<BlankSpaceNavigatorProps> = ({
  blankSpaces,
  currentBlankSpaceId,
  onSelectBlankSpace,
  onFillBlankSpace
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const handleEdit = (blankSpace: BlankSpace) => {
    setEditingId(blankSpace.id);
    setEditValue(blankSpace.content || '');
  };

  const handleSave = () => {
    if (editingId) {
      onFillBlankSpace(editingId, editValue);
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const currentIndex = blankSpaces.findIndex(b => b.id === currentBlankSpaceId);
  
  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      onSelectBlankSpace(blankSpaces[currentIndex - 1].id);
    }
  };

  const navigateToNext = () => {
    if (currentIndex < blankSpaces.length - 1) {
      onSelectBlankSpace(blankSpaces[currentIndex + 1].id);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Blank Spaces ({blankSpaces.length})</span>
          <div className="flex space-x-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToPrevious}
              disabled={currentIndex <= 0}
              className="h-7 w-7 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToNext}
              disabled={currentIndex >= blankSpaces.length - 1 || currentIndex === -1}
              className="h-7 w-7 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
        {blankSpaces.length === 0 ? (
          <div className="text-center py-3 text-sm text-gray-500">
            No blank spaces found in this document
          </div>
        ) : (
          blankSpaces.map((blankSpace) => (
            <div 
              key={blankSpace.id} 
              className={`p-2 rounded-md ${blankSpace.id === currentBlankSpaceId ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
            >
              {editingId === blankSpace.id ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="flex-1"
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleSave}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleCancel}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => onSelectBlankSpace(blankSpace.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant={blankSpace.filled ? "default" : "outline"} className="h-6">
                      {blankSpace.filled ? "Filled" : "Empty"}
                    </Badge>
                    <span className="text-sm truncate max-w-[150px]">
                      {blankSpace.content || blankSpace.placeholder || `Blank #${blankSpaces.indexOf(blankSpace) + 1}`}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(blankSpace);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default BlankSpaceNavigator;