// OCR service using OCR.space API
// - Works with local file URIs (read as base64) and remote URLs.
// - Set your API key in app.json -> expo.extra.OCR_SPACE_API_KEY (optional). Falls back to demo key 'helloworld'.

import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

type OcrSpaceResponse = {
  ParsedResults?: Array<{
    ParsedText?: string;
    ErrorMessage?: string;
  }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
};

export async function extractTextFromImage(imageUri: string): Promise<string> {
  const apiKey = (Constants.expoConfig?.extra as any)?.OCR_SPACE_API_KEY || 'helloworld';
  const endpoint = 'https://api.ocr.space/parse/image';

  // Helper to call OCR.space and parse text
  const callOcr = async (fd: FormData) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {}, // Let fetch set multipart boundary
      body: fd as any,
    });
    if (!res.ok) {
      console.warn('OCR request failed with status', res.status);
      return '';
    }
    const data = (await res.json()) as OcrSpaceResponse;
    if (data.IsErroredOnProcessing) {
      console.warn('OCR processing error:', data.ErrorMessage);
      return '';
    }
    const text = (data.ParsedResults || [])
      .map(r => r.ParsedText?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
      .trim();
    if (!text) {
      console.warn('OCR returned no text for this image.');
    }
    return text || '';
  };

  try {
    const common = () => {
      const fd = new FormData();
      fd.append('apikey', apiKey);
      fd.append('language', 'eng');
      fd.append('isOverlayRequired', 'false');
      fd.append('OCREngine', '2');
      fd.append('scale', 'true');
      return fd;
    };

    // Remote URL path
    if (/^https?:\/\//i.test(imageUri)) {
      const fd = common();
      fd.append('url', imageUri);
      return await callOcr(fd);
    }

    // Local file path: try multipart file upload first
    const fileMime = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    try {
      const fdFile = common();
      // @ts-ignore: React Native FormData file
      fdFile.append('file', { uri: imageUri, name: 'image.jpg', type: fileMime });
      const fileResult = await callOcr(fdFile);
      if (fileResult) return fileResult;
    } catch (e) {
      console.warn('OCR file upload failed, will fallback to base64:', e);
    }

    // Fallback: compress and send as base64 data URI
    let sourceUri = imageUri;
    try {
      // Dynamically import image manipulator to avoid dependency issues if not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ImageManipulator = await import('expo-image-manipulator').catch(() => null as any);
      if (ImageManipulator && ImageManipulator.manipulateAsync) {
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        sourceUri = manipulated.uri || imageUri;
      }
    } catch (e) {
      console.warn('Image compression skipped due to error:', e);
    }

    const base64 = await FileSystem.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
    const fdB64 = common();
    fdB64.append('base64Image', `data:${fileMime};base64,${base64}`);
    return await callOcr(fdB64);
  } catch (e) {
    console.warn('extractTextFromImage error:', e);
    return '';
  }
}
