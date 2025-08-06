'use client';

import { useState, useEffect } from 'react';
import { Process, ProcessCreate, ProcessUpdate } from '@/types/process';
import { useProcessStore } from '@/lib/stores/processStore';
import { ProcessForm } from './ProcessForm';
import { ProcessBuilder } from './ProcessBuilder';
import { ProcessCard } from './ProcessCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, AlertCircle, Loader2, GitBranch, Settings } from 'lucide-react';

export function ProcessLibrary() {
  const {
    processes,
    loading,
    error,
    fetchProcesses,
    createProcess,
    updateProcess,
    deleteProcess,
    executeProcess,
    clearError,
  } = useProcessStore();

  const [showForm, setShowForm] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingProcess, setViewingProcess] = useState<Process | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [buildingProcess, setBuildingProcess] = useState<Process | null>(null);

  useEffect(() => {
    fetchProcesses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchProcesses({ search: value });
  };

  const handleCreateProcess = async (data: ProcessCreate | ProcessUpdate) => {
    if ('name' in data && data.name && 'process_type' in data && data.process_type) {
      await createProcess(data as ProcessCreate);
      setShowForm(false);
    }
  };

  const handleUpdateProcess = async (data: ProcessCreate | ProcessUpdate) => {
    if (editingProcess) {
      await updateProcess(editingProcess.id, data as ProcessUpdate);
      setEditingProcess(null);
    }
  };

  const handleDeleteProcess = async (id: number) => {
    await deleteProcess(id);
  };

  const handleExecuteProcess = async (id: number, variables?: Record<string, string>) => {
    try {
      const result = await executeProcess(id, variables);
      console.log('Process execution started:', result);
      return result;
    } catch (error) {
      console.error('Failed to execute process:', error);
      throw error;
    }
  };

  const handleEditProcess = (process: Process) => {
    setEditingProcess(process);
    setShowForm(false);
  };

  const handleViewProcess = (process: Process) => {
    setViewingProcess(process);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProcess(null);
    setViewingProcess(null);
    setShowBuilder(false);
    setBuildingProcess(null);
  };

  const handleOpenBuilder = (process: Process) => {
    setBuildingProcess(process);
    setShowBuilder(true);
  };

  const handleSaveBuilder = async (configuration: any) => {
    if (buildingProcess) {
      await updateProcess(buildingProcess.id, { configuration });
      setShowBuilder(false);
      setBuildingProcess(null);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <Button onClick={clearError} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Process Library</h1>
          <p className="text-gray-600 mt-1">
            Create and manage workflow processes for your CrewAI applications
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create Process</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search processes..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Form */}
      {(showForm || editingProcess) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto">
            <ProcessForm
              process={editingProcess || undefined}
              onSubmit={editingProcess ? handleUpdateProcess : handleCreateProcess}
              onCancel={handleCancelForm}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Process Builder */}
      {showBuilder && buildingProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-6xl">
            <ProcessBuilder
              process={buildingProcess}
              onSave={handleSaveBuilder}
              onCancel={handleCancelForm}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Process Detail Modal */}
      {viewingProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5 text-purple-600" />
                  <div>
                    <CardTitle className="text-xl">{viewingProcess.name}</CardTitle>
                    <CardDescription>
                      Process Details
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenBuilder(viewingProcess)}
                    className="h-8 px-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    title="Configure Process"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingProcess(null)}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {viewingProcess.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{viewingProcess.description}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Process Type</h4>
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                  viewingProcess.process_type === 'sequential' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {viewingProcess.process_type === 'sequential' ? 'Sequential' : 'Hierarchical'}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(viewingProcess.configuration, null, 2)}
                </pre>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(viewingProcess.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(viewingProcess.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {loading && !processes.length && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-gray-600">Loading processes...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !processes.length && !searchTerm && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <GitBranch className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No processes yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first workflow process.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
              Create Your First Process
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!loading && !processes.length && searchTerm && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No processes found</h3>
            <p className="text-gray-600 mb-4">
              No processes match your search criteria. Try adjusting your search terms.
            </p>
            <Button variant="outline" onClick={() => handleSearch('')}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Process Grid */}
      {processes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processes.map((process) => (
            <ProcessCard
              key={process.id}
              process={process}
              onEdit={handleEditProcess}
              onDelete={handleDeleteProcess}
              onView={handleViewProcess}
              onExecute={handleExecuteProcess}
              onConfigure={handleOpenBuilder}
            />
          ))}
        </div>
      )}

      {/* Loading More */}
      {loading && processes.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
} 