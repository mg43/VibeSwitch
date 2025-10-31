// src/hooks/useLoadedAssets.ts

import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function useLoadedAssets() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Load fonts here
        await Font.loadAsync({
          'LogoFont': require('../../assets/fonts/LogoFont.ttf'),
        });
      } catch (e) {
        // Log the error for development, but don't stop the app from running
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        // Hide the splash screen once loading is complete
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
}