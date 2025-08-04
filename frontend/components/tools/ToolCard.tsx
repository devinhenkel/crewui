'use client';

import { useState } from 'react';
import { Tool } from '@/types/tool';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toolsApi } from '@/lib/api/tools';

interface ToolCardProps {
  tool: Tool;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ToolCard({ tool, onEdit, onDelete }: ToolCardProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleTest = async () => {
    if (tool.tool_type !== 'custom') return;
    
    setTesting(true);
    try {
      const result = await toolsApi.testTool(tool.id, {
        input_data: { test: "Hello World" }
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{tool.name}</CardTitle>
          <div className="flex space-x-1">
            <Badge variant={tool.tool_type === 'langchain' ? 'default' : 'secondary'}>
              {tool.tool_type}
            </Badge>
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
            <span className="text-sm font-medium">Category:</span>
            <Badge variant="outline" className="ml-2">{tool.category}</Badge>
          </div>
          
          {tool.tags && tool.tags.length > 0 && (
            <div>
              <span className="text-sm font-medium">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {tool.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {tool.tool_type === 'custom' && tool.python_code && (
            <div>
              <span className="text-sm font-medium">Code Preview:</span>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                {tool.python_code.substring(0, 100)}
                {tool.python_code.length > 100 && '...'}
              </pre>
            </div>
          )}

          {testResult && (
            <div className="mt-3 p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Test Result:</span>
              <div className={`text-xs mt-1 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.success ? 'Success' : 'Failed'}
                {testResult.error && `: ${testResult.error}`}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <div className="flex space-x-2">
              <Button size="sm" onClick={onEdit} variant="outline">
                Edit
              </Button>
              {tool.tool_type === 'custom' && (
                <Button size="sm" onClick={handleTest} disabled={testing} variant="outline">
                  {testing ? 'Testing...' : 'Test'}
                </Button>
              )}
            </div>
            <Button size="sm" onClick={onDelete} variant="destructive">
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 