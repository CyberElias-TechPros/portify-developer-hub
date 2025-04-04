
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Mail, Search, RefreshCw, CheckCircle, Circle } from "lucide-react";
import AdminLayout from "@/components/admin/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
}

const Messages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      setFilteredMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setMessages(
        messages.map((msg) => (msg.id === id ? { ...msg, read: true } : msg))
      );
      setFilteredMessages(
        filteredMessages.map((msg) =>
          msg.id === id ? { ...msg, read: true } : msg
        )
      );

      toast({
        title: "Success",
        description: "Message marked as read",
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    // Filter messages based on search query and active tab
    let filtered = messages;

    if (searchQuery) {
      filtered = filtered.filter(
        (msg) =>
          msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === "unread") {
      filtered = filtered.filter((msg) => !msg.read);
    } else if (activeTab === "read") {
      filtered = filtered.filter((msg) => msg.read);
    }

    setFilteredMessages(filtered);
  }, [searchQuery, activeTab, messages]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Contact Messages</h1>
            <p className="text-muted-foreground">
              Manage and respond to contact form submissions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchMessages}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread{" "}
              {messages.filter((msg) => !msg.read).length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {messages.filter((msg) => !msg.read).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                <div className="border-r col-span-1 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      ))}
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No messages found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "Try a different search term"
                          : "You'll see new messages here when people contact you"}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {filteredMessages.map((message) => (
                        <li
                          key={message.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedMessage?.id === message.id
                              ? "bg-muted"
                              : ""
                          } ${!message.read ? "font-medium" : ""}`}
                          onClick={() => setSelectedMessage(message)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                {message.read ? (
                                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Circle className="h-4 w-4 text-primary" />
                                )}
                                <p className="text-sm font-medium truncate">
                                  {message.name}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {message.email}
                              </p>
                              <p className="text-sm truncate mt-1">
                                {message.subject}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(
                                  new Date(message.created_at),
                                  "MMM d, yyyy 'at' h:mm a"
                                )}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  {selectedMessage ? (
                    <div className="p-6">
                      <div className="mb-6 flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-semibold">
                            {selectedMessage.subject}
                          </h2>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-muted-foreground">
                              From: {selectedMessage.name} &lt;{selectedMessage.email}&gt;
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(selectedMessage.created_at),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                        {!selectedMessage.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(selectedMessage.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                      <div className="mt-6 bg-card p-4 rounded-md whitespace-pre-line">
                        {selectedMessage.message}
                      </div>
                      <div className="mt-6 flex space-x-3">
                        <Button
                          variant="default"
                          asChild
                        >
                          <a 
                            href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Reply via Email
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <Mail className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Select a message</h3>
                      <p className="text-muted-foreground">
                        Choose a message from the list to view its details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Messages;
