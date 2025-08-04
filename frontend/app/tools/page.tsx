'use client';

import { useState, useEffect } from 'react';
import { Tool, ToolFilters } from '@/types/tool';
import { toolsApi } from '@/lib/api/tools';
import ToolCard from '@/components/tools/ToolCard';
import ToolForm from '@/components/tools/ToolForm';
import ToolLibrary from '@/components/tools/ToolLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [toolTypes, setToolTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState<ToolFilters>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  useEffect(() => {
    loadTools();
    loadCategories();
    loadToolTypes();
  }, [filters]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await toolsApi.getTools(filters);
      setTools(data);
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await toolsApi.getToolCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadToolTypes = async () => {
    try {
      const data = await toolsApi.getToolTypes();
      setToolTypes(data);
    } catch (error) {
      console.error('Error loading tool types:', error);
    }
  };

  const handleCreateTool = async (tool: any) => {
    try {
      await toolsApi.createTool(tool);
      setShowForm(false);
      loadTools();
    } catch (error) {
      console.error('Error creating tool:', error);
    }
  };

  const handleUpdateTool = async (id: number, tool: any) => {
    try {
      await toolsApi.updateTool(id, tool);
      setSelectedTool(null);
      loadTools();
    } catch (error) {
      console.error('Error updating tool:', error);
    }
  };

  const handleDeleteTool = async (id: number) => {
    try {
      await toolsApi.deleteTool(id);
      loadTools();
    } catch (error) {
      console.error('Error deleting tool:', error);
    }
  };

  const handleAddTool = async (toolKey: string, libraryType: 'langchain' | 'crewai') => {
    try {
      if (libraryType === 'langchain') {
        await toolsApi.addLangChainTool(toolKey);
      } else {
        await toolsApi.addCrewAITool(toolKey);
      }
      setShowLibrary(false);
      loadTools();
    } catch (error) {
      console.error('Error adding tool:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tools Library</h1>
        <div className="space-x-2">
          <Button onClick={() => setShowLibrary(true)} variant="outline">
            Add from Library
          </Button>
          <Button onClick={() => setShowForm(true)}>
            Create Custom Tool
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search tools..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.tool_type || 'all'}
              onValueChange={(value) => setFilters({ ...filters, tool_type: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {toolTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid */}
      {loading ? (
        <div className="text-center py-8">Loading tools...</div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No tools found. Create your first tool or add one from the LangChain library.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onEdit={() => setSelectedTool(tool)}
              onDelete={() => handleDeleteTool(tool.id)}
            />
          ))}
        </div>
      )}

      {/* Tool Form Modal */}
      {showForm && (
        <ToolForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateTool}
        />
      )}

      {/* Edit Tool Form Modal */}
      {selectedTool && (
        <ToolForm
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
          onSubmit={(tool) => handleUpdateTool(selectedTool.id, tool)}
        />
      )}

      {/* Tools Library Modal */}
      {showLibrary && (
        <ToolLibrary
          onClose={() => setShowLibrary(false)}
          onAddTool={handleAddTool}
        />
      )}
    </div>
  );
} 