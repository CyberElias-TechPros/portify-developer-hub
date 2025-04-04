
import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionManager from "@/components/portfolio/SectionManager";
import GithubImporter from "@/components/portfolio/GithubImporter";
import SkillsEndorsement from "@/components/portfolio/SkillsEndorsement";

export default function PortfolioSections() {
  const [activeTab, setActiveTab] = useState("sections");
  
  return (
    <Layout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-2">Portfolio Content</h1>
        <p className="text-muted-foreground mb-8">
          Manage and customize the content sections of your portfolio
        </p>
        
        <Tabs defaultValue="sections" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="sections">Section Management</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="skills">Skills & Endorsements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sections">
            <SectionManager />
          </TabsContent>
          
          <TabsContent value="projects">
            <GithubImporter />
          </TabsContent>
          
          <TabsContent value="skills">
            <SkillsEndorsement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
