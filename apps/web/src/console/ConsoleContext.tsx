import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ConsoleController } from './ConsoleController';

// Conecta los bloques de código de una lección con la consola de la misma página:
// el botón «Ejecutar» escribe el SQL en la consola y la lleva a la vista.

interface ConsoleContextValue {
  register: (controller: ConsoleController) => () => void;
  run: ((sql: string) => void) | null;
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const controller = useRef<ConsoleController | null>(null);
  const [available, setAvailable] = useState(false);

  const register = useCallback((instance: ConsoleController) => {
    controller.current = instance;
    setAvailable(true);
    return () => {
      if (controller.current === instance) {
        controller.current = null;
        setAvailable(false);
      }
    };
  }, []);

  const run = useCallback((sql: string) => {
    document.querySelector('[data-console]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    controller.current?.run(sql);
  }, []);

  const value = useMemo(() => ({ register, run: available ? run : null }), [register, run, available]);
  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export function useRegisterConsole() {
  return useContext(ConsoleContext)?.register ?? null;
}

export function useConsoleRunner() {
  return useContext(ConsoleContext)?.run ?? null;
}
