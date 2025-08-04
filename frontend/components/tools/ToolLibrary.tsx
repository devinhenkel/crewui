'use client';

import { useState, useEffect } from 'react';
import { LangChainTool } from '@/types/tool';
import { toolsApi } from '@/lib/api/tools';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface ToolLibraryProps {
  onClose: () => void;
  onAddTool: (toolKey: string, libraryType: 'langchain' | 'crewai') => void;
}

export default function ToolLibrary({ onClose, onAddTool }: ToolLibraryProps) {
  const [langchainTools, setLangchainTools] = useState<Record<string, LangChainTool>>({});
  const [crewaiTools, setCrewaiTools] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLibrary, setSelectedLibrary] = useState<'langchain' | 'crewai'>('langchain');

  useEffect(() => {
    loadLibraries();
  }, []);

  const loadLibraries = async () => {
    try {
      setLoading(true);
      const [langchainData, crewaiData] = await Promise.all([
        toolsApi.getLangChainLibrary(),
        toolsApi.getCrewAILibrary()
      ]);
      setLangchainTools(langchainData);
      setCrewaiTools(crewaiData);
    } catch (error) {
      console.error('Error loading tool libraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTools = () => {
    return selectedLibrary === 'langchain' ? langchainTools : crewaiTools;
  };

  const filteredTools = Object.entries(getCurrentTools()).filter(([key, tool]) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(Object.values(getCurrentTools()).map((tool: any) => tool.category)))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tools Library</CardTitle>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading tools libraries...</div>
          ) : (
            <>
              {/* Library Selector */}
              <div className="mb-6">
                <Select value={selectedLibrary} onValueChange={(value: 'langchain' | 'crewai') => setSelectedLibrary(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="langchain">LangChain Tools</SelectItem>
                    <SelectItem value="crewai">CrewAI Tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filters */}
              <div className="mb-6 space-y-4">
                <Input
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'All Categories' : category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tools Grid */}
              {filteredTools.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tools found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTools.map(([key, tool]) => (
                    <Card key={key} className="h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                          <div className="flex space-x-1">
                            <Badge variant="outline">{tool.category}</Badge>
                            {tool.requires_api_key && (
                              <Badge variant="destructive">API Key</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{tool.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium">
                              {selectedLibrary === 'langchain' ? 'LangChain Class:' : 'CrewAI Tool:'}
                            </span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded ml-2">
                              {selectedLibrary === 'langchain' ? tool.langchain_tool_name : tool.crewai_tool_name}
                            </code>
                          </div>
                          
                          {tool.requires_api_key && tool.api_key_name && (
                            <div>
                              <span className="text-sm font-medium">Required API Key:</span>
                              <code className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">
                                {tool.api_key_name}
                              </code>
                            </div>
                          )}

                          <Button
                            onClick={() => onAddTool(key, selectedLibrary)}
                            className="w-full"
                            size="sm"
                          >
                            Add to Library
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 