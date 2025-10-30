import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "./global.css";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Box } from "./components/ui/box";
import { useLoadedAssets } from "./hooks/useLoadedAssets";

/*
  SPA layout with gradient background (beige -> peach -> warm orange)
  - Logo + app name at top (no card)
  - Input, Slider, Button, Result each placed on elevated cards
*/

const mockService = async (text: string, level: number) => {
  await new Promise((r) => setTimeout(r, 900));
  return `Result: "${text.trim().slice(0, 300)}"${
    text.length > 300 ? "…" : ""
  } (level ${Math.round(level)})`;
};

export default function App() {
  const [inputText, setInputText] = useState("");
  const [sliderValue, setSliderValue] = useState(50);
  const [resultText, setResultText] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoadingComplete = useLoadedAssets();

  if (!isLoadingComplete) {
    // If assets are not yet loaded, return null (the splash screen is still visible)
    return null; 
  }

  const handleProcess = async () => {
    if (!inputText.trim()) {
      setResultText("Please enter some text to process.");
      return;
    }
    setLoading(true);
    try {
      const res = await mockService(inputText, sliderValue);
      setResultText(res);
    } catch (err) {
      console.error(err);
      setResultText("An error occurred while processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GluestackUIProvider mode="dark">
      {/* Gradient background */}
      <LinearGradient
        colors={["#F5F0E6", "#FFDCC2", "#FFB08A", "#FF7A18"]}
        start={[0, 0.25]}
        end={[1, 1]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.container}
        >
          <View className="flex-1 pt-16 px-6">
            {/* Header: logo + name (no card) */}
            <View className="items-center mb-6">
              <Text className="text-2xl font-bold text-[#2b2b2b]" style={{ fontFamily: "LogoFont" }}>⇆ VibeSwitch ⇆</Text>
              <Text className="text-sm text-[#4a4a4a] mt-1 text-center">
                Closing the generation gap, one cringe text at a time.
              </Text>
            </View>

            {/* Input card */}
            <Box style={[styles.card, styles.cardSpacing]} className="mb-2">
              <Text className="text-sm text-[#333333] mb-2">Enter text</Text>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a sentence or paste text here..."
                placeholderTextColor="rgba(0,0,0,0.35)"
                multiline
                numberOfLines={6}
                className="text-[#111827] text-base"
                style={styles.input}
              />
            </Box>

            {/* Slider card */}
            <Box style={[styles.card, styles.cardSpacing]} className="mb-2">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-[#333333]">Age Level</Text>
                <Text className="text-sm text-[#333333]">{Math.round(sliderValue)}</Text>
              </View>
              <View>
                <Slider
                  minimumValue={0}
                  maximumValue={100}
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  minimumTrackTintColor="#4B5563"
                  maximumTrackTintColor="#D1D5DB"
                  thumbTintColor="#374151"
                />
              </View>
            </Box>

            {/* Button card (stylized) */}
            <Box className="mb-2">
              <TouchableOpacity
                onPress={handleProcess}
                activeOpacity={0.85}
                style={[
                  styles.actionButton,
                  loading ? styles.buttonDisabled : styles.buttonEnabled,
                ]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionText}>Switch the Vibe</Text>
                )}
              </TouchableOpacity>
            </Box>

            {/* Result card */}
            <Box style={[styles.card, styles.cardSpacing]} className="mb-2">
              <Text className="text-sm text-[#333333] mb-2">Output</Text>
              <View>
                <Text className="text-[#111827]">
                  {resultText || "No result yet."}
                </Text>
              </View>
            </Box>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </GluestackUIProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 12,
    // Android elevation
    elevation: 6,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  input: {
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: "top",
  },

  // Action button styles
  actionButton: {
    height: 52,
    borderRadius: 12, // pill
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    // Elevated look for the button itself
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  buttonEnabled: {
    backgroundColor: "#FF7A18", // warm accent (peach/orange)
  },
  buttonDisabled: {
    backgroundColor: "#FFBFA0",
    opacity: 0.85,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.4,
  },
  header: {
    fontFamily: "LogoFont"
  }
});