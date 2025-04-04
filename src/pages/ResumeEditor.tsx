
import { useState } from "react";
import Layout from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Plus, 
  Trash, 
  Move, 
  Eye,
  Save,
  FileDown,
  FilePlus,
  Copy
} from "lucide-react";

export default function ResumeEditor() {
  const { toast } = useToast();
  const [activeTemplate, setActiveTemplate] = useState("modern");
  const [activeTab, setActiveTab] = useState("content");
  const [resumeName, setResumeName] = useState("My Resume");
  
  const handleSave = () => {
    toast({
      title: "Resume Saved",
      description: "Your resume has been saved successfully",
    });
  };
  
  const handleDownload = () => {
    toast({
      title: "Resume Downloaded",
      description: "Your resume has been downloaded as a PDF",
    });
  };

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            <p className="text-muted-foreground">Create and customize your professional resume</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Editor Panel */}
          <div className="w-full lg:w-2/3 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Resume Settings</CardTitle>
                    <CardDescription>Configure your resume</CardDescription>
                  </div>
                  <Select defaultValue={resumeName} onValueChange={setResumeName}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select resume" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="My Resume">My Resume</SelectItem>
                      <SelectItem value="Developer Resume">Developer Resume</SelectItem>
                      <SelectItem value="Designer Resume">Designer Resume</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Input 
                    value={resumeName} 
                    onChange={(e) => setResumeName(e.target.value)}
                    placeholder="Resume name" 
                  />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <FilePlus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                    <TabsTrigger value="styling">Styling</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input defaultValue="John Doe" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Job Title</label>
                            <Input defaultValue="Full Stack Developer" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input defaultValue="john@example.com" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <Input defaultValue="(123) 456-7890" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <Input defaultValue="San Francisco, CA" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Website</label>
                            <Input defaultValue="https://johndoe.com" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Work Experience</CardTitle>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">Senior Frontend Developer</h4>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Move className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs">Company</label>
                                <Input size={1} defaultValue="Tech Innovators" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs">Location</label>
                                <Input size={1} defaultValue="San Francisco, CA" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs">Start Date</label>
                                <Input size={1} defaultValue="Jan 2021" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs">End Date</label>
                                <Input size={1} defaultValue="Present" />
                              </div>
                              <div className="col-span-2 space-y-1">
                                <label className="text-xs">Description</label>
                                <textarea 
                                  className="w-full border rounded-md p-2 text-sm h-24" 
                                  defaultValue="Led development of enterprise web applications using React, TypeScript, and GraphQL. Implemented CI/CD pipelines and improved performance by 35%."
                                ></textarea>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">Frontend Developer</h4>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Move className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs">Company</label>
                                <Input size={1} defaultValue="Digital Solutions Inc" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs">Location</label>
                                <Input size={1} defaultValue="Boston, MA" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs">Start Date</label>
                                <Input size={1} defaultValue="Mar 2019" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs">End Date</label>
                                <Input size={1} defaultValue="Dec 2020" />
                              </div>
                              <div className="col-span-2 space-y-1">
                                <label className="text-xs">Description</label>
                                <textarea 
                                  className="w-full border rounded-md p-2 text-sm h-24" 
                                  defaultValue="Developed responsive web applications for clients in financial sector. Collaborated with UX designers to implement pixel-perfect interfaces."
                                ></textarea>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Education</CardTitle>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 border rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Computer Science, BS</h4>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm">
                                <Move className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs">Institution</label>
                              <Input size={1} defaultValue="University of Technology" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs">Location</label>
                              <Input size={1} defaultValue="San Francisco, CA" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs">Graduation Year</label>
                              <Input size={1} defaultValue="2018" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs">GPA</label>
                              <Input size={1} defaultValue="3.8/4.0" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Skills</CardTitle>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="border rounded-md p-2 flex justify-between items-center">
                              <span>JavaScript</span>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="border rounded-md p-2 flex justify-between items-center">
                              <span>React</span>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="border rounded-md p-2 flex justify-between items-center">
                              <span>TypeScript</span>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="border rounded-md p-2 flex justify-between items-center">
                              <span>HTML/CSS</span>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="border rounded-md p-2 flex justify-between items-center">
                              <span>Node.js</span>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="border rounded-md p-2 flex justify-between items-center">
                              <span>GraphQL</span>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex">
                            <Input placeholder="Add a skill" className="mr-2" />
                            <Button>Add</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="layout" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Template</CardTitle>
                        <CardDescription>Choose a resume template</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div 
                            className={`border rounded-md p-2 cursor-pointer ${activeTemplate === 'modern' ? 'border-primary' : ''}`}
                            onClick={() => setActiveTemplate('modern')}
                          >
                            <div className="aspect-[8.5/11] bg-muted mb-2"></div>
                            <p className="text-center text-sm font-medium">Modern</p>
                          </div>
                          <div 
                            className={`border rounded-md p-2 cursor-pointer ${activeTemplate === 'classic' ? 'border-primary' : ''}`}
                            onClick={() => setActiveTemplate('classic')}
                          >
                            <div className="aspect-[8.5/11] bg-muted mb-2"></div>
                            <p className="text-center text-sm font-medium">Classic</p>
                          </div>
                          <div 
                            className={`border rounded-md p-2 cursor-pointer ${activeTemplate === 'minimal' ? 'border-primary' : ''}`}
                            onClick={() => setActiveTemplate('minimal')}
                          >
                            <div className="aspect-[8.5/11] bg-muted mb-2"></div>
                            <p className="text-center text-sm font-medium">Minimal</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Section Order</CardTitle>
                        <CardDescription>Drag and drop to reorder sections</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="border rounded-md p-3 flex justify-between items-center">
                            <span className="font-medium">Contact Information</span>
                            <Button variant="ghost" size="sm">
                              <Move className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="border rounded-md p-3 flex justify-between items-center">
                            <span className="font-medium">Professional Summary</span>
                            <Button variant="ghost" size="sm">
                              <Move className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="border rounded-md p-3 flex justify-between items-center">
                            <span className="font-medium">Work Experience</span>
                            <Button variant="ghost" size="sm">
                              <Move className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="border rounded-md p-3 flex justify-between items-center">
                            <span className="font-medium">Education</span>
                            <Button variant="ghost" size="sm">
                              <Move className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="border rounded-md p-3 flex justify-between items-center">
                            <span className="font-medium">Skills</span>
                            <Button variant="ghost" size="sm">
                              <Move className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="styling" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Colors</CardTitle>
                        <CardDescription>Customize resume colors</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Primary Color</label>
                            <div className="flex">
                              <Input type="color" defaultValue="#8B5CF6" className="w-12 h-10 p-1" />
                              <Input defaultValue="#8B5CF6" className="ml-2" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Secondary Color</label>
                            <div className="flex">
                              <Input type="color" defaultValue="#6B7280" className="w-12 h-10 p-1" />
                              <Input defaultValue="#6B7280" className="ml-2" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Heading Color</label>
                            <div className="flex">
                              <Input type="color" defaultValue="#111827" className="w-12 h-10 p-1" />
                              <Input defaultValue="#111827" className="ml-2" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Text Color</label>
                            <div className="flex">
                              <Input type="color" defaultValue="#374151" className="w-12 h-10 p-1" />
                              <Input defaultValue="#374151" className="ml-2" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Typography</CardTitle>
                        <CardDescription>Customize resume fonts</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Heading Font</label>
                            <Select defaultValue="Inter">
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Body Font</label>
                            <Select defaultValue="Inter">
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Font Size</label>
                            <Select defaultValue="medium">
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Line Spacing</label>
                            <Select defaultValue="normal">
                              <SelectTrigger>
                                <SelectValue placeholder="Select spacing" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="compact">Compact</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="relaxed">Relaxed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Page Settings</CardTitle>
                        <CardDescription>Configure page layout</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Paper Size</label>
                            <Select defaultValue="letter">
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="letter">Letter</SelectItem>
                                <SelectItem value="a4">A4</SelectItem>
                                <SelectItem value="legal">Legal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Margins</label>
                            <Select defaultValue="normal">
                              <SelectTrigger>
                                <SelectValue placeholder="Select margin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="narrow">Narrow</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="wide">Wide</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="history" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Version History</CardTitle>
                        <CardDescription>Previous versions of your resume</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border rounded-md p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">Current Version</h4>
                                <p className="text-sm text-muted-foreground">Today at 2:30 PM</p>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </Button>
                                <Button size="sm">
                                  <FileDown className="h-4 w-4 mr-2" /> Download
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">Version 2</h4>
                                <p className="text-sm text-muted-foreground">Apr 3, 2023 at 10:15 AM</p>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </Button>
                                <Button variant="outline" size="sm">
                                  <FileDown className="h-4 w-4 mr-2" /> Download
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">Version 1</h4>
                                <p className="text-sm text-muted-foreground">Mar 28, 2023 at 4:45 PM</p>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </Button>
                                <Button variant="outline" size="sm">
                                  <FileDown className="h-4 w-4 mr-2" /> Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Preview Panel */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Resume Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[8.5/11] border rounded-md bg-white shadow-md overflow-hidden">
                    <div className="p-8 h-full">
                      <div className="border-b pb-4 mb-4">
                        <h1 className="text-xl font-bold">John Doe</h1>
                        <p className="text-sm">Full Stack Developer</p>
                        <div className="flex flex-wrap gap-2 text-xs mt-2 text-gray-600">
                          <span>john@example.com</span>
                          <span>•</span>
                          <span>(123) 456-7890</span>
                          <span>•</span>
                          <span>San Francisco, CA</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h2 className="text-sm font-bold uppercase mb-2">Experience</h2>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm">
                            <strong>Senior Frontend Developer</strong>
                            <span className="text-xs">Jan 2021 - Present</span>
                          </div>
                          <div className="text-xs">Tech Innovators, San Francisco, CA</div>
                          <p className="text-xs mt-1">Led development of enterprise web applications using React, TypeScript, and GraphQL. Implemented CI/CD pipelines and improved performance by 35%.</p>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <strong>Frontend Developer</strong>
                            <span className="text-xs">Mar 2019 - Dec 2020</span>
                          </div>
                          <div className="text-xs">Digital Solutions Inc, Boston, MA</div>
                          <p className="text-xs mt-1">Developed responsive web applications for clients in financial sector. Collaborated with UX designers to implement pixel-perfect interfaces.</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h2 className="text-sm font-bold uppercase mb-2">Education</h2>
                        <div className="flex justify-between text-sm">
                          <strong>BS, Computer Science</strong>
                          <span className="text-xs">2018</span>
                        </div>
                        <div className="text-xs">University of Technology, San Francisco, CA</div>
                        <div className="text-xs">GPA: 3.8/4.0</div>
                      </div>
                      
                      <div>
                        <h2 className="text-sm font-bold uppercase mb-2">Skills</h2>
                        <div className="flex flex-wrap gap-1 text-xs">
                          <span className="bg-gray-100 px-2 py-1 rounded">JavaScript</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">React</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">TypeScript</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">HTML/CSS</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">Node.js</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">GraphQL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4 space-x-2">
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" /> PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
