
import AdminLayout from "@/components/admin/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Mock messages data
const mockMessages = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    subject: "Job Opportunity",
    message: "Hello, I saw your portfolio and I'm impressed with your work. We have an opening for a senior developer position at our company. Would you be interested in discussing this opportunity?",
    createdAt: "2023-08-15T10:30:00Z",
    read: false
  },
  {
    id: "2",
    name: "Maria Johnson",
    email: "maria@example.com",
    subject: "Freelance Project",
    message: "Hi there, I'm looking for someone to build a small e-commerce website for my handmade jewelry business. I like your portfolio and style. Can we discuss details and pricing?",
    createdAt: "2023-08-14T15:45:00Z",
    read: true
  },
  {
    id: "3",
    name: "David Chen",
    email: "david@example.com",
    subject: "Collaboration on Open Source",
    message: "Hey, I'm working on an open-source project focused on accessibility tools for developers. Based on your GitHub contributions, I think you'd be a great fit to collaborate. Let me know if you're interested!",
    createdAt: "2023-08-13T09:20:00Z",
    read: true
  },
  {
    id: "4",
    name: "Sarah Williams",
    email: "sarah@example.com",
    subject: "Speaking at Tech Conference",
    message: "Hello, I'm organizing a web development conference next month and would love to have you as a speaker. Your work on frontend optimization is exactly what our audience would benefit from. Please let me know if you're available.",
    createdAt: "2023-08-12T14:10:00Z",
    read: false
  },
  {
    id: "5",
    name: "Michael Rodriguez",
    email: "michael@example.com",
    subject: "Question About Your Project",
    message: "Hi, I'm a CS student and I was studying your GitHub project on data visualization. I'm curious about how you implemented the real-time updates. Would you mind sharing some insights?",
    createdAt: "2023-08-11T11:05:00Z",
    read: true
  }
];

const Messages = () => {
  const [messages, setMessages] = useState(mockMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  const unreadCount = messages.filter(msg => !msg.read).length;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };
  
  // Filter messages based on search and current tab
  const filterMessages = (messages: typeof mockMessages, tab: string) => {
    return messages
      .filter(msg => {
        const matchesSearch = 
          msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.message.toLowerCase().includes(searchQuery.toLowerCase());
          
        if (tab === "all") return matchesSearch;
        if (tab === "unread") return matchesSearch && !msg.read;
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };
  
  // Mark message as read
  const markAsRead = (id: string) => {
    setMessages(
      messages.map((msg) =>
        msg.id === id ? { ...msg, read: true } : msg
      )
    );
  };
  
  // Delete message
  const deleteMessage = (id: string) => {
    setMessages(messages.filter(msg => msg.id !== id));
    if (selectedMessageId === id) {
      setSelectedMessageId(null);
    }
  };
  
  // Get selected message
  const selectedMessage = messages.find(msg => msg.id === selectedMessageId);
  
  // Handle message selection
  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id);
    markAsRead(id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Manage messages from your contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">
                    All Messages
                  </TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <TabsContent value="all" className="m-0">
                  <div className="border rounded-md h-[60vh] overflow-hidden">
                    <div className="overflow-y-auto h-full">
                      {filterMessages(messages, "all").length > 0 ? (
                        filterMessages(messages, "all").map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-4 border-b cursor-pointer hover:bg-secondary/50 transition-colors ${
                              selectedMessageId === msg.id ? "bg-secondary" : ""
                            } ${!msg.read ? "font-medium" : ""}`}
                            onClick={() => handleSelectMessage(msg.id)}
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium truncate">{msg.name}</h3>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{msg.email}</p>
                            <p className="text-sm truncate">{msg.subject}</p>
                            {!msg.read && (
                              <div className="flex justify-end">
                                <Badge variant="default" className="mt-1">New</Badge>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No messages found
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="unread" className="m-0">
                  <div className="border rounded-md h-[60vh] overflow-hidden">
                    <div className="overflow-y-auto h-full">
                      {filterMessages(messages, "unread").length > 0 ? (
                        filterMessages(messages, "unread").map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-4 border-b cursor-pointer hover:bg-secondary/50 transition-colors ${
                              selectedMessageId === msg.id ? "bg-secondary" : ""
                            } font-medium`}
                            onClick={() => handleSelectMessage(msg.id)}
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium truncate">{msg.name}</h3>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{msg.email}</p>
                            <p className="text-sm truncate">{msg.subject}</p>
                            <div className="flex justify-end">
                              <Badge variant="default" className="mt-1">New</Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No unread messages
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Message Detail View */}
                <div className="md:col-span-2 border rounded-md h-[60vh] overflow-hidden">
                  {selectedMessage ? (
                    <div className="flex flex-col h-full">
                      <div className="p-4 border-b">
                        <div className="flex justify-between items-center">
                          <h2 className="text-xl font-semibold">{selectedMessage.subject}</h2>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMessage(selectedMessage.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <span>{selectedMessage.name[0].toUpperCase()}</span>
                          </div>
                          <div className="ml-2">
                            <p className="font-medium">{selectedMessage.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedMessage.email}</p>
                          </div>
                          <div className="ml-auto text-xs text-muted-foreground">
                            {formatDate(selectedMessage.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 overflow-y-auto">
                        <p className="whitespace-pre-line">{selectedMessage.message}</p>
                      </div>
                      
                      <div className="p-4 border-t">
                        <Button className="w-full">Reply</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Select a message to view
                    </div>
                  )}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Messages;
