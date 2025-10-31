import * as FS from 'expo-file-system/legacy'; // SDK 54 legacy file system

// Note: Assumes 'llama.rn' is available in a custom development build environment
import { initLlama, LlamaContext, RNLlamaOAICompatibleMessage } from 'llama.rn';

// 💡 PHI-3 MINI INSTRUCT MODEL CONFIGURATION
const DOWNLOAD_URL = 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf'; 
const MODEL_FILENAME = 'Phi-3-mini-4k-instruct-q4.gguf';

// ✨ SDK 54 UPDATE: Use Paths.document for the application's document directory
export const MODEL_PATH = `${FS.documentDirectory}${MODEL_FILENAME}`; 


/**
 * Downloads the model if needed, then initializes the LlamaContext.
 * @param onProgressUpdate Callback function to receive download progress (0-100).
 * @returns The active LlamaContext instance.
 */
export async function setupLlamaContext(
    onProgressUpdate: (progress: number) => void
): Promise<LlamaContext> {
    
    // 1. Check if model exists locally using the modern FS.getInfoAsync
    const fileInfo = await FS.getInfoAsync(MODEL_PATH);
    
    if (!fileInfo.exists) {
        console.log('Model not found locally. Starting download...');
        
        // 2. Download the Model using FS.createDownloadResumable
        const downloadTask = FS.createDownloadResumable(
            DOWNLOAD_URL,
            MODEL_PATH,
            {}, // No options needed here, but can include headers if necessary
            (downloadProgress) => {
                const progress = 
                    downloadProgress.totalBytesExpectedToWrite > 0
                    ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
                    : 0;
                onProgressUpdate(Math.floor(progress * 100));
            }// Cast is needed to match internal Expo types for callback
        );
        
        try {
            const { status } = await downloadTask.downloadAsync();
            
            if (status !== 200) {
                // 3. Clean up failed download using FS.deleteAsync
                await FS.deleteAsync(MODEL_PATH, { idempotent: true }); 
                throw new Error(`Download failed with HTTP status: ${status}`);
            }
            onProgressUpdate(100);
            
        } catch (error) {
            // Ensure any partially downloaded file is deleted on error
            await FS.deleteAsync(MODEL_PATH, { idempotent: true });
            throw new Error(`Model download failed: ${error}`);
        }
        
    } else {
        onProgressUpdate(100);
    }

    // 4. Initialize Llama Context
    // Note: llama.rn expects 'file://' prefix for external paths, which Paths.document provides.
    const modelUri = MODEL_PATH; 
    
    const context = await initLlama({
        model_path: modelUri,
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
        
    const finalPrompt = 
        `<|system|>${personaPrompt}<|end|>` + 
        `<|user|>Translate the following: "${userText}"<|end|>` + 
        `<|assistant|>`;

    const messages: RNLlamaOAICompatibleMessage[] = [
        { role: 'system', content: personaPrompt },
        { role: 'user', content: `Translate the following: ${userText}` }
    ];

    const params = {
        // Use the messages array for chat models like Phi-3
        messages: messages,
        
        n_predict: 2048,
        ignore_eos: false,
        stop: ['<|end|>'], // Phi-3 uses <|end|> as a stop token
        temperature: 0.8,
    };

    const res = await context.completion(
        params as any, // Cast to any to fit the generic context completion type
        // onPartialCompletion, // Omitted for simplicity
    );
    
    // Clean up the response from any leftover prompt tags
    return res?.text.trim()
        .replace('<|assistant|>', '')
        .trim() ?? 'No results';
}

/**
 * Cleans up the Llama Context.
 */
export async function cleanupLlama(context: LlamaContext | null): Promise<void> {
    try {
        await context?.release();
    } catch (e) {
        console.warn("Cleanup failed:", e);
    }
}
