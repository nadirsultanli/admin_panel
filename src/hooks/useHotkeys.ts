import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

export function useHotkeys(key: string, callback: KeyHandler): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Early return if key is not a valid string
      if (!key || typeof key !== 'string') {
        return;
      }
      
      // Parse the key combination
      const keys = key.toLowerCase().split('+');
      const mainKey = keys[keys.length - 1];
      
      // Check if modifiers match
      const ctrlRequired = keys.includes('ctrl');
      const shiftRequired = keys.includes('shift');
      const altRequired = keys.includes('alt');
      const metaRequired = keys.includes('meta') || keys.includes('cmd');
      
      const ctrlMatches = ctrlRequired === event.ctrlKey;
      const shiftMatches = shiftRequired === event.shiftKey;
      const altMatches = altRequired === event.altKey;
      const metaMatches = metaRequired === event.metaKey;
      
      // Check if the main key matches
      const keyMatches = event.key.toLowerCase() === mainKey;
      
      // If all conditions match, call the callback
      if (ctrlMatches && shiftMatches && altMatches && metaMatches && keyMatches) {
        event.preventDefault();
        callback(event);
      }
    };
    
    window.addEventListener('keydown', handler);
    
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [key, callback]);
}