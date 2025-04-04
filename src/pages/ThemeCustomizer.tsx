
import { useState } from "react";
import Layout from "@/components/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function ThemeCustomizer() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("colors");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#e2e8f0");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#111827");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [layout, setLayout] = useState("multi-page");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSaveTheme = () => {
    // In a real app, this would save the theme to a database
    toast({
      title: "Theme Saved",
      description: "Your custom theme has been saved successfully.",
    });
  };

  const handleResetTheme = () => {
    // Reset to default values
    setPrimaryColor("#8B5CF6");
    setSecondaryColor("#e2e8f0");
    setBackgroundColor("#ffffff");
    setTextColor("#111827");
    setAccentColor("#f59e0b");
    setFontFamily("Inter");
    setHeadingFont("Inter");
    setBodyFont("Inter");
    setLayout("multi-page");
    setIsDarkMode(false);

    toast({
      title: "Theme Reset",
      description: "Theme settings have been reset to defaults.",
    });
  };

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <h1 className="text-3xl font-bold mb-2">Theme Customizer</h1>
            <p className="text-muted-foreground mb-6">
              Personalize your portfolio's appearance with custom colors, fonts, and layout options.
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeTab === "colors" && "Color Scheme"}
                    {activeTab === "typography" && "Typography"}
                    {activeTab === "layout" && "Layout Options"}
                    {activeTab === "advanced" && "Advanced Settings"}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === "colors" && "Customize the color palette of your portfolio"}
                    {activeTab === "typography" && "Choose fonts for your portfolio"}
                    {activeTab === "layout" && "Configure how your portfolio is organized"}
                    {activeTab === "advanced" && "Additional customization options"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Colors Tab */}
                  <TabsContent value="colors" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Primary Color</label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Secondary Color</label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Background Color</label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Text Color</label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Accent Color</label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            type="text"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Dark Mode</label>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="darkMode" 
                            checked={isDarkMode}
                            onChange={(e) => setIsDarkMode(e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor="darkMode">Enable dark mode by default</label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Typography Tab */}
                  <TabsContent value="typography" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Font Family</label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Heading Font</label>
                        <Select value={headingFont} onValueChange={setHeadingFont}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select heading font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Body Font</label>
                        <Select value={bodyFont} onValueChange={setBodyFont}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select body font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Base Font Size</label>
                        <Select defaultValue="16px">
                          <SelectTrigger>
                            <SelectValue placeholder="Select font size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="14px">14px</SelectItem>
                            <SelectItem value="16px">16px</SelectItem>
                            <SelectItem value="18px">18px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Layout Tab */}
                  <TabsContent value="layout" className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Layout Type</label>
                        <Select value={layout} onValueChange={setLayout}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single-page">Single Page</SelectItem>
                            <SelectItem value="multi-page">Multi Page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Navigation Style</label>
                        <Select defaultValue="top">
                          <SelectTrigger>
                            <SelectValue placeholder="Select navigation style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Top Navigation</SelectItem>
                            <SelectItem value="side">Side Navigation</SelectItem>
                            <SelectItem value="hamburger">Hamburger Menu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Content Width</label>
                        <Select defaultValue="container">
                          <SelectTrigger>
                            <SelectValue placeholder="Select content width" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="container">Container (max-width)</SelectItem>
                            <SelectItem value="full">Full Width</SelectItem>
                            <SelectItem value="narrow">Narrow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sections Order</label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Drag and drop sections to reorder (Demo only - not functional)
                        </p>
                        <div className="border rounded-md p-4 space-y-2">
                          <div className="bg-secondary p-2 rounded cursor-move flex justify-between items-center">
                            Hero Section
                            <span>≡</span>
                          </div>
                          <div className="bg-secondary p-2 rounded cursor-move flex justify-between items-center">
                            About
                            <span>≡</span>
                          </div>
                          <div className="bg-secondary p-2 rounded cursor-move flex justify-between items-center">
                            Projects
                            <span>≡</span>
                          </div>
                          <div className="bg-secondary p-2 rounded cursor-move flex justify-between items-center">
                            Skills
                            <span>≡</span>
                          </div>
                          <div className="bg-secondary p-2 rounded cursor-move flex justify-between items-center">
                            Experience
                            <span>≡</span>
                          </div>
                          <div className="bg-secondary p-2 rounded cursor-move flex justify-between items-center">
                            Contact
                            <span>≡</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Custom CSS</label>
                        <textarea
                          className="w-full h-32 p-2 border rounded-md font-mono text-sm"
                          placeholder="/* Add your custom CSS here */
.hero-section {
  /* Custom styles */
}"
                        ></textarea>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Animation Preferences</label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" id="pageTransitions" defaultChecked className="mr-2" />
                            <label htmlFor="pageTransitions">Enable page transitions</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="scrollAnimations" defaultChecked className="mr-2" />
                            <label htmlFor="scrollAnimations">Enable scroll animations</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="hoverEffects" defaultChecked className="mr-2" />
                            <label htmlFor="hoverEffects">Enable hover effects</label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Custom Domain</label>
                        <Input placeholder="yourdomain.com" />
                        <p className="text-xs text-muted-foreground">
                          Enter your custom domain to use instead of the default subdomain.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleResetTheme}>
                Reset to Defaults
              </Button>
              <Button onClick={handleSaveTheme}>
                Save Theme
              </Button>
            </div>
          </div>
          
          {/* Preview Panel */}
          <div className="w-full md:w-1/3 sticky top-24 h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preview</CardTitle>
                <CardDescription>See how your changes look</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-md p-4 h-96 overflow-hidden"
                  style={{
                    backgroundColor: backgroundColor,
                    color: textColor,
                    fontFamily: fontFamily
                  }}
                >
                  <div 
                    className="text-xl font-bold mb-2" 
                    style={{ 
                      color: primaryColor,
                      fontFamily: headingFont
                    }}
                  >
                    Sample Heading
                  </div>
                  <div 
                    className="text-base mb-4"
                    style={{ fontFamily: bodyFont }}
                  >
                    This is a preview of how your custom theme will look on your portfolio.
                  </div>
                  <div 
                    className="p-2 rounded-md mb-4 inline-block"
                    style={{ backgroundColor: primaryColor, color: "#fff" }}
                  >
                    Primary Button
                  </div>
                  <div 
                    className="p-2 rounded-md mb-4 inline-block ml-2 border"
                    style={{ 
                      backgroundColor: secondaryColor,
                      borderColor: primaryColor
                    }}
                  >
                    Secondary Button
                  </div>
                  <div 
                    className="p-4 rounded-md"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    <div style={{ color: textColor }}>Card Component</div>
                    <div 
                      className="h-2 rounded-full mt-2"
                      style={{ backgroundColor: accentColor }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  This preview updates as you make changes.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
