import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useBeautiful3D } from '../context/Beautiful3DContext';
import { ocrService, OCRResult } from '../services/ocrService';

interface OCRTextExtractorProps {
  visible: boolean;
  onClose: () => void;
  onTextExtracted: (text: string) => void;
}

const { width, height } = Dimensions.get('window');

export const OCRTextExtractor: React.FC<OCRTextExtractorProps> = ({
  visible,
  onClose,
  onTextExtracted,
}) => {
  const { theme } = useTheme();
  const { showErrorAlert, showSuccessAlert, setLoading, showSuccessToast } = useBeautiful3D();
  const isDarkMode = theme === 'dark';

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editableText, setEditableText] = useState<string>('');

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      slideAnim.setValue(height);
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setSelectedImage(null);
    setExtractedText('');
    setEditableText('');
    setOcrResult(null);
    setIsProcessing(false);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showErrorAlert(
        'Permission Required',
        'Please grant camera roll permissions to upload images for text extraction.'
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        extractTextFromImage(result.assets[0].uri);
      }
    } catch (error) {
      showErrorAlert('Error', 'Failed to pick image from gallery.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showErrorAlert(
        'Permission Required',
        'Please grant camera permissions to take photos for text extraction.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        extractTextFromImage(result.assets[0].uri);
      }
    } catch (error) {
      showErrorAlert('Error', 'Failed to take photo.');
    }
  };

  const extractTextFromImage = async (imageUri: string) => {
    setIsProcessing(true);
    setLoading(true, { text: 'Extracting text from image...', size: 'medium' });

    try {
      console.log('🔍 Starting OCR text extraction...');
      const result = await ocrService.extractTextWithRetry(imageUri, 2);
      
      if (result.text.trim().length === 0) {
        showErrorAlert(
          'No Text Found',
          'No text was detected in this image. Please try with an image that contains clear, readable text.'
        );
        return;
      }

      const cleanedText = ocrService.cleanExtractedText(result.text);
      const confidence = ocrService.getConfidenceScore(result);
      
      setOcrResult(result);
      setExtractedText(cleanedText);
      setEditableText(cleanedText);

      console.log('✅ OCR extraction successful');
      console.log('📝 Extracted text:', cleanedText.substring(0, 100) + '...');
      console.log('🎯 Confidence score:', confidence);

      showSuccessToast(
        `Text extracted successfully! Confidence: ${Math.round(confidence * 100)}%`
      );
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      showErrorAlert(
        'Extraction Failed',
        'Failed to extract text from the image. Please try with a clearer image or check your internet connection.'
      );
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleUseText = () => {
    if (editableText.trim()) {
      onTextExtracted(editableText.trim());
      showSuccessToast('Text added to your note!');
      onClose();
    } else {
      showErrorAlert('No Text', 'Please extract some text first or edit the extracted text.');
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="scan"
                size={24}
                color={isDarkMode ? '#4FC3F7' : '#1976D2'}
              />
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDarkMode ? '#ffffff' : '#333333' },
                ]}
              >
                Text Extractor
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={isDarkMode ? '#ffffff' : '#666666'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Image Selection */}
            {!selectedImage && (
              <View style={styles.imageSelectionContainer}>
                <Text
                  style={[
                    styles.instructionText,
                    { color: isDarkMode ? '#cccccc' : '#666666' },
                  ]}
                >
                  Upload an image containing text to extract and convert it to editable text
                </Text>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: isDarkMode ? '#4FC3F7' : '#1976D2',
                      },
                    ]}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera" size={24} color="#ffffff" />
                    <Text style={styles.buttonText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: isDarkMode ? '#66BB6A' : '#4CAF50',
                      },
                    ]}
                    onPress={pickImageFromGallery}
                  >
                    <Ionicons name="images" size={24} color="#ffffff" />
                    <Text style={styles.buttonText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Selected Image */}
            {selectedImage && (
              <View style={styles.imageContainer}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? '#ffffff' : '#333333' },
                  ]}
                >
                  Selected Image
                </Text>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    {
                      backgroundColor: isDarkMode ? '#FF7043' : '#FF5722',
                    },
                  ]}
                  onPress={() => {
                    setSelectedImage(null);
                    setExtractedText('');
                    setEditableText('');
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Choose Different Image</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Extracted Text */}
            {extractedText && (
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? '#ffffff' : '#333333' },
                  ]}
                >
                  Extracted Text
                </Text>
                
                <View
                  style={[
                    styles.textInputContainer,
                    {
                      backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                      borderColor: isDarkMode ? '#444444' : '#dddddd',
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.textInput,
                      { color: isDarkMode ? '#ffffff' : '#333333' },
                    ]}
                    value={editableText}
                    onChangeText={setEditableText}
                    multiline
                    placeholder="Extracted text will appear here. You can edit it before adding to your note."
                    placeholderTextColor={isDarkMode ? '#888888' : '#999999'}
                  />
                </View>

                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: isDarkMode ? '#4CAF50' : '#2E7D32',
                        flex: 1,
                      },
                    ]}
                    onPress={handleUseText}
                  >
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>Use This Text</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* OCR Info */}
            {ocrResult && (
              <View style={styles.infoContainer}>
                <Text
                  style={[
                    styles.infoTitle,
                    { color: isDarkMode ? '#4FC3F7' : '#1976D2' },
                  ]}
                >
                  Extraction Details
                </Text>
                <Text
                  style={[
                    styles.infoText,
                    { color: isDarkMode ? '#cccccc' : '#666666' },
                  ]}
                >
                  • Characters extracted: {extractedText.length}
                </Text>
                <Text
                  style={[
                    styles.infoText,
                    { color: isDarkMode ? '#cccccc' : '#666666' },
                  ]}
                >
                  • Text blocks found: {ocrResult.blocks.length}
                </Text>
                <Text
                  style={[
                    styles.infoText,
                    { color: isDarkMode ? '#cccccc' : '#666666' },
                  ]}
                >
                  • Confidence: {Math.round(ocrService.getConfidenceScore(ocrResult) * 100)}%
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.95,
    maxHeight: height * 0.9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageSelectionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    gap: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  textContainer: {
    marginBottom: 20,
  },
  textInputContainer: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
});
