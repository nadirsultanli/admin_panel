import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard, HelpCircle } from 'lucide-react';

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  
  const shortcuts = [
    { key: 'Ctrl+K', description: 'Open global search' },
    { key: 'Esc', description: 'Close dialogs and modals' },
    { key: 'Enter', description: 'Submit forms or confirm actions' },
    { key: 'Tab', description: 'Navigate between form fields' },
    { key: '/', description: 'Focus search input' },
    { key: 'Ctrl+S', description: 'Save changes (where applicable)' },
    { key: 'Ctrl+N', description: 'Create new item (where applicable)' },
    { key: 'F5', description: 'Refresh current page' }
  ];
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="fixed bottom-4 right-4 h-10 w-10 rounded-full shadow-md bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate the application more efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between">
              <span className="text-sm">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
          <HelpCircle className="h-4 w-4" />
          <span>Press <kbd className="px-1 text-xs font-semibold bg-gray-100 border rounded">?</kbd> anywhere to show this dialog</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}