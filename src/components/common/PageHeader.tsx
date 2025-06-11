import { Button } from '@/components/ui/button';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: LucideIcon;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  secondaryActionLabel,
  secondaryActionIcon: SecondaryActionIcon,
  onSecondaryAction,
  children
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-in fade-in-50 duration-300">
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      
      <div className="flex-shrink-0 flex flex-wrap gap-2">
        {children}
        
        {secondaryActionLabel && onSecondaryAction && (
          <Button 
            variant="outline" 
            onClick={onSecondaryAction}
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            {SecondaryActionIcon && <SecondaryActionIcon className="mr-2 h-4 w-4" />}
            {secondaryActionLabel}
          </Button>
        )}
        
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}