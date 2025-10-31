// src/hooks/use-llama.ts

import * as SplashScreen from 'expo-splash-screen';
import { LlamaContext } from 'llama.rn';
import { useEffect, useState } from 'react';
import { cleanupLlama, setupLlamaContext } from '../utils/LlamaCore';


SplashScreen.preventAutoHideAsync();

interface LlamaState {
  isReady: boolean;
  context: LlamaContext | null;
  error: string | null;
  downloadProgress: number; // 0 to 100
}

export function useLlama() {
  const [state, setState] = useState<LlamaState>({
    isReady: false,
    context: null,
    error: null,
    downloadProgress: 0,
  });

  useEffect(() => {
    let activeContext: LlamaContext | null = null;
    
    const initialize = async () => {
      try {
        // 1. Call the Core Utility, passing the state updater
        activeContext = await setupLlamaContext((progress) => {
          setState(s => ({ ...s, downloadProgress: progress }));
        });

        // 2. Set the final ready state
        setState(s => ({ 
            ...s, 
            isReady: true, 
            context: activeContext 
        }));

      } catch (e: any) {
        console.error("LLaMA Initialization Failed:", e);
        setState(s => ({ ...s, error: `Init error: ${e.message}` }));
      } finally {
        SplashScreen.hideAsync();
      }
    };

    initialize();

    return () => {
      // 3. Cleanup: Release the LlamaContext when the app closes or unmounts
      cleanupLlama(activeContext);
    };
  }, []);

  return state;
}