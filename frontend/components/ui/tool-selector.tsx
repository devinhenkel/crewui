'use client';

import { useState, useEffect } from 'react';
import { Tool } from '@/types/tool';
import { toolsApi } from '@/lib/api/tools';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  X, 
  Plus, 
  Filter,
  Wrench,
  Code,
  Database,
  Globe,
  Zap
} from 'lucide-react';

interface ToolSelectorProps {
  selectedTools: number[]; // Array of tool IDs
  onToolsChange: (toolIds: number[]) => void;
  label?: string;
  placeholder?: string;
  maxTools?: number;
  disabled?: boolean;
}

interface ToolBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tool: Tool) => void;
  selectedToolIds: number[];
}

function ToolBrowser({ isOpen, onClose, onSelect, selectedToolIds }: ToolBrowserProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadTools();
      loadCategories();
    }
  }, [isOpen, searchTerm, selectedCategory, selectedType]);

  const loadTools = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (selectedType !== 'all') filters.tool_type = selectedType;
      
      const toolsData = await toolsApi.getTools(filters);
      setTools(toolsData.filter(tool => tool.is_active));
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await toolsApi.getToolCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const getToolIcon = (tool: Tool) => {
    switch (tool.tool_type) {
      case 'langchain':
        return <Database className="h-4 w-4" />;
      case 'crewai':
        return <Zap className="h-4 w-4" />;
      case 'custom':
        return <Code className="h-4 w-4" />;
      case 'builtin':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getToolTypeColor = (type: string) => {
    switch (type) {
      case 'langchain':
        return 'bg-blue-100 text-blue-800';
      case 'crewai':
        return 'bg-purple-100 text-purple-800';
      case 'custom':
        return 'bg-green-100 text-green-800';
      case 'builtin':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTools = tools.filter(tool => 
    !selectedToolIds.includes(tool.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Tools</DialogTitle>
          <DialogDescription>
            Choose tools to add to your agent or task. You can search and filter by category or type.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter Controls */}
        <div className="flex-shrink-0 space-y-4 border-b pb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="langchain">LangChain</SelectItem>
                <SelectItem value="crewai">CrewAI</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="builtin">Built-in</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No tools found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
              {filteredTools.map(tool => (
                <Card 
                  key={tool.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  onClick={() => onSelect(tool)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getToolIcon(tool)}
                        <h4 className="font-medium text-sm">{tool.name}</h4>
                      </div>
                      <Badge className={`text-xs ${getToolTypeColor(tool.tool_type)}`}>
                        {tool.tool_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {tool.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {tool.category.replace('_', ' ')}
                      </span>
                      {tool.requires_api_key && (
                        <Badge variant="outline" className="text-xs">
                          API Key Required
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ToolSelector({ 
  selectedTools, 
  onToolsChange, 
  label = "Tools",
  placeholder = "No tools selected",
  maxTools,
  disabled = false
}: ToolSelectorProps) {
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load tools for display
  useEffect(() => {
    if (selectedTools.length > 0) {
      loadSelectedTools();
    }
  }, [selectedTools]);

  const loadSelectedTools = async () => {
    setLoading(true);
    try {
      // Load all tools to get details for selected ones
      const allTools = await toolsApi.getTools();
      const selectedToolsData = allTools.filter(tool => 
        selectedTools.includes(tool.id)
      );
      setAvailableTools(selectedToolsData);
    } catch (error) {
      console.error('Failed to load selected tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolSelect = (tool: Tool) => {
    if (maxTools && selectedTools.length >= maxTools) {
      return; // Don't add if max reached
    }
    
    const newSelectedTools = [...selectedTools, tool.id];
    onToolsChange(newSelectedTools);
    setAvailableTools([...availableTools, tool]);
  };

  const handleToolRemove = (toolId: number) => {
    const newSelectedTools = selectedTools.filter(id => id !== toolId);
    onToolsChange(newSelectedTools);
    setAvailableTools(availableTools.filter(tool => tool.id !== toolId));
  };

  const getToolIcon = (tool: Tool) => {
    switch (tool.tool_type) {
      case 'langchain':
        return <Database className="h-3 w-3" />;
      case 'crewai':
        return <Zap className="h-3 w-3" />;
      case 'custom':
        return <Code className="h-3 w-3" />;
      case 'builtin':
        return <Wrench className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {maxTools && (
          <span className="text-xs text-gray-500">
            {selectedTools.length}/{maxTools} selected
          </span>
        )}
      </div>

      {/* Selected Tools Display */}
      <div className="min-h-[40px] p-3 border rounded-md bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        ) : availableTools.length === 0 ? (
          <span className="text-gray-500 text-sm">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTools.map(tool => (
              <div 
                key={tool.id}
                className="flex items-center space-x-1 bg-white border rounded-full px-3 py-1 text-sm"
              >
                {getToolIcon(tool)}
                <span>{tool.name}</span>
                {!disabled && (
                  <button
                    onClick={() => handleToolRemove(tool.id)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                    title={`Remove ${tool.name}`}
                    aria-label={`Remove ${tool.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Tool Button */}
      {!disabled && (!maxTools || selectedTools.length < maxTools) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowBrowser(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tool
        </Button>
      )}

      {/* Tool Browser Dialog */}
      <ToolBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelect={handleToolSelect}
        selectedToolIds={selectedTools}
      />
    </div>
  );
}