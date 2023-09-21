import { useEffect, useState } from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

// export function useDebounce(fn: Function, delay: number) {
//    let timer: any = null;
//    return (...args: any) => {
//       clearTimeout(timer);
//       timer = setTimeout(() => {
//          fn(...args);
//       }, delay);
//    };
// }

export function useDebounce<T>(value: T, delay?: number): T {
   const [debouncedValue, setDebouncedValue] = useState<T>(value);

   useEffect(() => {
      const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

      return () => {
         clearTimeout(timer);
      };
   }, [value, delay]);

   return debouncedValue;
}
