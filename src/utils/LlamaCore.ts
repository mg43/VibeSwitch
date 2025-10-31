import { File, Paths } from 'expo-file-system'; // Use the standard, stable Expo FileSystem import
import * as FS from 'expo-file-system/legacy'; // Import the stable Expo FileSystem module
import { initLlama, LlamaContext, RNLlamaOAICompatibleMessage } from 'llama.rn';

// 💡 PHI-3 MINI INSTRUCT MODEL CONFIGURATION
const DOWNLOAD_URL = 'https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_L.gguf'; 
const MODEL_FILENAME = 'SmolLM2-135M-Instruct-Q4_K_L.gguf'; // Updated filename

// We are no longer exporting or initializing MODEL_PATH globally.
// It will be initialized safely inside the function.
let modelPath: string | null = null; 


/**
 * Downloads the model if needed, then initializes the LlamaContext.
 * Uses the stable static FS methods.
 * @param onProgressUpdate Callback function to receive download progress (0-100).
 * @returns The active LlamaContext instance.
 */
export async function setupLlamaContext(
    onProgressUpdate: (progress: number) => void
): Promise<LlamaContext> {

    // 1. Define the model path within the document directory
    modelPath = `${Paths.document.uri}${MODEL_FILENAME}`;

    const file = new File(Paths.document, MODEL_FILENAME);


    
    if (!file.exists) {
        console.log('Model not found locally. Starting download...');
        
        try {
            await File.downloadFileAsync(DOWNLOAD_URL, Paths.document)

            if (file.exists) {
                console.log('Download completed successfully.');
                onProgressUpdate(100);
            } else {
                // 3. Clean up failed download using the static FS.deleteAsync
                await FS.deleteAsync(modelPath, { idempotent: true }); 
                throw new Error(`Download failed with HTTP status:`);
            }
            
            
        } catch (error: any) {
            // Ensure any partially downloaded file is deleted on error
            await FS.deleteAsync(modelPath, { idempotent: true });
            const errorMessage = error.message ? error.message : String(error);
            console.error("Model download failed:", errorMessage);
            throw new Error(`Model download failed: ${errorMessage}`);
        }

        console.log('Model downloaded successfully.');
        
    } else {
        // Model already exists
        console.log('Model found locally, skipping download.');
        onProgressUpdate(100);
    }

    // 4. Initialize Llama Context
    const modelUri = file.uri;

    console.log("Initializing Llama with model at:", modelUri);
    
    // Note: The Llama model initialization is specific to llama.rn.
    const context = await initLlama({
        model: modelUri,
        use_mlock: true, // Keep model in RAM (optional but helps performance)
        n_ctx: 4096,     // Context window size for Phi-3 4K
        n_gpu_layers: 99, // Offload to GPU/Metal if available
    });
    
    return context;
}

/**
 * Executes a translation completion request using Phi-3's chat template.
 */
export async function runTranslation(
    context: LlamaContext, 
    personaPrompt: string, 
    userText: string
): Promise<string> {
        
    // Phi-3 uses the ChatML format, which the `messages` array handles automatically.
    const messages: RNLlamaOAICompatibleMessage[] = [
        { role: 'system', content: personaPrompt },
        { role: 'user', content: `Translate the following: ${userText}` }
    ];

    const params = {
        messages: messages,
        n_predict: 2048,
        ignore_eos: false,
        stop: ['<|end|>'], // Phi-3 uses <|end|> as a stop token
        temperature: 0.8,
    };

    const res = await context.completion(
        params as any, // Cast to any to fit the generic context completion type
    );
    
    // Clean up the response from any leftover prompt tags
    return res?.text.trim()
        .replace('<|assistant|>', '')
        .trim() ?? 'No results';
}


//Cleans up the Llama Context.
export async function cleanupLlama(context: LlamaContext | null): Promise<void> {
    try {
        await context?.release();
    } catch (e) {
        console.warn("Cleanup failed:", e);
    }
}
