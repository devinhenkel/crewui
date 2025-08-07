'use client';

import { useState, useEffect } from 'react';
import { Tool, ToolCreate, ToolUpdate } from '@/types/tool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ToolFormProps {
  tool?: Tool;
  onClose: () => void;
  onSubmit: (tool: ToolCreate | ToolUpdate) => void;
}

const TOOL_CATEGORIES = [
  'web_search',
  'information',
  'utilities',
  'file_operations',
  'programming',
  'system',
  'web',
  'data_analysis',
  'communication',
  'other'
];

export default function ToolForm({ tool, onClose, onSubmit }: ToolFormProps) {
  const [formData, setFormData] = useState<ToolCreate | ToolUpdate>({
    name: '',
    description: '',
    tool_type: 'custom',
    category: 'other',
    python_code: '',
    is_active: true,
    requires_api_key: false,
    tags: [],
    version: '1.0.0'
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        description: tool.description,
        tool_type: tool.tool_type,
        category: tool.category,
        langchain_tool_name: tool.langchain_tool_name,
        langchain_params: tool.langchain_params,
        python_code: tool.python_code,
        custom_params: tool.custom_params,
        is_active: tool.is_active,
        requires_api_key: tool.requires_api_key,
        api_key_name: tool.api_key_name,
        tags: tool.tags,
        version: tool.version,
        author: tool.author
      });
    }
  }, [tool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{tool ? 'Edit Tool' : 'Create New Tool'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="tool_type">Tool Type</Label>
                <Select
                  value={formData.tool_type}
                  onValueChange={(value) => setFormData({ ...formData, tool_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Tool</SelectItem>
                    <SelectItem value="langchain">LangChain Tool</SelectItem>
                    <SelectItem value="builtin">Built-in Tool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOL_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
            </div>

            {formData.tool_type === 'langchain' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="langchain_tool_name">LangChain Tool Name</Label>
                  <Input
                    id="langchain_tool_name"
                    value={formData.langchain_tool_name || ''}
                    onChange={(e) => setFormData({ ...formData, langchain_tool_name: e.target.value })}
                    placeholder="e.g., DuckDuckGoSearchRun"
                  />
                </div>
                <div>
                  <Label htmlFor="api_key_name">API Key Name (if required)</Label>
                  <Input
                    id="api_key_name"
                    value={formData.api_key_name || ''}
                    onChange={(e) => setFormData({ ...formData, api_key_name: e.target.value })}
                    placeholder="e.g., SERPAPI_API_KEY"
                  />
                </div>
              </div>
            )}

            {formData.tool_type === 'custom' && (
              <div>
                <Label htmlFor="python_code">Python Code</Label>
                <Textarea
                  id="python_code"
                  value={formData.python_code || ''}
                  onChange={(e) => setFormData({ ...formData, python_code: e.target.value })}
                  placeholder={`# Example custom tool
# Access input data via input_data variable
# Set result variable with your output
# Handle errors by setting error variable

try:
    # Your tool logic here
    result = f"Processed: {input_data.get('text', 'No text provided')}"
    error = None
except Exception as e:
    result = None
    error = str(e)`}
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use <code>input_data</code> to access input, set <code>result</code> for output, and <code>error</code> for errors.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_api_key"
                  checked={formData.requires_api_key}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_api_key: checked })}
                />
                <Label htmlFor="requires_api_key">Requires API Key</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="author">Author (optional)</Label>
              <Input
                id="author"
                value={formData.author || ''}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Tool author name"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button type="submit">
                {tool ? 'Update Tool' : 'Create Tool'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 