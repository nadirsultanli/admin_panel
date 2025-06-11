import { Button } from '@/components/ui/button';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: LucideIcon;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  secondaryActionLabel,
  secondaryActionIcon: SecondaryActionIcon,
  onSecondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in-50 duration-500">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      
      <p className="text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="min-w-32">
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
        
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction} className="min-w-32 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900">
            {SecondaryActionIcon && <SecondaryActionIcon className="mr-2 h-4 w-4" />}
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}