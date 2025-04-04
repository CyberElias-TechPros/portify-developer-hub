
import { useState } from "react";
import Layout from "@/components/Layout";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Grip,
  Plus,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Trash,
  MoveUp,
  MoveDown,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Section {
  id: string;
  title: string;
  type: 'about' | 'projects' | 'skills' | 'experience' | 'education' | 'blog' | 'contact' | 'custom';
  order: number;
  visible: boolean;
  content?: any;
  customFields?: Record<string, any>;
}

// Mock sections data
const initialSections: Section[] = [
  { id: '1', title: 'About Me', type: 'about', order: 1, visible: true },
  { id: '2', title: 'Projects', type: 'projects', order: 2, visible: true },
  { id: '3', title: 'Skills', type: 'skills', order: 3, visible: true },
  { id: '4', title: 'Experience', type: 'experience', order: 4, visible: true },
  { id: '5', title: 'Education', type: 'education', order: 5, visible: true },
  { id: '6', title: 'Blog', type: 'blog', order: 6, visible: false },
  { id: '7', title: 'Contact', type: 'contact', order: 7, visible: true },
  { id: '8', title: 'Testimonials', type: 'custom', order: 8, visible: true, customFields: { displayMode: 'carousel' } },
];

// Section templates
const sectionTemplates = [
  { value: 'about', label: 'About Me', description: 'Personal introduction and bio' },
  { value: 'projects', label: 'Projects', description: 'Showcase your work and projects' },
  { value: 'skills', label: 'Skills', description: 'Display your technical skills' },
  { value: 'experience', label: 'Experience', description: 'Show your work experience' },
  { value: 'education', label: 'Education', description: 'List your educational background' },
  { value: 'blog', label: 'Blog', description: 'Display recent blog posts' },
  { value: 'contact', label: 'Contact', description: 'Contact form and information' },
  { value: 'custom', label: 'Custom Section', description: 'Create a custom section' },
];

export default function PortfolioSections() {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [newSectionType, setNewSectionType] = useState<string | undefined>();
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionHistory, setSectionHistory] = useState<Section[][]>([initialSections]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    if (!destination) return;
    if (destination.index === source.index) return;
    
    const reorderedSections = [...sections];
    const [removed] = reorderedSections.splice(source.index, 1);
    reorderedSections.splice(destination.index, 0, removed);
    
    // Update order values
    const updatedSections = reorderedSections.map((section, index) => ({
      ...section,
      order: index + 1,
    }));
    
    setSections(updatedSections);
    addToHistory(updatedSections);
    
    toast({
      title: "Sections Reordered",
      description: "The section order has been updated.",
    });
  };
  
  const toggleSectionVisibility = (id: string) => {
    const updatedSections = sections.map((section) => 
      section.id === id ? { ...section, visible: !section.visible } : section
    );
    setSections(updatedSections);
    addToHistory(updatedSections);
    
    const section = sections.find(s => s.id === id);
    toast({
      title: section?.visible ? "Section Hidden" : "Section Visible",
      description: `"${section?.title}" is now ${section?.visible ? "hidden" : "visible"} on your portfolio.`,
    });
  };
  
  const addSection = () => {
    if (!newSectionType || !newSectionTitle.trim()) return;
    
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: newSectionTitle,
      type: newSectionType as any,
      order: sections.length + 1,
      visible: true,
      customFields: newSectionType === 'custom' ? {} : undefined,
    };
    
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    addToHistory(updatedSections);
    
    setNewSectionType(undefined);
    setNewSectionTitle("");
    setDialogOpen(false);
    
    toast({
      title: "Section Added",
      description: `"${newSectionTitle}" has been added to your portfolio.`,
    });
  };
  
  const duplicateSection = (id: string) => {
    const sectionToDuplicate = sections.find((section) => section.id === id);
    if (!sectionToDuplicate) return;
    
    const newSection = {
      ...sectionToDuplicate,
      id: `section-${Date.now()}`,
      title: `${sectionToDuplicate.title} (Copy)`,
      order: sections.length + 1,
    };
    
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    addToHistory(updatedSections);
    
    toast({
      title: "Section Duplicated",
      description: `A copy of "${sectionToDuplicate.title}" has been created.`,
    });
  };
  
  const deleteSection = (id: string) => {
    const sectionToDelete = sections.find((section) => section.id === id);
    if (!sectionToDelete) return;
    
    const updatedSections = sections
      .filter((section) => section.id !== id)
      .map((section, index) => ({
        ...section,
        order: index + 1,
      }));
    
    setSections(updatedSections);
    addToHistory(updatedSections);
    
    toast({
      title: "Section Deleted",
      description: `"${sectionToDelete.title}" has been removed from your portfolio.`,
    });
  };
  
  const editSection = (section: Section) => {
    setEditingSection(section);
    setNewSectionTitle(section.title);
    setDialogOpen(true);
  };
  
  const saveEditedSection = () => {
    if (!editingSection || !newSectionTitle.trim()) return;
    
    const updatedSections = sections.map((section) =>
      section.id === editingSection.id
        ? { ...section, title: newSectionTitle }
        : section
    );
    
    setSections(updatedSections);
    addToHistory(updatedSections);
    
    setEditingSection(null);
    setNewSectionTitle("");
    setDialogOpen(false);
    
    toast({
      title: "Section Updated",
      description: `"${newSectionTitle}" has been updated.`,
    });
  };
  
  const addToHistory = (newSections: Section[]) => {
    const newHistory = sectionHistory.slice(0, historyIndex + 1);
    newHistory.push([...newSections]);
    setSectionHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSections([...sectionHistory[historyIndex - 1]]);
      
      toast({
        title: "Changes Undone",
        description: "The previous action has been undone.",
      });
    }
  };
  
  const redo = () => {
    if (historyIndex < sectionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSections([...sectionHistory[historyIndex + 1]]);
      
      toast({
        title: "Changes Redone",
        description: "The action has been reapplied.",
      });
    }
  };
  
  const moveSection = (id: string, direction: 'up' | 'down') => {
    const sectionIndex = sections.findIndex((section) => section.id === id);
    if (
      (direction === 'up' && sectionIndex === 0) ||
      (direction === 'down' && sectionIndex === sections.length - 1)
    ) {
      return;
    }
    
    const updatedSections = [...sections];
    const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    
    // Swap sections
    [updatedSections[sectionIndex], updatedSections[targetIndex]] = 
      [updatedSections[targetIndex], updatedSections[sectionIndex]];
    
    // Update order values
    const reorderedSections = updatedSections.map((section, index) => ({
      ...section,
      order: index + 1,
    }));
    
    setSections(reorderedSections);
    addToHistory(reorderedSections);
    
    toast({
      title: "Section Moved",
      description: `"${sections[sectionIndex].title}" has been moved ${direction}.`,
    });
  };

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Sections</h1>
            <p className="text-muted-foreground">
              Arrange and manage the sections of your portfolio
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={undo}
              disabled={historyIndex === 0}
            >
              Undo
            </Button>
            <Button
              variant="outline"
              onClick={redo}
              disabled={historyIndex === sectionHistory.length - 1}
            >
              Redo
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSection ? "Edit Section" : "Add New Section"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSection
                      ? "Update your section details"
                      : "Choose a section type and customize it"}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {!editingSection && (
                    <div className="grid gap-2">
                      <Label htmlFor="section-type">Section Type</Label>
                      <Select
                        value={newSectionType}
                        onValueChange={setNewSectionType}
                      >
                        <SelectTrigger id="section-type">
                          <SelectValue placeholder="Select a section type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Standard Sections</SelectLabel>
                            {sectionTemplates.map((template) => (
                              <SelectItem key={template.value} value={template.value}>
                                {template.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="section-title">Section Title</Label>
                    <Input
                      id="section-title"
                      placeholder="Enter a title for this section"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setDialogOpen(false);
                    setEditingSection(null);
                    setNewSectionTitle("");
                  }}>
                    Cancel
                  </Button>
                  {editingSection ? (
                    <Button onClick={saveEditedSection} disabled={!newSectionTitle.trim()}>
                      Save Changes
                    </Button>
                  ) : (
                    <Button onClick={addSection} disabled={!newSectionType || !newSectionTitle.trim()}>
                      Add Section
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="space-y-4"
              >
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border-l-4 ${section.visible ? 'border-l-primary' : 'border-l-muted'}`}
                      >
                        <div className="flex items-center">
                          <CardHeader className="flex-1">
                            <div className="flex items-center">
                              <div 
                                {...provided.dragHandleProps}
                                className="mr-4 cursor-grab rounded-md hover:bg-muted p-2"
                              >
                                <Grip size={18} />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="flex items-center">
                                  {section.title}
                                  {!section.visible && (
                                    <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                      Hidden
                                    </span>
                                  )}
                                </CardTitle>
                                <CardDescription>
                                  {sectionTemplates.find(t => t.value === section.type)?.description || "Custom section"}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardFooter className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSectionVisibility(section.id)}
                              title={section.visible ? "Hide section" : "Show section"}
                            >
                              {section.visible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveSection(section.id, 'up')}
                              disabled={index === 0}
                              title="Move up"
                            >
                              <MoveUp size={18} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveSection(section.id, 'down')}
                              disabled={index === sections.length - 1}
                              title="Move down"
                            >
                              <MoveDown size={18} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editSection(section)}
                              title="Edit section"
                            >
                              <Edit size={18} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateSection(section.id)}
                              title="Duplicate section"
                            >
                              <Copy size={18} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSection(section.id)}
                              title="Delete section"
                            >
                              <Trash size={18} />
                            </Button>
                          </CardFooter>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {sections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No sections added yet</p>
            <Button onClick={() => setDialogOpen(true)}>Add Your First Section</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
