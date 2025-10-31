import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from "expo-linear-gradient";
import { LlamaContext, RNLlamaOAICompatibleMessage } from 'llama.rn';
import React, { useCallback, useState } from "react";
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
import { Box } from "../../components/ui/box"; // Assuming this path
import { PERSONA_PROMPTS } from '../constants/PersonaPrompts'; // The 4 persona list
import { runTranslation } from '../utils/LlamaCore'; // The translation utility

interface VibeSwitchScreenProps {
  llamaContext: LlamaContext | null;
}

// Map the 4 persona keys to a list for the selector
const PERSONA_KEYS = Object.keys(PERSONA_PROMPTS);

// 💡 NEW: Define the COLORS object needed for inline styles and reference
const COLORS = { 
  primary: "#FF7A18", // Warm accent (for copy button, selected border)
  white: "#FFFFFF",
  dark: "#2b2b2b",
  buttonEnabled: "#FF7A18",
  buttonDisabled: "#FFBFA0",
};

const VibeSwitchScreen = ({ llamaContext }: VibeSwitchScreenProps) => {
  const [inputText, setInputText] = useState("");
  const [selectedPersonaKey, setSelectedPersonaKey] = useState(PERSONA_KEYS[1]); // Default to Gen Z
  const [resultText, setResultText] = useState("");
  const [loading, setLoading] = useState(false);

  // Get the currently selected persona's data
  const selectedPersona = PERSONA_PROMPTS[selectedPersonaKey];
  const isLlamaReady = !!llamaContext;

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim() || !isLlamaReady || loading) {
      setResultText("Please enter text and ensure the model is ready.");
      return;
    }
    setLoading(true);
    setResultText(""); // Clear previous result
    
    // The RNLlamaOAICompatibleMessage[] structure requires the System Prompt to be 
    // formatted separately for the LLM to understand its role.
    const messages: RNLlamaOAICompatibleMessage[] = [
      { role: 'system', content: selectedPersona.prompt },
      { role: 'user', content: `Translate the following: ${inputText}` }
    ];

    try {
      // 💡 Execute the core translation logic from the utility file
      const res = await runTranslation(llamaContext!, selectedPersona.prompt, inputText);
      setResultText(res);

    } catch (err) {
      console.error("LLM Translation Error:", err);
      setResultText("An error occurred during VibeSwitch translation. Try again.");
    } finally {
      setLoading(false);
    }
  }, [inputText, isLlamaReady, loading, llamaContext, selectedPersona]);
  
  const copyToClipboard = useCallback(() => {
    if (resultText) {
      Clipboard.setString(resultText);
    }
  }, [resultText]);

  // We are removing the numerical slider and replacing it with the Persona Selector
  // as the numerical value doesn't map cleanly to an instruction-tuned LLM.
  // The original slider UI slot will now house the persona buttons.

  return (
    // Note: Removed GluestackUIProvider from here, it is now in App.tsx
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
          
          {/* Header */}
          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-[#2b2b2b]">⇆ VibeSwitch ⇆</Text>
            <Text className="text-sm text-[#4a4a4a] mt-1 text-center">
              Closing the generation gap, one cringe text at a time.
            </Text>
          </View>

          {/* Text Input card */}
          <Box style={[styles.card, styles.cardSpacing]} className="mb-2">
            <Text className="text-sm text-[#333333] mb-2">Enter text</Text>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a sentence or paste text here..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              multiline
              numberOfLines={4}
              className="text-[#111827] text-base"
              style={styles.input}
            />
          </Box>
          
          {/* Persona Selector (Replaces Slider) */}
          <Box style={[styles.card, styles.cardSpacing]} className="mb-2">
            <Text className="text-sm text-[#333333] mb-2">Select Target Vibe: {selectedPersona.name}</Text>
            <View style={styles.selectorContainer}>
              {PERSONA_KEYS.map((key) => {
                const persona = PERSONA_PROMPTS[key];
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setSelectedPersonaKey(key)}
                    disabled={loading}
                    style={[
                      styles.personaButton,
                      selectedPersonaKey === key && styles.personaButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.personaButtonText,
                      selectedPersonaKey === key && { color: styles.buttonEnabled.backgroundColor }
                    ]}>
                      {persona.name.split('(')[0].trim()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Box>


          {/* Button card */}
          <Box className="mb-2">
            <TouchableOpacity
              onPress={handleTranslate}
              activeOpacity={0.85}
              style={[
                styles.actionButton,
                !isLlamaReady || loading ? styles.buttonDisabled : styles.buttonEnabled,
              ]}
              disabled={!isLlamaReady || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionText}>Switch the Vibe</Text>
              )}
            </TouchableOpacity>
          </Box>

          {/* Result card */}
          <Box style={[styles.card, styles.cardSpacing]}>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-[#333333]">Output Vibe</Text>
              <TouchableOpacity onPress={copyToClipboard} disabled={!resultText}>
                 <Text style={{ color: resultText ? COLORS.primary : COLORS.buttonDisabled }}>{resultText ? 'Copy' : ''}</Text>
              </TouchableOpacity>
            </View>
            <View>
              <Text className="text-[#111827]">{resultText || "No result yet."}</Text>
            </View>
          </Box>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ... (Styles remain the same)
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
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  input: {
    minHeight: 80, // Increased height for better multi-line text input
    maxHeight: 120,
    textAlignVertical: "top",
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  actionButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  buttonEnabled: {
    backgroundColor: "#FF7A18",
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
  // New styles for the Persona Selector
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personaButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#F0F0F0", // Light gray background
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  personaButtonSelected: {
    borderColor: "#FF7A18", // Primary color border when selected
    backgroundColor: "#FFECD9", // Very light tint when selected
  },
  personaButtonText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  header: {
    fontFamily: "LogoFont"
  }
});

// Re-export the screen as default for the router (if you choose to use it later)
export default VibeSwitchScreen;
