import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Database, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Package
} from 'lucide-react';
import { useInventorySeeding } from '@/hooks/useInventorySeeding';

interface StockSeedingButtonProps {
  onSeedingComplete?: () => void;
}

export function StockSeedingButton({ onSeedingComplete }: StockSeedingButtonProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  
  const {
    isSeeding,
    seedingProgress,
    startSeeding
  } = useInventorySeeding();

  const handleSeedingClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmSeeding = async () => {
    setConfirmDialogOpen(false);
    setProgressDialogOpen(true);
    
    try {
      await startSeeding();
      // Keep dialog open for a moment to show completion
      setTimeout(() => {
        setProgressDialogOpen(false);
        onSeedingComplete?.();
      }, 1500);
    } catch (error) {
      setProgressDialogOpen(false);
    }
  };

  const getProgressPercentage = () => {
    if (!seedingProgress) return 0;
    return (seedingProgress.progress / seedingProgress.total) * 100;
  };

  return (
    <>
      <Button 
        onClick={handleSeedingClick}
        variant="outline"
        className="border-dashed border-2 hover:border-solid transition-all duration-200 bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
      >
        <Database className="mr-2 h-4 w-4" />
        Seed Initial Stock
      </Button>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Seed Initial Inventory Data
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will create the following initial setup:
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="font-medium">📦 Warehouse:</div>
                <ul className="ml-4 space-y-1">
                  <li>• Main Depot (1000 cylinder capacity)</li>
                </ul>
                
                <div className="font-medium mt-3">🏭 Products:</div>
                <ul className="ml-4 space-y-1">
                  <li>• 20kg Standard Cylinder</li>
                  <li>• 50kg Standard Cylinder</li>
                  <li>• 100kg Industrial Cylinder</li>
                </ul>
                
                <div className="font-medium mt-3">📊 Initial Stock:</div>
                <ul className="ml-4 space-y-1">
                  <li>• 20kg: 100 full, 50 empty</li>
                  <li>• 50kg: 75 full, 25 empty</li>
                  <li>• 100kg: 30 full, 10 empty</li>
                </ul>
              </div>
              
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">
                  This will create sample data for demonstration. Existing data will be updated if conflicts occur.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSeeding}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Start Seeding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px]" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isSeeding ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {isSeeding ? 'Seeding Inventory...' : 'Seeding Complete!'}
            </DialogTitle>
            <DialogDescription>
              {seedingProgress?.step || 'Preparing to seed inventory data...'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(getProgressPercentage())}%</span>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-2"
              />
            </div>
            
            {seedingProgress && (
              <div className="text-sm text-muted-foreground">
                Step {seedingProgress.progress} of {seedingProgress.total}
              </div>
            )}
            
            {!isSeeding && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Inventory seeding completed successfully!
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}