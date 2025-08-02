import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function ExecutionsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executions</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage workflow executions
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="text-center py-12">
        <CardContent>
          <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Play className="h-8 w-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Executions Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            The executions monitoring system is currently under development. 
            You'll be able to track process runs, view real-time logs, and manage execution history.
          </p>
          <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-2 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Real-time monitoring</span>
            </div>
            <div className="flex items-center space-x-2 text-orange-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Execution history</span>
            </div>
            <div className="flex items-center space-x-2 text-orange-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Error handling</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 