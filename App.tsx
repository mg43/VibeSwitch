import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLlama } from "./src/hooks"; // Your LLM initialization hook
import { useLoadedAssets } from "./src/hooks/useLoadedAssets"; // Your existing asset loader
import VibeSwitchScreen from "./src/screens/VibeSwitchScreen"; // New main screen component

// Clean up problematic CSS imports by removing them from App.tsx
// You must ensure one global.css is imported somewhere appropriate, 
// likely in your index.js entry point or root layout if you're using Tailwind/NativeWind.

// Define colors used in the loading state
const COLORS = { primary: "#FF7A18", white: "#FFFFFF", dark: "#2b2b2b" };

export default function App() {
  const { isReady, context, error, downloadProgress } = useLlama();
  const areAssetsLoaded = useLoadedAssets();

  const appIsFullyReady = isReady && areAssetsLoaded;

  // --- Loading/Splash Screen ---
  if (!appIsFullyReady) {
    // Note: The GluestackUIProvider is omitted here for the pure splash screen to ensure speed
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.statusText}>
          {error
            ? "CRITICAL ERROR: Failed to load model."
            : (downloadProgress > 0 && downloadProgress < 100)
            ? `Downloading Model: ${downloadProgress}%`
            : "Loading VibeSwitch assets..."
          }
        </Text>
        {error && <Text style={styles.errorText}>Check your network and model URL.</Text>}
      </View>
    );
  }

  // --- Main App Ready ---
  return (
    <GluestackUIProvider mode="dark">
      {/* Pass the active Llama context and the runTranslation utility function */}
      <VibeSwitchScreen llamaContext={context} />
    </GluestackUIProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F0E6", // Match your gradient start color
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.dark,
    textAlign: "center",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: 'red',
    textAlign: "center",
  },
});
