import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface OCRResult {
  text: string;
  blocks: TextBlock[];
}

export interface TextBlock {
  text: string;
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lines: TextLine[];
}

export interface TextLine {
  text: string;
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  elements: TextElement[];
}

export interface TextElement {
  text: string;
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

class OCRService {
  /**
   * Extract text from an image using ML Kit Text Recognition
   * @param imageUri - Local URI of the image to process
   * @returns Promise<OCRResult> - Extracted text and detailed structure
   */
  async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    try {
      console.log('🔍 Starting OCR text extraction for:', imageUri);
      
      // Use ML Kit Text Recognition to extract text
      const result = await TextRecognition.recognize(imageUri);
      
      console.log('✅ OCR extraction completed successfully');
      console.log('📝 Extracted text length:', result.text.length);
      console.log('📊 Number of blocks:', result.blocks.length);
      
      return {
        text: result.text,
        blocks: result.blocks.map(block => ({
          text: block.text,
          frame: block.frame,
          lines: block.lines.map(line => ({
            text: line.text,
            frame: line.frame,
            elements: line.elements.map(element => ({
              text: element.text,
              frame: element.frame,
            })),
          })),
        })),
      };
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  /**
   * Clean and format extracted text
   * @param rawText - Raw text from OCR
   * @returns Cleaned and formatted text
   */
  cleanExtractedText(rawText: string): string {
    return rawText
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
      // Fix common OCR errors
      .replace(/\|/g, 'I') // Common OCR mistake
      .replace(/0/g, 'O') // In some contexts
      // Add proper line breaks for better readability
      .replace(/\. ([A-Z])/g, '.\n\n$1')
      // Clean up multiple line breaks
      .replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Get confidence score for OCR result (simulated for ML Kit)
   * @param result - OCR result
   * @returns Confidence score between 0 and 1
   */
  getConfidenceScore(result: OCRResult): number {
    // ML Kit doesn't provide confidence scores directly
    // We'll estimate based on text characteristics
    const textLength = result.text.length;
    const blockCount = result.blocks.length;
    
    if (textLength === 0) return 0;
    if (textLength < 10) return 0.3;
    if (textLength < 50) return 0.6;
    if (blockCount > 0 && textLength > 50) return 0.8;
    
    return 0.9;
  }

  /**
   * Validate if the image likely contains text
   * @param imageUri - Image URI to validate
   * @returns Promise<boolean> - Whether image likely contains text
   */
  async validateImageForText(imageUri: string): Promise<boolean> {
    try {
      const result = await this.extractTextFromImage(imageUri);
      return result.text.trim().length > 0;
    } catch (error) {
      console.error('❌ Image validation failed:', error);
      return false;
    }
  }

  /**
   * Extract text with retry mechanism
   * @param imageUri - Image URI
   * @param maxRetries - Maximum number of retries
   * @returns Promise<OCRResult>
   */
  async extractTextWithRetry(imageUri: string, maxRetries: number = 3): Promise<OCRResult> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 OCR attempt ${attempt}/${maxRetries}`);
        const result = await this.extractTextFromImage(imageUri);
        
        if (result.text.trim().length > 0) {
          console.log('✅ OCR successful on attempt', attempt);
          return result;
        }
        
        throw new Error('No text detected in image');
      } catch (error) {
        lastError = error;
        console.log(`❌ OCR attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }
}

export const ocrService = new OCRService();
