import { SystemTemplateService } from "@/services/systemTemplateService";
import { TemplateCategory } from "@/types/database";

interface TemplateFile {
  name: string;
  description: string;
  category: TemplateCategory;
  fileName: string;
  filePath: string;
}

export class TemplateSeeder {
  private static readonly templates: TemplateFile[] = [
    {
      name: "Agreement to Lease - Safaricom BTS",
      description: "Professional fillable Agreement to Lease template for Safaricom Base Transceiver Station installations. Includes all standard clauses, definitions, and signature sections.",
      category: "agreements",
      fileName: "Agreement_to_Lease_Template.html",
      filePath: "/templates/Agreement to lease.html"
    },
    {
      name: "Lease Agreement - Safaricom BTS",
      description: "Comprehensive lease agreement template for Safaricom Base Transceiver Station sites. Includes rent schedules, covenants, and execution clauses.",
      category: "agreements", 
      fileName: "Lease_Agreement_Template.html",
      filePath: "/templates/lease agreement.html"
    },
    {
      name: "Licence Agreement - Peppercorn",
      description: "Licence agreement template for peppercorn rent arrangements. Suitable for rooftop and building installations.",
      category: "agreements",
      fileName: "Licence_Agreement_Peppercorn.html", 
      filePath: "/templates/licence agreement.html"
    },
    {
      name: "Letter of Offer - Site Acquisition",
      description: "Professional letter of offer template for site acquisition. Includes all terms, conditions, and acceptance clauses.",
      category: "letters",
      fileName: "Letter_of_Offer_Template.html",
      filePath: "/templates/Letter to offer.html"
    }
  ];

  static async seedSystemTemplates(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    console.log('Starting to seed system templates...');
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const template of this.templates) {
      try {
        console.log(`Processing template: ${template.name}`);
        
        // Fetch the HTML file from the public directory
        const response = await fetch(template.filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch template file: ${response.statusText}`);
        }
        
        const htmlContent = await response.text();
        
        // Convert HTML string to Uint8Array
        const encoder = new TextEncoder();
        const fileData = encoder.encode(htmlContent);
        
        // Upload to system templates
        await SystemTemplateService.uploadSystemTemplate({
          name: template.name,
          description: template.description,
          category: template.category,
          file_name: template.fileName,
          file_data: fileData,
          content_type: 'text/html'
        });
        
        successCount++;
        console.log(`Successfully uploaded: ${template.name}`);
        
      } catch (error) {
        failedCount++;
        const errorMessage = `${template.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error(`Failed to upload ${template.name}:`, error);
      }
    }

    console.log(`Template seeding completed: ${successCount} success, ${failedCount} failed`);
    
    return {
      success: successCount,
      failed: failedCount,
      errors
    };
  }

  static getAvailableTemplates(): TemplateFile[] {
    return [...this.templates];
  }
}