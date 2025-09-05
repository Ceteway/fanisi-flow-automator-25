
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useROF5Form } from "@/hooks/useROF5Form";
import { ROF5DocumentService, ROF5Document } from "@/services/rof5DocumentService";
import FormHeader from "@/components/ROF5/FormHeader";
import FormSections from "@/components/ROF5/FormSections";
import FormActions from "@/components/ROF5/FormActions";
import AISuggestions from "@/components/AISuggestions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SystemTemplateService, SystemTemplate } from "@/services/systemTemplateService";
import { useEffect } from "react";
import { FileText, Download } from "lucide-react";

const ROF5Form = () => {
  const {
    formData,
    handleInputChange,
    handleDocumentCheck,
    resetForm,
    submitForm,
    toast
  } = useROF5Form();

  const [currentField, setCurrentField] = useState<string>('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<SystemTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load available system templates
  useEffect(() => {
    loadAvailableTemplates();
  }, []);

  const loadAvailableTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const templates = await SystemTemplateService.getAllSystemTemplates();
      setAvailableTemplates(templates);
      console.log(`Loaded ${templates.length} system templates for ROF5 selection`);
    } catch (error) {
      console.error('Failed to load system templates:', error);
      toast({
        title: "Template Loading Failed",
        description: "Could not load available templates for selection",
        variant: "destructive"
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleInputChangeWithAI = (field: keyof typeof formData, value: string) => {
    handleInputChange(field, value);
    if (aiEnabled) {
      setCurrentField(field);
    }
  };

  const handleApplyAISuggestion = (field: string, value: string) => {
    handleInputChange(field as keyof typeof formData, value);
    toast({
      title: "AI Suggestion Applied",
      description: `${field} updated with AI suggestion`,
    });
  };

  const handleDownloadROF5 = async () => {
    try {
      setIsSubmitting(true);
      toast({
        title: "Generating ROF5 Document",
        description: "Please wait while we generate your ROF5 form in Word format...",
      });

      const rof5Document = await ROF5DocumentService.generateROF5Document(formData);
      ROF5DocumentService.downloadROF5Document(rof5Document);

      toast({
        title: "ROF5 Downloaded",
        description: "ROF5 form has been downloaded successfully",
      });
    } catch (error) {
      console.error('ROF5 download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate ROF5 document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    
    toast({
      title: "Template Selected",
      description: `${template?.name} will be used for document generation`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitForm();
    } catch (error) {
      console.error('ROF5 submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <FormHeader 
          aiEnabled={aiEnabled} 
          onToggleAI={() => setAiEnabled(!aiEnabled)} 
        />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FormSections
                formData={formData}
                onInputChange={handleInputChangeWithAI}
                onDocumentCheck={handleDocumentCheck}
              />

              {aiEnabled && (
                <div className="space-y-4">
                  <AISuggestions
                    formData={formData}
                    currentField={currentField}
                    onApplySuggestion={handleApplyAISuggestion}
                  />
                </div>
              )}
            </div>

            {/* Document Generation Section */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Agreement Template Selection
                </h3>
                
                {/* Template Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Agreement Template for Document Generation
                    </label>
                    <Select 
                      value={selectedTemplate?.id || ""} 
                      onValueChange={handleSelectTemplate}
                      disabled={loadingTemplates}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          loadingTemplates 
                            ? "Loading templates..." 
                            : availableTemplates.length === 0 
                              ? "No templates available" 
                              : "Choose a template for document generation"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>{template.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedTemplate && (
                    <div className="p-4 bg-green-100 rounded-lg border border-green-200">
                      <div className="flex items-start space-x-3">
                        <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">
                            Selected Template: {selectedTemplate.name}
                          </p>
                          {selectedTemplate.description && (
                            <p className="text-xs text-green-600 mt-1">
                              {selectedTemplate.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-green-200 text-green-800">
                              {selectedTemplate.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {selectedTemplate.file_name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {availableTemplates.length === 0 && !loadingTemplates && (
                    <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        No system templates found. Please contact your administrator to add templates to the system.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <FormActions 
              isSubmitting={isSubmitting}
              onDownloadROF5={handleDownloadROF5}
            />
          </form>
        </CardContent>
      </Card>

    </div>
  );
};

export default ROF5Form;
