import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { FileText, Upload, Database, BookTemplate as FileTemplate } from 'lucide-react';

interface TabSystemProps {
  activeTab: 'upload' | 'system' | 'templates';
  onTabChange: (tab: 'upload' | 'system' | 'templates') => void;
  children: React.ReactNode;
}

const TabSystem: React.FC<TabSystemProps> = ({ activeTab, onTabChange, children }) => {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'upload' | 'system' | 'templates')}>
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="upload" className="flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          <span>Upload</span>
        </TabsTrigger>
        <TabsTrigger value="system" className="flex items-center">
          <Database className="h-4 w-4 mr-2" />
          <span>System Documents</span>
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center">
          <FileTemplate className="h-4 w-4 mr-2" />
          <span>My Templates</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab} className="mt-0">
        {children}
      </TabsContent>
    </Tabs>
  );
};

export default TabSystem;