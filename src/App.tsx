/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dashboard from './components/Dashboard';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50">
          <Dashboard />
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

