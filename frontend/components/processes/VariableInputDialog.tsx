'use client';

import { useState, useEffect, useMemo } from 'react';
import { Process } from '@/types/process';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, AlertCircle } from 'lucide-react';

interface VariableInputDialogProps {
  process: Process | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (variables: Record<string, string>) => Promise<void>;
  loading?: boolean;
}

export function VariableInputDialog({ 
  process, 
  isOpen, 
  onClose, 
  onExecute, 
  loading = false 
}: VariableInputDialogProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processVariables, setProcessVariables] = useState<string[]>([]);

  // Extract variables from process configuration - looking in agent and task properties
  const extractVariables = async (process: Process): Promise<string[]> => {
    const vars = new Set<string>();
    const regex = /\{\{([^}]+)\}\}/g;
    
    try {
      // Get all agents and tasks to check their properties
      const [agentsResponse, tasksResponse] = await Promise.all([
        fetch('/api/v1/agents/'),
        fetch('/api/v1/tasks/')
      ]);
      
      const agents = await agentsResponse.json();
      const tasks = await tasksResponse.json();
      
      // Get steps from process configuration
      const config = process.configuration as any;
      const steps = config.steps || config.tasks || [];
      
      // Check each step's agent and task properties for variables
      steps.forEach((step: any) => {
        // Find the agent for this step
        const agent = agents.find((a: any) => a.id === step.agent_id);
        if (agent) {
          // Check agent properties for variables
          [agent.role, agent.goal, agent.backstory].forEach(text => {
            if (text) {
              let match;
              const regex = /\{\{([^}]+)\}\}/g;
              while ((match = regex.exec(text)) !== null) {
                vars.add(match[1].trim());
              }
            }
          });
        }
        
        // Find the task for this step
        const task = tasks.find((t: any) => t.id === step.task_id);
        if (task) {
          // Check task properties for variables
          [task.description, task.expected_output].forEach(text => {
            if (text) {
              let match;
              const regex = /\{\{([^}]+)\}\}/g;
              while ((match = regex.exec(text)) !== null) {
                vars.add(match[1].trim());
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('Error extracting variables:', error);
    }
    
    return Array.from(vars);
  };

  // Load process variables when process changes
  useEffect(() => {
    if (process) {
      extractVariables(process).then(setProcessVariables);
    } else {
      setProcessVariables([]);
    }
  }, [process]);

  useEffect(() => {
    if (isOpen && process && processVariables.length >= 0) {
      // Initialize variables with empty values
      const initialVars: Record<string, string> = {};
      processVariables.forEach(variable => {
        initialVars[variable] = '';
      });
      setVariables(initialVars);
      setErrors({});
    }
  }, [isOpen, process, processVariables]);

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value
    }));
    
    // Clear error for this variable
    if (errors[variable]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[variable];
        return newErrors;
      });
    }
  };

  const validateVariables = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    processVariables.forEach(variable => {
      if (!variables[variable] || variables[variable].trim() === '') {
        newErrors[variable] = 'This variable is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExecute = async () => {
    if (!validateVariables()) {
      return;
    }
    
    try {
      await onExecute(variables);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Execution failed:', error);
    }
  };

  const handleClose = () => {
    setVariables({});
    setErrors({});
    onClose();
  };

  if (!process) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-blue-500" />
            <span>Execute Process</span>
          </DialogTitle>
          <DialogDescription>
            Configure variables for "{process.name}" before execution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {processVariables.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No variables found in this process. You can proceed with execution.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                The following variables were found in your process configuration. 
                Please provide values for each:
              </p>
              
              {processVariables.map(variable => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable} className="text-sm font-medium">
                    {variable}
                  </Label>
                  <Textarea
                    id={variable}
                    value={variables[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    placeholder={`Enter value for ${variable}`}
                    className={errors[variable] ? 'border-red-500' : ''}
                    rows={2}
                  />
                  {errors[variable] && (
                    <p className="text-sm text-red-600">{errors[variable]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleExecute} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 