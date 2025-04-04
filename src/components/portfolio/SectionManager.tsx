
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Pencil, DragVertical, Eye, EyeOff, Copy, Trash2, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Portfolio section types
type SectionType = 'about' | 'projects' | 'skills' | 'experience' | 'education' | 'blog' | 'contact' | 'custom';

interface PortfolioSection {
  id: string;
  type: SectionType;
  title: string;
  enabled: boolean;
  isEditable: boolean;
  isCustom: boolean;
  order: number;
  lastEdited?: string;
}

// Sample data for portfolio sections
const initialSections: PortfolioSection[] = [
  { id: '1', type: 'about', title: 'About Me', enabled: true, isEditable: true, isCustom: false, order: 0, lastEdited: '2023-12-10' },
  { id: '2', type: 'projects', title: 'Projects', enabled: true, isEditable: true, isCustom: false, order: 1, lastEdited: '2023-12-15' },
  { id: '3', type: 'skills', title: 'Skills & Technologies', enabled: true, isEditable: true, isCustom: false, order: 2, lastEdited: '2023-12-12' },
  { id: '4', type: 'experience', title: 'Work Experience', enabled: true, isEditable: true, isCustom: false, order: 3, lastEdited: '2023-12-14' },
  { id: '5', type: 'education', title: 'Education', enabled: false, isEditable: true, isCustom: false, order: 4 },
  { id: '6', type: 'blog', title: 'Blog', enabled: true, isEditable: true, isCustom: false, order: 5, lastEdited: '2023-12-08' },
  { id: '7', type: 'contact', title: 'Contact', enabled: true, isEditable: true, isCustom: false, order: 6, lastEdited: '2023-12-05' },
  { id: '8', type: 'custom', title: 'Awards & Certifications', enabled: true, isEditable: true, isCustom: true, order: 7, lastEdited: '2023-12-01' },
];

// Templates for custom sections
const sectionTemplates = [
  { id: 'template-1', name: 'Text & Image', description: 'Basic section with text content and optional image' },
  { id: 'template-2', name: 'Gallery', description: 'Image gallery with captions and lightbox view' },
  { id: 'template-3', name: 'Timeline', description: 'Chronological events with descriptions' },
  { id: 'template-4', name: 'List & Cards', description: 'Information organized in cards or list items' },
  { id: 'template-5', name: 'Testimonials', description: 'Customer or colleague testimonials carousel' },
];

export default function SectionManager() {
  const [sections, setSections] = useState<PortfolioSection[]>(initialSections);
  const [showTemplates, setShowTemplates] = useState(false);

  // Handle drag end event
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order property for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setSections(updatedItems);
  };

  // Toggle section visibility
  const toggleSectionVisibility = (id: string) => {
    setSections(sections.map(section => 
      section.id === id 
        ? { ...section, enabled: !section.enabled } 
        : section
    ));
  };
  
  // Delete section
  const deleteSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };
  
  // Duplicate section
  const duplicateSection = (id: string) => {
    const sectionToDuplicate = sections.find(section => section.id === id);
    if (!sectionToDuplicate) return;
    
    const newSection = {
      ...sectionToDuplicate,
      id: `${sectionToDuplicate.id}-copy-${Date.now()}`,
      title: `${sectionToDuplicate.title} (Copy)`,
      order: sections.length,
      lastEdited: new Date().toISOString().split('T')[0]
    };
    
    setSections([...sections, newSection]);
  };
  
  // Add new section from template
  const addSectionFromTemplate = (templateId: string) => {
    const template = sectionTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    const newSection: PortfolioSection = {
      id: `section-${Date.now()}`,
      type: 'custom',
      title: template.name,
      enabled: true,
      isEditable: true,
      isCustom: true,
      order: sections.length,
      lastEdited: new Date().toISOString().split('T')[0]
    };
    
    setSections([...sections, newSection]);
    setShowTemplates(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Sections</h2>
          <p className="text-muted-foreground">
            Arrange, enable/disable, and customize the sections of your portfolio
          </p>
        </div>
        <Button onClick={() => setShowTemplates(!showTemplates)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Section
        </Button>
      </div>
      
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle>Section Templates</CardTitle>
            <CardDescription>
              Choose a template to create a new section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionTemplates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm">{template.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => addSectionFromTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                <ScrollArea className="max-h-[700px] pr-4">
                  {sections.sort((a, b) => a.order - b.order).map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="mb-3"
                        >
                          <Card className={`border-l-4 ${section.enabled ? 'border-l-primary' : 'border-l-muted'}`}>
                            <CardHeader className="py-4 px-4 md:px-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="cursor-grab"
                                  >
                                    <DragVertical className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium">{section.title}</h3>
                                      {section.isCustom && (
                                        <Badge variant="outline" className="text-xs">Custom</Badge>
                                      )}
                                    </div>
                                    {section.lastEdited && (
                                      <p className="text-xs text-muted-foreground">
                                        Last edited on {section.lastEdited}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={section.enabled}
                                    onCheckedChange={() => toggleSectionVisibility(section.id)}
                                    aria-label={`${section.enabled ? 'Disable' : 'Enable'} ${section.title} section`}
                                  />
                                  <span className="text-sm text-muted-foreground mr-2">
                                    {section.enabled ? 'Visible' : 'Hidden'}
                                  </span>
                                  <div className="hidden md:flex items-center">
                                    <Button variant="ghost" size="icon">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    {section.enabled ? (
                                      <Button variant="ghost" size="icon" onClick={() => toggleSectionVisibility(section.id)}>
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button variant="ghost" size="icon" onClick={() => toggleSectionVisibility(section.id)}>
                                        <EyeOff className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => duplicateSection(section.id)}>
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    {section.isCustom && (
                                      <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="md:hidden">
                                    <Button variant="ghost" size="sm">Actions</Button>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </ScrollArea>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            View and restore previous versions of your portfolio layout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Current Version</p>
                <p className="text-sm text-muted-foreground">Today, 2:45 PM</p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Version 2</p>
                <p className="text-sm text-muted-foreground">Yesterday, 10:30 AM</p>
              </div>
              <Button size="sm" variant="outline">Restore</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Version 1</p>
                <p className="text-sm text-muted-foreground">Dec, 1, 2023</p>
              </div>
              <Button size="sm" variant="outline">Restore</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
