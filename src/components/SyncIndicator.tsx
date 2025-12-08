import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SyncIndicatorProps {
  onSync: () => void;
  className?: string;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ onSync, className }) => {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleSync = useCallback(async () => {
    setStatus('syncing');
    try {
      await onSync();
      setStatus('success');
      setLastSync(new Date());
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [onSync]);

  // Initial sync indicator
  useEffect(() => {
    setLastSync(new Date());
  }, []);

  const getIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <CloudOff className="w-4 h-4 text-destructive" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  const getTooltipText = () => {
    switch (status) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Sincronizado';
      case 'error':
        return 'Error de sincronización';
      default:
        return lastSync 
          ? `Última sincronización: ${formatLastSync(lastSync)}`
          : 'Sincronizar ahora';
    }
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={status === 'syncing'}
            className={cn("h-8 w-8 sm:h-9 sm:w-9", className)}
            aria-label="Sincronizar"
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncIndicator;
