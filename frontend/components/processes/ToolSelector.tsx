'use client';

import { useState, useEffect } from 'react';
import { Tool } from '@/types/tool';
import { toolsApi } from '@/lib/api/tools';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Plus, 
  X, 
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ToolSelectorProps {
  selectedTools: number[];
  onToolsChange: (toolIds: number[]) => void;
  disabled?: boolean;
}

export function ToolSelector({ selectedTools, onToolsChange, disabled = false }: ToolSelectorProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [toolTypes, setToolTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load tools and metadata
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [toolsData, categoriesData, typesData] = await Promise.all([
          toolsApi.getTools(),
          toolsApi.getToolCategories(),
          toolsApi.getToolTypes()
        ]);
        setTools(toolsData);
        setFilteredTools(toolsData);
        setCategories(categoriesData);
        setToolTypes(typesData);
      } catch (error) {
        console.error('Error loading tools:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter tools based on search and filters
  useEffect(() => {
    let filtered = tools;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tool => tool.category === categoryFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tool => tool.tool_type === typeFilter);
    }

    setFilteredTools(filtered);
  }, [tools, searchTerm, categoryFilter, typeFilter]);

  const handleToolToggle = (toolId: number) => {
    const isSelected = selectedTools.includes(toolId);
    if (isSelected) {
      onToolsChange(selectedTools.filter(id => id !== toolId));
    } else {
      onToolsChange([...selectedTools, toolId]);
    }
  };

  const getSelectedToolNames = () => {
    return selectedTools.map(id => tools.find(t => t.id === id)?.name).filter(Boolean);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Wrench className="h-4 w-4 text-orange-600" />
        <span className="text-sm text-gray-600">
          {selectedTools.length} tools selected
        </span>
      </div>
      
      {/* Selected Tools Display */}
      {selectedTools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {getSelectedToolNames().map((name, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      )}

      {/* Tool Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={disabled}
            className="w-full justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedTools.length === 0 ? 'Add Tools' : 'Manage Tools'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Tools</DialogTitle>
            <DialogDescription>
              Choose tools that will be available for this process step. The agent will have access to these tools during execution.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {toolTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {filteredTools.length} tools found
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            {/* Tools List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading tools...</p>
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No tools found matching your criteria</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTools.map((tool) => {
                    const isSelected = selectedTools.includes(tool.id);
                    return (
                      <div
                        key={tool.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                        }`}
                        onClick={() => handleToolToggle(tool.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">{tool.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {tool.tool_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {tool.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {tool.description}
                            </p>
                            {tool.tags && tool.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {tool.tags.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {tool.tags.length > 3 && (
                                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                    +{tool.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {isSelected ? (
                              <CheckCircle className="h-5 w-5 text-orange-600" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 