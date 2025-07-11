import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TemplateService } from "@/services/templateService";
import { SystemTemplateService, SystemTemplate } from "@/services/systemTemplateService";
import AIVariableAssistant from "./AIVariableAssistant";
import { AIDocumentProcessor } from "@/services/aiDocumentProcessor";
import { TemplateCategory } from "@/types/database";
import { 
  FileText, 
  Upload, 
  X,
  Wand2,
  Plus,
  Bot,
  Edit3,
  CheckCircle,
  AlertCircle,
  FolderOpen
} from "lucide-react";
import mammoth from "mammoth";

// Helper function to highlight blank fields
const highlightBlankFields = (content: string): string => {
  // Patterns to match blank fields (dots, dashes, underscores)
  const patterns = [
    /\.{3,}/g,           // Three or more dots
    /-{3,}/g,            // Three or more dashes
    /_{3,}/g,            // Three or more underscores
    /\[([^\]]*)\]/g,     // Bracketed text
    /\(([^)]*)\)/g,      // Parenthetical placeholders
  ];
  
  let highlightedContent = content;
  
  patterns.forEach(pattern => {
    highlightedContent = highlightedContent.replace(pattern, (match) => {
      return `<span class="bg-green-200 hover:bg-green-300 cursor-pointer px-1 rounded" data-placeholder="${match}">${match}</span>`;
    });
  });
  
  return highlightedContent;
};

interface TemplateCreatorProps {
  onClose: () => void;
  onTemplateCreated: (newTemplate: any) => void;
}

const TemplateCreator = ({ onClose, onTemplateCreated }: TemplateCreatorProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'agreements' as TemplateCategory,
    content: ''
  });
  const [extractedVariables, setExtractedVariables] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isTemplateUploaded, setIsTemplateUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [templateSource, setTemplateSource] = useState<'upload' | 'system'>('upload');
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const [variableName, setVariableName] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processTemplateFile(file, file.name);
    }
  };

  const processTemplateFile = async (file: File, fileName: string) => {
    setIsExtracting(true);
    setTemplateSource('upload');
    
    try {
      let text = '';
      
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        text = result.value;
        
        // Clean up the extracted text while preserving structure
        text = text
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        if (result.messages.length > 0) {
          console.log('Document conversion messages:', result.messages);
        }
      } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
        text = await file.text();
      } else {
        throw new Error('Unsupported file format. Please upload a .docx, .doc, or .txt file.');
      }

      setFormData(prev => ({ ...prev, content: text }));
      setIsTemplateUploaded(true);
      setUploadedFileName(fileName);
      
      if (!formData.name) {
        const filename = fileName.replace(/\.[^/.]+$/, "");
        setFormData(prev => ({ ...prev, name: filename }));
      }

      // Auto-extract variables from uploaded content
      const variables = TemplateService.extractVariablesFromContent(text);
      setExtractedVariables(variables);

      setShowEditor(true);
      setShowAIAssistant(true);

      toast({
        title: "Document Uploaded Successfully",
        description: `Template extracted from ${fileName}. Found ${variables.length} existing variables. AI Assistant is ready to help convert blank fields.`,
      });
    } catch (error) {
      console.error('Template upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Could not read the template file. Please try a different file format.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePlaceholderClick = (placeholder: string, context: string) => {
    setSelectedPlaceholder(placeholder);
    const suggestedName = AIDocumentProcessor.generateSmartVariableName(context, placeholder);
    setVariableName(suggestedName);
  };

  const handleReplacePlaceholder = () => {
    if (!selectedPlaceholder || !variableName) return;

    const placeholder = `{{${variableName}}}`;
    const updatedContent = formData.content.replace(selectedPlaceholder, placeholder);
    setFormData(prev => ({ ...prev, content: updatedContent }));
    
    // Add to variables if not exists
    if (!extractedVariables.includes(variableName)) {
      setExtractedVariables(prev => [...prev, variableName]);
    }

    setSelectedPlaceholder(null);
    setVariableName('');

    toast({
      title: "Placeholder Replaced",
      description: `Replaced with variable: ${variableName}`,
    });
  };

  const handleAIContentUpdate = (content: string, variables: string[]) => {
    setFormData(prev => ({ ...prev, content }));
    setExtractedVariables(variables);
    
    toast({
      title: "Template Processing Complete",
      description: `Applied ${variables.length} variables to your template`,
    });
  };

  const handleAutoExtractVariables = () => {
    if (!formData.content) {
      toast({
        title: "No Content",
        description: "Please add template content first",
        variant: "destructive"
      });
      return;
    }

    const variables = TemplateService.extractVariablesFromContent(formData.content);
    setExtractedVariables(variables);
    
    toast({
      title: "Variables Extracted",
      description: `Found ${variables.length} variables`,
    });
  };

  const renderHighlightedContent = () => {
    const highlightedContent = highlightBlankFields(formData.content);
    
    return (
      <div
        className="min-h-[400px] p-4 border rounded-lg bg-white font-mono text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.hasAttribute('data-placeholder')) {
            const placeholder = target.getAttribute('data-placeholder') || '';
            const context = target.parentElement?.textContent || '';
            handlePlaceholderClick(placeholder, context);
          }
        }}
      />
    );
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.content) {
      toast({
        title: "Missing Information",
        description: "Please provide template name and content",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const newTemplate = {
        id: `template_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        content: formData.content,
        variables: extractedVariables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onTemplateCreated(newTemplate);

      toast({
        title: "Template Created",
        description: "Your template has been saved successfully",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Could not create the template",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const removeVariable = (variableToRemove: string) => {
    setExtractedVariables(prev => prev.filter(v => v !== variableToRemove));
  };

  const addCustomVariable = () => {
    const variableName = prompt("Enter variable name (without curly braces):");
    if (variableName && variableName.trim()) {
      const cleanName = variableName.trim().replace(/[{}]/g, '');
      if (!extractedVariables.includes(cleanName)) {
        setExtractedVariables(prev => [...prev, cleanName]);
        
        const placeholder = `{{${cleanName}}}`;
        if (!formData.content.includes(placeholder)) {
          setFormData(prev => ({
            ...prev,
            content: prev.content + `\n${placeholder}`
          }));
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Create New Template</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[calc(95vh-120px)] overflow-y-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value: TemplateCategory) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agreements">Agreements</SelectItem>
                  <SelectItem value="forms">Forms</SelectItem>
                  <SelectItem value="letters">Letters</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the template"
            />
          </div>

          {/* Template Source Selection */}
          {!isTemplateUploaded && (
            <div className="space-y-4">
              <Label>Choose Template Source</Label>
              <div className="grid grid-cols-1 gap-4">
                {/* Upload New Document */}
                <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-semibold mb-2">Upload Word Document</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload a new Word document from your computer
                    </p>
                    <input
                      type="file"
                      accept=".doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button variant="outline" asChild disabled={isExtracting}>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {isExtracting ? "Processing..." : "Choose File"}
                      </label>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Template Upload Status */}
          {isTemplateUploaded && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Template loaded: {uploadedFileName} ({templateSource === 'system' ? 'System Template' : 'Uploaded File'})
              </p>
              <p className="text-xs text-green-600 mt-1">
                Document structure preserved • {extractedVariables.length} variables detected
              </p>
            </div>
          )}

          {/* AI Template Assistant - Only show after template is loaded */}
          {showAIAssistant && isTemplateUploaded && (
            <div className="border-t pt-6">
              <div className="mb-3">
                <h3 className="font-semibold text-lg mb-1 flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Template Variable Converter
                </h3>
                <p className="text-sm text-gray-600">
                  Convert blank fields in your document into fillable variables
                </p>
              </div>
              <AIVariableAssistant
                content={formData.content}
                onContentUpdate={handleAIContentUpdate}
              />
            </div>
          )}

          {/* Content Preview & Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Template Content {isTemplateUploaded && "(Extracted from document)"}</Label>
              <div className="flex space-x-2">
                {isTemplateUploaded && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    {showAIAssistant ? "Hide AI Assistant" : "Show AI Assistant"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAutoExtractVariables}
                  disabled={!formData.content}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Extract Variables
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addCustomVariable}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variable
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditor(!showEditor)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {showEditor ? "View Highlights" : "Edit Text"}
                </Button>
              </div>
            </div>
            
            {showEditor ? (
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder={isTemplateUploaded ? 
                  "Your document content appears here. Edit as needed and use AI to convert blank fields to variables." :
                  "Select a template source above to get started, or enter template content manually."
                }
                rows={12}
                className={`font-mono text-sm ${isTemplateUploaded ? "bg-blue-50" : ""}`}
              />
            ) : (
              renderHighlightedContent()
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Use double curly braces for variables: {`{{landlord_name}}, {{site_location}}, {{current_date}}`}</span>
              {formData.content.length > 0 && (
                <span>{formData.content.length} characters</span>
              )}
            </div>
            
            {!isTemplateUploaded && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Select a template source above to get started with AI-powered variable conversion
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Extracted Variables Display */}
          {extractedVariables.length > 0 && (
            <div className="space-y-2">
              <Label>Template Variables ({extractedVariables.length})</Label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2 mb-2">
                  {extractedVariables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="flex items-center space-x-1">
                      <span>{variable}</span>
                      <button
                        onClick={() => removeVariable(variable)}
                        className="text-gray-500 hover:text-red-500 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  These variables will be fillable when generating documents from this template. 
                  Generated documents will maintain the original formatting.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate}
              disabled={isCreating || !formData.name || !formData.content}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? "Creating Template..." : "Create Template"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Replacement Modal */}
      {selectedPlaceholder && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60]">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Replace Placeholder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Placeholder</Label>
                <code className="block bg-gray-100 p-2 rounded text-sm">
                  {selectedPlaceholder}
                </code>
              </div>
              <div>
                <Label>Variable Name</Label>
                <Input
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value)}
                  placeholder="Enter variable name"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPlaceholder(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReplacePlaceholder}
                  disabled={!variableName}
                  className="flex-1"
                >
                  Replace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TemplateCreator;