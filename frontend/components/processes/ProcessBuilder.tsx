'use client';

import { useState, useEffect } from 'react';
import { Process, ProcessStep, SequentialProcessConfig, HierarchicalProcessConfig } from '@/types/process';
import { Agent } from '@/types/agent';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Users, 
  ListTodo, 
  Settings,
  ArrowRight,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Wrench
} from 'lucide-react';
import { agentsApi } from '@/lib/api/agents';
import { tasksApi } from '@/lib/api/tasks';
import { ToolSelector } from './ToolSelector';

interface ProcessBuilderProps {
  process: Process;
  onSave: (configuration: SequentialProcessConfig | HierarchicalProcessConfig) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface ProcessStepWithDetails extends ProcessStep {
  task?: Task;
  agent?: Agent;
  tools?: number[];
}

export function ProcessBuilder({ process, onSave, onCancel, loading = false }: ProcessBuilderProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [steps, setSteps] = useState<ProcessStepWithDetails[]>([]);
  const [hierarchy, setHierarchy] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Load agents and tasks
  useEffect(() => {
    const loadData = async () => {
      try {
        const [agentsData, tasksData] = await Promise.all([
          agentsApi.getAgents(),
          tasksApi.getTasks()
        ]);
        setAgents(agentsData);
        setTasks(tasksData);
        
        // Load existing configuration if editing
        if (process.configuration) {
          if (process.process_type === 'sequential') {
            const config = process.configuration as SequentialProcessConfig;
            const stepsWithDetails = await Promise.all(
              config.steps.map(async (step) => {
                const task = tasksData.find(t => t.id === step.task_id);
                const agent = agentsData.find(a => a.id === step.agent_id);
                return {
                  ...step,
                  task,
                  agent,
                  tools: step.tools || []
                };
              })
            );
            setSteps(stepsWithDetails);
          } else {
            const config = process.configuration as HierarchicalProcessConfig;
            const stepsWithDetails = await Promise.all(
              config.tasks.map(async (step) => {
                const task = tasksData.find(t => t.id === step.task_id);
                const agent = agentsData.find(a => a.id === step.agent_id);
                return {
                  ...step,
                  task,
                  agent,
                  tools: step.tools || []
                };
              })
            );
            setSteps(stepsWithDetails);
            setHierarchy(config.hierarchy || {});
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [process]);

  const addStep = () => {
    const newStep: ProcessStepWithDetails = {
      id: `step-${Date.now()}`,
      task_id: 0,
      agent_id: 0,
      order: steps.length + 1,
      dependencies: [],
      tools: []
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
    // Update hierarchy if hierarchical
    if (process.process_type === 'hierarchical') {
      const newHierarchy = { ...hierarchy };
      Object.keys(newHierarchy).forEach(parentId => {
        newHierarchy[parentId] = newHierarchy[parentId].filter(childId => childId !== stepId);
      });
      delete newHierarchy[stepId];
      setHierarchy(newHierarchy);
    }
  };

  const updateStep = (stepId: string, updates: Partial<ProcessStepWithDetails>) => {
    setSteps(steps.map(step => 
      step.id === stepId 
        ? { 
            ...step, 
            ...updates,
            task: updates.task_id ? tasks.find(t => t.id === updates.task_id) : step.task,
            agent: updates.agent_id ? agents.find(a => a.id === updates.agent_id) : step.agent
          }
        : step
    ));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order for sequential processes
    if (process.process_type === 'sequential') {
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: index + 1
      }));
      setSteps(updatedItems);
    } else {
      setSteps(items);
    }
  };

  const addDependency = (stepId: string, dependencyId: string) => {
    setHierarchy(prev => ({
      ...prev,
      [stepId]: [...(prev[stepId] || []), dependencyId]
    }));
  };

  const removeDependency = (stepId: string, dependencyId: string) => {
    setHierarchy(prev => ({
      ...prev,
      [stepId]: prev[stepId]?.filter(id => id !== dependencyId) || []
    }));
  };

  const validateProcess = () => {
    if (steps.length === 0) return { valid: false, errors: ['At least one step is required'] };
    
    const errors: string[] = [];
    
    steps.forEach((step, index) => {
      if (!step.task_id) errors.push(`Step ${index + 1}: Task is required`);
      if (!step.agent_id) errors.push(`Step ${index + 1}: Agent is required`);
    });

    // Check for circular dependencies in hierarchical processes
    if (process.process_type === 'hierarchical') {
      const visited = new Set<string>();
      const recStack = new Set<string>();

      const hasCycle = (stepId: string): boolean => {
        if (recStack.has(stepId)) return true;
        if (visited.has(stepId)) return false;

        visited.add(stepId);
        recStack.add(stepId);

        const dependencies = hierarchy[stepId] || [];
        for (const depId of dependencies) {
          if (hasCycle(depId)) return true;
        }

        recStack.delete(stepId);
        return false;
      };

      for (const step of steps) {
        if (hasCycle(step.id)) {
          errors.push('Circular dependencies detected');
          break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    const validation = validateProcess();
    if (!validation.valid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (process.process_type === 'sequential') {
        const config: SequentialProcessConfig = {
          steps: steps.map(step => ({
            id: step.id,
            task_id: step.task_id,
            agent_id: step.agent_id,
            order: step.order,
            dependencies: step.dependencies || [],
            tools: step.tools || []
          }))
        };
        await onSave(config);
      } else {
        const config: HierarchicalProcessConfig = {
          tasks: steps.map(step => ({
            id: step.id,
            task_id: step.task_id,
            agent_id: step.agent_id,
            dependencies: step.dependencies || [],
            tools: step.tools || []
          })),
          hierarchy
        };
        await onSave(config);
      }
    } catch (error) {
      console.error('Error saving process:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading process builder...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validation = validateProcess();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center space-x-2">
              {process.process_type === 'sequential' ? (
                <ArrowRight className="h-5 w-5 text-purple-600" />
              ) : (
                <GitBranch className="h-5 w-5 text-purple-600" />
              )}
              <span>Process Builder: {process.name}</span>
            </CardTitle>
            <CardDescription>
              Configure tasks, agents, and execution order for your {process.process_type} process
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {validation.valid ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Valid</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Invalid</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Process Type Info */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            {process.process_type === 'sequential' ? (
              <ArrowRight className="h-4 w-4 text-purple-600" />
            ) : (
              <GitBranch className="h-4 w-4 text-purple-600" />
            )}
            <h4 className="font-medium text-purple-900">
              {process.process_type === 'sequential' ? 'Sequential Process' : 'Hierarchical Process'}
            </h4>
          </div>
          <p className="text-sm text-purple-700">
            {process.process_type === 'sequential' 
              ? 'Tasks will execute in the order shown below. Drag and drop to reorder steps.'
              : 'Tasks can have dependencies and run in parallel. Configure parent-child relationships below.'
            }
          </p>
        </div>

        {/* Steps Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-medium">Process Steps</Label>
            <Button onClick={addStep} size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-gray-400 mb-2">
                <Settings className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">No steps configured yet</p>
              <Button onClick={addStep} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Step
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="steps">
                {(provided: any) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {steps.map((step, index) => (
                      <Draggable key={step.id} draggableId={step.id} index={index}>
                        {(provided: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                          >
                            <div className="flex items-center space-x-3">
                              <div {...provided.dragHandleProps} className="text-gray-400">
                                <GripVertical className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Task Selection */}
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 mb-1">
                                    Task
                                  </Label>
                                  <Select
                                    value={step.task_id?.toString() || ''}
                                    onValueChange={(value) => updateStep(step.id, { task_id: parseInt(value) })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a task" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tasks.map((task) => (
                                        <SelectItem key={task.id} value={task.id.toString()}>
                                          <div className="flex items-center space-x-2">
                                            <ListTodo className="h-4 w-4 text-green-600" />
                                            <span>{task.name}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Agent Selection */}
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 mb-1">
                                    Agent
                                  </Label>
                                  <Select
                                    value={step.agent_id?.toString() || ''}
                                    onValueChange={(value) => updateStep(step.id, { agent_id: parseInt(value) })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {agents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id.toString()}>
                                          <div className="flex items-center space-x-2">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            <span>{agent.name}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Tools Selection */}
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 mb-1">
                                    Tools
                                  </Label>
                                  <ToolSelector
                                    selectedTools={step.tools || []}
                                    onToolsChange={(toolIds) => updateStep(step.id, { tools: toolIds })}
                                    disabled={!step.agent_id}
                                  />
                                </div>
                              </div>

                              {/* Remove Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStep(step.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Step Details */}
                            {step.task && step.agent && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Task:</span>
                                    <p className="text-gray-600 line-clamp-2">{step.task.description}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Agent:</span>
                                    <p className="text-gray-600 line-clamp-2">{step.agent.role}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Dependencies for Hierarchical Processes */}
                            {process.process_type === 'hierarchical' && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <Label className="text-sm font-medium text-gray-700 mb-2">
                                  Dependencies
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {steps
                                    .filter(s => s.id !== step.id)
                                    .map((otherStep) => (
                                      <button
                                        key={otherStep.id}
                                        onClick={() => {
                                          const isDependency = hierarchy[step.id]?.includes(otherStep.id);
                                          if (isDependency) {
                                            removeDependency(step.id, otherStep.id);
                                          } else {
                                            addDependency(step.id, otherStep.id);
                                          }
                                        }}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                          hierarchy[step.id]?.includes(otherStep.id)
                                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                        }`}
                                      >
                                        {otherStep.task?.name || `Step ${steps.indexOf(otherStep) + 1}`}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Validation Errors */}
        {!validation.valid && validation.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-medium text-red-900">Configuration Errors</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!validation.valid || isSubmitting || loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting || loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Save Process Configuration</span>
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 