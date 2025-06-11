import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

export function useHotkeys(key: string, callback: KeyHandler): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Parse the key combination
      const keys = key.toLowerCase().split('+');
      const mainKey = keys[keys.length - 1];
      
      // Check if modifiers match
      const ctrlRequired = keys.includes('ctrl');
      const shiftRequired = keys.includes('shift');
      const altRequired = keys.includes('alt');
      const metaRequired = keys.includes('meta') || keys.includes('cmd');
      
      const ctrlMatches = ctrlRequired === e.ctrlKey;
      const shiftMatches = shiftRequired === e.shiftKey;
      const altMatches = altRequired === e.altKey;
      const metaMatches = metaRequired === e.metaKey;
      
      // Check if the main key matches - add null check to prevent error
      const keyMatches = e.key && e.key.toLowerCase() === mainKey;
      
      // If all conditions match, call the callback
      if (ctrlMatches && shiftMatches && altMatches && metaMatches && keyMatches) {
        e.preventDefault();
        callback(e);
      }
    };
    
    window.addEventListener('keydown', handler);
    
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [key, callback]);
}