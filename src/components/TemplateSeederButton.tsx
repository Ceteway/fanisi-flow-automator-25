import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TemplateSeeder } from "@/utils/templateSeeder";
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Database
} from "lucide-react";

interface TemplateSeederButtonProps {
  onTemplatesSeeded?: () => void;
}

const TemplateSeederButton = ({ onTemplatesSeeded }: TemplateSeederButtonProps) => {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleSeedTemplates = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    
    try {
      toast({
        title: "Seeding Templates",
        description: "Adding HTML templates to system templates database...",
      });

      const result = await TemplateSeeder.seedSystemTemplates();
      setSeedResult(result);
      
      if (result.success > 0) {
        toast({
          title: "Templates Added Successfully",
          description: `Added ${result.success} templates to the system. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
          variant: result.failed > 0 ? "default" : "default"
        });
        
        if (onTemplatesSeeded) {
          onTemplatesSeeded();
        }
      } else {
        toast({
          title: "Template Seeding Failed",
          description: "No templates were successfully added to the system.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Template seeding error:', error);
      toast({
        title: "Seeding Error",
        description: error instanceof Error ? error.message : "Failed to seed templates",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const availableTemplates = TemplateSeeder.getAvailableTemplates();

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Database className="w-5 h-5 text-blue-600" />
          <span>System Template Setup</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Add the built-in HTML templates to your system templates database to enable template selection in ROF5 forms.
          </p>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">Available templates to add:</p>
            <div className="space-y-1">
              {availableTemplates.map((template, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <FileText className="w-3 h-3 text-blue-500" />
                  <span className="flex-1">{template.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleSeedTemplates}
            disabled={isSeeding}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSeeding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Templates...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Add Templates to System
              </>
            )}
          </Button>
        </div>

        {seedResult && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {seedResult.success > 0 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {seedResult.success} successful, {seedResult.failed} failed
              </span>
            </div>
            
            {seedResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs font-medium text-red-800 mb-1">Errors:</p>
                <div className="space-y-1">
                  {seedResult.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-700">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateSeederButton;