import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions, RefreshControl, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Image, Alert, PermissionsAndroid, Linking, PanResponder } from 'react-native';
import Animated, { FadeIn, SlideInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import { getAllTasksByUserId, createTask, deleteTask, updateTask } from '../../services/taskService';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useBeautiful3D } from '../../context/Beautiful3DContext';
import { generateAIContent, generateMockContent } from '../../services/aiService';
import { extractTextFromImage } from '../../services/ocrService';
import { VoiceService } from '../../services/voiceService';
import { Beautiful3DLoader } from '../../components/Beautiful3DLoader';
let LocalAuthentication: any = null;
try { LocalAuthentication = require('expo-local-authentication'); } catch (_) { LocalAuthentication = null; }
let IntentLauncher: any = null;
try { IntentLauncher = require('expo-intent-launcher'); } catch (_) { IntentLauncher = null; }

const { width, height } = Dimensions.get('window');

const IMGBB_API_KEY = '0e1db39eeceeb3305730e6efa431f38b';

// Voice recognition handled centrally via VoiceService

const HomeScreen = () => {
    const authCtx = useAuth();
    const user = authCtx?.user;
    const { theme } = useTheme();
    const { settings } = useSettings();
    const { showAlert, showToast } = useBeautiful3D();
    const isDarkMode = theme === 'dark';
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Animated bubbles
    const bubble1Scale = useSharedValue(1);
    const bubble2Scale = useSharedValue(1);
    useEffect(() => {
        bubble1Scale.value = withRepeat(withTiming(1.12, { duration: 2200 }), -1, true);
        bubble2Scale.value = withRepeat(withTiming(1.08, { duration: 1800 }), -1, true);
    }, []);
    const bubble1Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble1Scale.value }] }));
    const bubble2Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble2Scale.value }] }));

    // --- Mind Relaxing Tips Robot (floating at top-right with thought bubble) ---
    const robotFloat = useSharedValue(0);
    const robotAmp = useSharedValue(1); // amplitude gate: 1=floating, 0=still
    const robotBlink = useSharedValue(1);
    const [tipIndex, setTipIndex] = useState(0);
    const [showRobot, setShowRobot] = useState(true);
    const [showThinking, setShowThinking] = useState(true);
    const [dotStep, setDotStep] = useState(0);
    const tips = [
        'Close your eyes. Inhale 4, hold 2, exhale 6. Repeat 5 times.',
        'Unclench your jaw and drop your shoulders. Notice the release.',
        'Name 3 things you can see, 2 you can hear, 1 you can feel.',
        'Take a 30‑second pause: breathe slowly and scan your body.',
        'Sip some water. Tiny rituals gently reset your mind.',
    ];
    useEffect(() => {
        robotFloat.value = withRepeat(withTiming(-6, { duration: 1600 }), -1, true);
        robotBlink.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true);
        const tipTimer = setInterval(() => {
            setShowThinking(true);
            // show dots for ~1.6s then reveal tip and advance next time
            setTimeout(() => {
                setShowThinking(false);
                setTipIndex((i) => (i + 1) % tips.length);
            }, 1600);
        }, 6000);
        const dotsTimer = setInterval(() => setDotStep((d) => (d + 1) % 3), 300);
        return () => { clearInterval(tipTimer); clearInterval(dotsTimer); };
    }, []);
    const robotFloatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: robotAmp.value * robotFloat.value }] }));
    const robotBlinkStyle = useAnimatedStyle(() => ({ opacity: robotBlink.value }));

    // Animate tip text entrance without moving robot
    const tipOpacity = useSharedValue(0);
    const tipTranslateY = useSharedValue(6);
    useEffect(() => {
        // When thinking starts, freeze robot and prepare text animation
        if (showThinking) {
            robotAmp.value = withTiming(0, { duration: 150 });
            tipOpacity.value = 0;
            tipTranslateY.value = 6;
        } else {
            // When revealing tip, animate text in and resume float
            tipOpacity.value = withTiming(1, { duration: 220 });
            tipTranslateY.value = withTiming(0, { duration: 220 });
            robotAmp.value = withTiming(1, { duration: 200 });
        }
    }, [showThinking]);
    const tipAnimStyle = useAnimatedStyle(() => ({ opacity: tipOpacity.value, transform: [{ translateY: tipTranslateY.value }] }));

    // Move only the thought bubble while thinking (robot stays in place)
    const bubbleOffsetX = useSharedValue(0);
    const bubbleOffsetY = useSharedValue(0);
    useEffect(() => {
        if (showThinking) {
            // Slide the bubble closer to the robot (from a bit farther away)
            bubbleOffsetX.value = 24; // start a little away
            bubbleOffsetY.value = 0;
            bubbleOffsetX.value = withTiming(4, { duration: 260 });
            // Gentle bobbing while typing (vertical only so robot stays fixed)
            bubbleOffsetY.value = withRepeat(withTiming(-3, { duration: 320 }), -1, true);
        } else {
            // Return bubble to rest near robot and stop bobbing
            bubbleOffsetX.value = withTiming(0, { duration: 180 });
            bubbleOffsetY.value = withTiming(0, { duration: 180 });
        }
    }, [showThinking]);
    const bubbleAnimStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: bubbleOffsetX.value },
            { translateY: bubbleOffsetY.value },
        ],
    }));

    // Draggable robot position (initial near NS AI FAB at right:24,bottom:100)
    const initialRobotX = Math.max(8, width - (24 + 52 + 12 + 46));
    const initialRobotY = Math.max(80, height - (100 + 52 - 10));
    const [robotPos, setRobotPos] = useState({ x: initialRobotX, y: initialRobotY });
    const dragStartRef = useRef({ x: 0, y: 0 });
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                dragStartRef.current = { x: robotPos.x, y: robotPos.y };
            },
            onPanResponderMove: (_, gesture) => {
                const nx = dragStartRef.current.x + gesture.dx;
                const ny = dragStartRef.current.y + gesture.dy;
                const maxX = width - 46 - 8; // keep on screen
                const maxY = height - 46 - 24;
                setRobotPos({ x: Math.max(8, Math.min(nx, maxX)), y: Math.max(40, Math.min(ny, maxY)) });
            },
            onPanResponderRelease: () => {},
        })
    ).current;

    // Fetch notes
    const fetchNotes = async () => {
        if (!user) return;
        setLoading(true);
        const userNotes = await getAllTasksByUserId(user.uid);
        setNotes(userNotes.sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
    };

    const promptBiometricSetupVerify = async () => {
        const enrolled = await ensureBiometricEnrollment();
        if (!enrolled) return false;
        const ok = await handleUnlockBiometric();
        if (ok) {
            setBiometricVerified(true);
            showToast({ message: 'Biometric verified', type: 'success' });
            return true;
        } else {
            setBiometricVerified(false);
            showToast({ message: 'Biometric verification failed/cancelled', type: 'error' });
            return false;
        }
    };
    useEffect(() => { fetchNotes(); }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotes();
        setRefreshing(false);
    };

    // --- Add Note Modal State ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteBody, setNoteBody] = useState('');
    const [fontSize, setFontSize] = useState(settings.defaultFontSize);
    const [fontFamily, setFontFamily] = useState('System');
    const [fontColor, setFontColor] = useState(isDarkMode ? '#fff' : '#F59E0B');
    const [saving, setSaving] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    // --- View/Edit Modal State (moved up to avoid TDZ with effects that reference viewNote) ---
    const [viewNote, setViewNote] = useState<any | null>(null);
    const [editNote, setEditNote] = useState<any | null>(null);
    const [editMode, setEditMode] = useState(false);
    
    // --- NS AI Modal State ---
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGeneratedContent, setAiGeneratedContent] = useState('');
    const [aiLoading, setAiLoading] = useState(false);


    // Handle OCR text extraction from selected image
    const handleExtractTextFromImage = async (imageUri: string) => {
        try {
            showToast({
                message: "Extracting text from image...",
                type: "info"
            });

            const extractedText = await extractTextFromImage(imageUri);

            if (extractedText && extractedText.trim()) {
                // Add the extracted text to the note body
                setNoteBody(prev => {
                    const separator = prev.trim() ? '\n\n' : '';
                    return prev + separator + extractedText;
                });

                showToast({
                    message: "Text extracted and added to note!",
                    type: "success"
                });
            } else {
                showAlert({
                    title: "No Text Found",
                    message: "No readable text was found in this image. Please try with an image that contains clear text.",
                    type: "warning",
                    confirmText: "OK"
                });
            }
        } catch (error) {
            console.error('OCR extraction error:', error);
            showAlert({
                title: "Extraction Failed",
                message: "Failed to extract text from the image. Please try again.",
                type: "error",
                confirmText: "OK"
            });
        }
    };

    // Handle dedicated OCR button - allows user to pick image specifically for text extraction
    const handleOCRExtraction = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status === 'granted') {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                // Directly extract text without asking - this is a dedicated OCR button
                await handleExtractTextFromImage(uri);
            }
        } else {
            showAlert({
                title: "Permission Required",
                message: "Please allow access to your photo library to extract text from images.",
                type: "warning",
                confirmText: "OK"
            });
        }
    };

    // When opening the modal for a new note, set the default styles from settings
    const handleAddNewNote = () => {
        setEditMode(false);
        setEditNote(null);
        setNoteTitle('');
        setNoteBody('');
        setFontSize(settings.defaultFontSize);
        setFontFamily(settings.defaultFont === 'SpaceMono' ? 'SpaceMono-Regular' : 'System');
        setFontColor(isDarkMode ? '#fff' : '#F59E0B');
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
        setImage(null);
        setShowAddModal(true);
    };

    const handleOpenAIModal = () => {
        setAiPrompt('');
        setAiGeneratedContent('');
        setAiLoading(false);
        setShowAIModal(true);
    };

    const generateSmartContent = async (prompt: string): Promise<string> => {
        try {
            console.log('🚀 NS AI: Starting content generation...');
            console.log('📝 User prompt:', prompt);
            
            // Call the real Gemini AI service
            const aiResponse = await generateAIContent(prompt);
            
            console.log('🔍 AI Response received:', {
                success: aiResponse.success,
                hasContent: !!aiResponse.content,
                contentLength: aiResponse.content?.length || 0,
                error: aiResponse.error
            });
            
            if (aiResponse.success && aiResponse.content) {
                console.log('✅ Real AI content generated successfully!');
                return aiResponse.content;
            } else {
                // If AI fails, show error and use fallback
                console.warn('⚠️ AI API failed, using fallback:', aiResponse.error);
                if (aiResponse.error && aiResponse.error.includes('API_KEY_INVALID')) {
                    showAlert({
                        title: 'Gemini API Key Invalid',
                        message: 'Your Gemini API key is invalid or not enabled. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env and restart Expo (expo start -c).',
                        type: 'warning',
                        confirmText: 'OK'
                    });
                }
                showToast({
                    message: 'AI service unavailable, using fallback content',
                    type: 'warning'
                });
                return generateMockContent(prompt);
            }
        } catch (error) {
            console.error('💥 Error in generateSmartContent:', error);
            showToast({
                message: 'AI generation failed, using fallback content',
                type: 'error'
            });
            return generateMockContent(prompt);
        }
    };

    const handleGenerateAIContent = async () => {
        if (!aiPrompt.trim()) {
            showToast({
                message: 'Please enter a prompt for NS AI',
                type: 'warning'
            });
            return;
        }

        setAiLoading(true);
        try {
            // Generate real AI content using Gemini API
            const generatedContent = await generateSmartContent(aiPrompt.trim());
            
            setAiGeneratedContent(generatedContent);
            
            showToast({
                message: 'Content generated successfully!',
                type: 'success'
            });
        } catch (error) {
            console.error('AI Generation Error:', error);
            showAlert({
                title: 'Generation Failed',
                message: 'Failed to generate AI content. Please check your API configuration.',
                type: 'error',
                confirmText: 'OK'
            });
        } finally {
            setAiLoading(false);
        }
    };

    const handleCopyAIContent = async () => {
        if (aiGeneratedContent) {
            try {
                await navigator.clipboard.writeText(aiGeneratedContent);
                showToast({
                    message: 'Content copied to clipboard!',
                    type: 'success'
                });
            } catch (error) {
                showToast({
                    message: 'Failed to copy content',
                    type: 'error'
                });
            }
        }
    };

    const handleAddAIAsNote = () => {
        if (aiGeneratedContent) {
            setNoteTitle(`AI Generated: ${aiPrompt.substring(0, 30)}${aiPrompt.length > 30 ? '...' : ''}`);
            setNoteBody(aiGeneratedContent);
            setFontSize(settings.defaultFontSize);
            setFontFamily(settings.defaultFont === 'SpaceMono' ? 'SpaceMono-Regular' : 'System');
            setFontColor(isDarkMode ? '#fff' : '#F59E0B');
            setIsBold(false);
            setIsItalic(false);
            setIsUnderline(false);
            setImage(null);
            setEditMode(false);
            setEditNote(null);
            setShowAIModal(false);
            setShowAddModal(true);
        }
    };

    // --- Voice Typing State ---
    const [isListening, setIsListening] = useState(false);
    const [viewNoteLoading, setViewNoteLoading] = useState(false);

    // --- Locking State ---
    const [lockModalVisible, setLockModalVisible] = useState(false);
    const [lockMode, setLockMode] = useState<'set' | 'unlock'>('set');
    const [lockType, setLockType] = useState<'pin' | 'pattern' | 'biometric'>('pin');
    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [pattern, setPattern] = useState<number[]>([]);
    const [unlockInput, setUnlockInput] = useState('');
    const [targetNote, setTargetNote] = useState<any | null>(null);
    const [biometricTypes, setBiometricTypes] = useState<string>('');
    const [biometricVerified, setBiometricVerified] = useState<boolean>(false);

    // simple non-cryptographic hash to avoid storing plaintext
    const simpleHash = (str: string) => {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & 0xffffffff;
        }
        return String(hash >>> 0);
    };

    const hasBiometricHardware = useMemo(async () => {
        if (!LocalAuthentication) return false;
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            return compatible && enrolled;
        } catch { return false; }
    }, []);

    useEffect(() => {
        (async () => {
            if (!LocalAuthentication) return;
            try {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                // Map to human friendly names
                const map: Record<number, string> = {
                    1: 'Fingerprint', // FINGERPRINT
                    2: 'Facial Recognition', // FACIAL_RECOGNITION
                    3: 'Iris', // IRIS
                };
                const names = types?.map((t: number) => map[t]).filter(Boolean).join(', ');
                setBiometricTypes(names || 'Biometrics');
            } catch { /* noop */ }
        })();
    }, []);

    const openBiometricSettings = async () => {
        try {
            if (Platform.OS === 'android' && IntentLauncher?.startActivityAsync) {
                // Try direct biometric enrollment screen first (API 30+), then fallback
                if (IntentLauncher?.ActivityAction?.BIOMETRIC_ENROLL) {
                    try {
                        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.BIOMETRIC_ENROLL);
                        return;
                    } catch (_) { /* fallback below */ }
                }
                await IntentLauncher.startActivityAsync('android.settings.SECURITY_SETTINGS');
                return;
            }
            // iOS or fallback
            await Linking.openSettings();
        } catch (e) {
            showToast({ message: 'Open Settings failed. Please open Settings manually.', type: 'warning' });
        }
    };

    const ensureBiometricEnrollment = async (): Promise<boolean> => {
        if (!LocalAuthentication) {
            showToast({ message: 'Biometrics not available on this device.', type: 'warning' });
            return false;
        }
        try {
            const hasHw = await LocalAuthentication.hasHardwareAsync();
            if (!hasHw) { showToast({ message: 'No biometric hardware found.', type: 'warning' }); return false; }
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            if (!enrolled) {
                showAlert({
                    title: 'Set up Biometrics',
                    message: 'No fingerprint/Face ID enrolled. Open system settings to add your biometrics, then return here.',
                    type: 'info',
                    confirmText: 'Open Settings',
                    cancelText: 'Cancel',
                    showCancel: true,
                    onConfirm: () => openBiometricSettings(),
                });
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    };

    const tryOpenNote = async (note: any) => {
        if (!note?.locked) {
            setViewNote(note);
            return;
        }
        // If locked, open unlock modal
        setTargetNote(note);
        setLockMode('unlock');
        setLockType(note.lockType || 'pin');
        setUnlockInput('');
        setPattern([]);
        setLockModalVisible(true);
    };

    const handleLockPress = (note: any) => {
        setTargetNote(note);
        setLockMode('set');
        setLockType('pin');
        setPin('');
        setPinConfirm('');
        setPattern([]);
        setBiometricVerified(false);
        setLockModalVisible(true);
    };

    const handleUnlockPress = (note: any) => {
        setTargetNote(note);
        setLockMode('unlock');
        setLockType(note.lockType || 'pin');
        setUnlockInput('');
        setPattern([]);
        setBiometricVerified(false);
        setLockModalVisible(true);
    };

    const handleUnlockBiometric = async () => {
        if (!LocalAuthentication) {
            showToast({ message: 'Biometrics not available on this device.', type: 'warning' });
            return false;
        }
        try {
            const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Note', fallbackEnabled: true });
            return result.success;
        } catch (e) {
            return false;
        }
    };

    const saveLock = async () => {
        if (!targetNote) return;
        try {
            let update: any = { locked: true, lockType };
            if (lockType === 'pin') {
                if (!pin || pin.length < 4) { showToast({ message: 'Enter at least 4 digits', type: 'warning' }); return; }
                if (pin !== pinConfirm) { showToast({ message: 'PINs do not match', type: 'error' }); return; }
                update.lockHash = simpleHash(pin);
            } else if (lockType === 'pattern') {
                if (pattern.length < 4) { showToast({ message: 'Draw a pattern with at least 4 points', type: 'warning' }); return; }
                update.lockHash = simpleHash(pattern.join('-'));
            } else if (lockType === 'biometric') {
                const enrolled = await ensureBiometricEnrollment();
                if (!enrolled) return;
                const ok = await handleUnlockBiometric();
                if (!ok) { showToast({ message: 'Biometric setup failed / cancelled', type: 'error' }); return; }
                update.lockHash = 'biometric';
            }
            await updateTask(targetNote.id, { ...targetNote, ...update });
            showToast({ message: 'Note locked', type: 'success' });
            setLockModalVisible(false);
            setTargetNote(null);
            fetchNotes();
        } catch (e) {
            showToast({ message: 'Failed to lock note', type: 'error' });
        }
    };

    const verifyUnlock = async () => {
        if (!targetNote) return;
        const t = targetNote;
        try {
            if (t.lockType === 'biometric') {
                const ok = await handleUnlockBiometric();
                if (!ok) { showToast({ message: 'Biometric auth failed', type: 'error' }); return; }
                setLockModalVisible(false);
                setViewNote(t);
                return;
            }
            if (t.lockType === 'pin') {
                if (!unlockInput) { showToast({ message: 'Enter PIN', type: 'warning' }); return; }
                if (simpleHash(unlockInput) !== t.lockHash) { showToast({ message: 'Incorrect PIN', type: 'error' }); return; }
            }
            if (t.lockType === 'pattern') {
                if (pattern.length < 1) { showToast({ message: 'Draw pattern', type: 'warning' }); return; }
                if (simpleHash(pattern.join('-')) !== t.lockHash) { showToast({ message: 'Incorrect pattern', type: 'error' }); return; }
            }
            setLockModalVisible(false);
            setViewNote(t);
        } catch (e) {
            showToast({ message: 'Unlock failed', type: 'error' });
        }
    };

    const removeLock = async (note: any) => {
        try {
            await updateTask(note.id, { ...note, locked: false, lockType: null, lockHash: null });
            showToast({ message: 'Lock removed', type: 'success' });
            fetchNotes();
        } catch (e) {
            showToast({ message: 'Failed to remove lock', type: 'error' });
        }
    };

    useEffect(() => {
        // Initialize voice callbacks for both web and native
        const cleanup = VoiceService.init({
            onResult: (text) => {
                setNoteBody(prev => prev + (prev ? ' ' : '') + text);
            },
            onStartState: (listening) => setIsListening(listening),
            onError: (e) => {
                console.log('Voice error:', e);
                setIsListening(false);
            },
        });
        return cleanup;
    }, []);

    // Smooth loading experience for View Note modal
    useEffect(() => {
        if (viewNote) {
            setViewNoteLoading(true);
            const finishTimer = setTimeout(() => setViewNoteLoading(false), 900);
            return () => clearTimeout(finishTimer);
        } else {
            setViewNoteLoading(false);
        }
    }, [viewNote]);

    const requestMicPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                // First check if permission is already granted
                const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                if (hasPermission) {
                    return true;
                }

                // Request permission with a clear dialog
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission Required',
                        message: 'This app needs access to your microphone to record voice notes. Please allow microphone access.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Deny',
                        buttonPositive: 'Allow',
                    },
                );

                console.log('Permission result:', granted);
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.log('Permission error:', err);
                return false;
            }
        }
        return true;
    };

    const handleStartVoice = async () => {
        // Unified start via VoiceService
        try {
            const hasPermission = await requestMicPermission();
            if (!hasPermission) {
                showAlert({
                    title: 'Permission Denied',
                    message: 'Microphone permission is required for voice typing.',
                    type: 'warning',
                    confirmText: 'OK'
                });
                return;
            }

            const available = await VoiceService.isAvailable();
            if (!available) {
                showAlert({
                    title: 'Voice Not Available',
                    message: 'Speech recognition is not available in this environment. If you are on Expo Go, please use a Development Build that includes @react-native-voice/voice.',
                    type: 'warning',
                    confirmText: 'OK'
                });
                return;
            }

            await VoiceService.start('en-US');
            setIsListening(true);
        } catch (e: any) {
            console.log('Voice start error:', e);
            setIsListening(false);
            showAlert({
                title: 'Voice Error',
                message: `Could not start voice recognition. ${e?.message || e?.toString?.() || 'Unknown error'}`,
                type: 'error',
                confirmText: 'OK'
            });
        }
    };
    const handleStopVoice = async () => {
        try {
            await VoiceService.stop();
        } catch (_) {}
        setIsListening(false);
    };

    

    const fontSizes = [14, 16, 18, 22, 28];
    // Expanded color palette for note text
    const fontColors = [
        '#FFFFFF', // white
        '#F59E0B', // amber-500
        '#FBBF24', // amber-400
        '#F97316', // orange-500
        '#EF4444', // red-500
        '#10B981', // emerald-500
        '#22C55E', // green-500
        '#06B6D4', // cyan-500
        '#3B82F6', // blue-500 (optional accent)
        '#8B5CF6', // violet-500
        '#A855F7', // purple-500
        '#EC4899', // pink-500
        '#111827', // gray-900
        '#374151', // gray-700
        '#9CA3AF', // gray-400
    ];

    const handleSaveNote = async () => {
        if (!noteBody.trim()) return;
        setSaving(true);
        let imageUrl = null;
        if (image) {
            imageUrl = await uploadImageToImgbb(image);
        }
        await createTask({
            title: noteTitle,
            body: noteBody,
            fontSize,
            fontFamily,
            fontColor,
            isBold,
            isItalic,
            isUnderline,
            image: imageUrl,
            userId: user?.uid,
            createdAt: Date.now(),
        });
        setSaving(false);
        setShowAddModal(false);
        setNoteTitle('');
        setNoteBody('');
        setFontSize(settings.defaultFontSize);
        setFontFamily(settings.defaultFont === 'SpaceMono' ? 'SpaceMono-Regular' : 'System');
        setFontColor('#F59E0B');
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
        setImage(null);
        fetchNotes();
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status === 'granted') {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                setImage(uri);

                // Ask user if they want to extract text from the selected image
                showAlert({
                    title: "Extract Text from Image?",
                    message: "Would you like to extract any text from this image and add it to your note?",
                    type: "info",
                    confirmText: "Extract Text",
                    cancelText: "Just Add Image",
                    onConfirm: () => handleExtractTextFromImage(uri),
                    onCancel: () => {
                        // Just keep the image without OCR
                        showToast({
                            message: "Image added to note",
                            type: "success"
                        });
                    }
                });
            }
        }
    };

    // Camera photo handler
    const handleTakePhoto = async () => {
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            setImage(imageUri);

            // Ask user if they want to extract text from the captured photo
            showAlert({
                title: "Extract Text from Photo?",
                message: "Would you like to extract any text from this photo and add it to your note?",
                type: "info",
                confirmText: "Extract Text",
                cancelText: "Just Add Photo",
                onConfirm: () => handleExtractTextFromImage(imageUri),
                onCancel: () => {
                    // Just keep the photo without OCR
                    showToast({
                        message: "Photo added to note",
                        type: "success"
                    });
                }
            });
        }
    };

    const handleShareNote = async () => {
        if (image) {
            await Sharing.shareAsync(image);
        } else {
            await Sharing.shareAsync(noteBody);
        }
    };

    const handleDeleteNote = (id: string) => {
        const deleteAction = async () => {
            await deleteTask(id);
            fetchNotes();
        };

        showAlert({
            title: 'Delete Note',
            message: 'Are you sure you want to delete this note? This action cannot be undone.',
            type: 'warning',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: deleteAction,
            onCancel: () => {},
        });
    };

    const handleEditNote = (note: any) => {
        setEditNote(note);
        setEditMode(true);
        setShowAddModal(true);
        setNoteTitle(note.title || '');
        setNoteBody(note.body || '');
        setFontSize(note.fontSize || 16);
        setFontFamily(note.fontFamily || 'System');
        setFontColor(note.fontColor || (isDarkMode ? '#fff' : '#F59E0B'));
        setIsBold(note.isBold || false);
        setIsItalic(note.isItalic || false);
        setIsUnderline(note.isUnderline || false);
        setImage(note.image || null);
    };

    const handleSaveEdit = async () => {
        if (!noteBody.trim() || !editNote) return;
        setSaving(true);
        let imageUrl = editNote.image;
        if (image && image !== editNote.image) {
            imageUrl = await uploadImageToImgbb(image);
        }
        await updateTask(editNote.id, {
            ...editNote,
            title: noteTitle,
            body: noteBody,
            fontSize,
            fontFamily,
            fontColor,
            isBold,
            isItalic,
            isUnderline,
            image: imageUrl,
        });
        setSaving(false);
        setShowAddModal(false);
        setEditNote(null);
        setEditMode(false);
        setNoteTitle('');
        setNoteBody('');
        setFontSize(settings.defaultFontSize);
        setFontFamily(settings.defaultFont === 'SpaceMono' ? 'SpaceMono-Regular' : 'System');
        setFontColor('#19376d');
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
        setImage(null);
        fetchNotes();
    };

    const uploadImageToImgbb = async (uri: string): Promise<string | null> => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    const base64data = (reader.result as string).split(',')[1];
                    const formData = new FormData();
                    formData.append('key', IMGBB_API_KEY);
                    formData.append('image', base64data);
                    try {
                        const res = await fetch('https://api.imgbb.com/1/upload', {
                            method: 'POST',
                            body: formData,
                        });
                        const data = await res.json();
                        if (data && data.success && data.data && data.data.url) {
                            resolve(data.data.url);
                        } else {
                            resolve(null);
                        }
                    } catch (err) {
                        resolve(null);
                    }
                };
                reader.onerror = () => reject(null);
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            return null;
        }
    };

    const styles = getStyles(isDarkMode);

    return (
        <View style={styles.container}>
            {/* Animated bubbles */}
            <Animated.View
                entering={FadeIn.duration(1200)}
                style={[
                    {
                        position: 'absolute',
                        top: -height * 0.13,
                        left: -width * 0.22,
                        width: width * 0.68,
                        height: width * 0.68,
                        borderRadius: width * 0.34,
                        backgroundColor: '#FBBF24',
                        opacity: 1,
                        zIndex: 0,
                    },
                    bubble1Style,
                ]}
            />
            <Animated.View
                entering={FadeIn.delay(400).duration(1500)}
                style={[
                    {
                        position: 'absolute',
                        bottom: -height * 0.15,
                        right: -width * 0.18,
                        width: width * 0.48,
                        height: width * 0.48,
                        borderRadius: width * 0.24,
                        backgroundColor: '#FBBF24',
                        opacity: 1,
                        zIndex: 0,
                    },
                    bubble2Style,
                ]}
            />
            {/* Welcome section */}
            <Animated.View
                entering={SlideInUp.springify().damping(16)}
                style={styles.welcomeBox}
            >
                <Text style={styles.welcomeText}>Welcome{user?.displayName ? `, ${user?.displayName}` : ''}!</Text>
                <Text style={styles.subText}>Here are your recent notes:</Text>
            </Animated.View>
            {/* Floating Robot (top-right) with Thought Bubble */}
            {showRobot && (
                <Animated.View entering={FadeIn.duration(600)}
                    style={{ position: 'absolute', top: robotPos.y, left: robotPos.x, zIndex: 50 }}
                    {...panResponder.panHandlers}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        {/* Thought bubble to the left of robot */}
                        <Animated.View style={[{ marginRight: 8, maxWidth: width * 0.6 }, bubbleAnimStyle]}>
                            <View style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff', borderColor: isDarkMode ? '#333' : '#fde68a', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, shadowColor: '#F59E0B', shadowOpacity: 0.08, shadowRadius: 6, minHeight: 46, justifyContent: 'center' }}>
                                {showThinking ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 20 }}>
                                        {[0,1,2].map((i) => (
                                            <View key={i} style={{ width: 6, height: 6, borderRadius: 3, marginRight: 6, backgroundColor: '#F59E0B', opacity: dotStep === i ? 1 : 0.3 }} />
                                        ))}
                                    </View>
                                ) : (
                                    <Animated.Text key={`tip-${tipIndex}`} style={[{ color: isDarkMode ? '#fff' : '#7c2d12' }, tipAnimStyle]}>
                                        {tips[tipIndex]}
                                    </Animated.Text>
                                )}
                            </View>
                            {/* Thought bubble tail */}
                            <View style={{ marginLeft: 14, marginTop: -4, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#fde68a' }} />
                                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#fff', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#fde68a', marginLeft: 4 }} />
                            </View>
                        </Animated.View>
                        {/* Robot avatar */}
                        <Animated.View style={[{ width: 46, height: 46, borderRadius: 23, backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#fde68a' }, robotFloatStyle]}>
                            <Text style={{ fontSize: 22 }}>🤖</Text>
                            <Animated.View style={[{ position: 'absolute', bottom: 6, right: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }, robotBlinkStyle]} />
                        </Animated.View>
                        <TouchableOpacity onPress={() => setShowRobot(false)} style={{ marginLeft: 6, padding: 6 }}>
                            <MaterialIcons name="close" size={16} color={isDarkMode ? '#aaa' : '#7c2d12'} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
            {/* Notes list */}
            <View style={{ flex: 1, zIndex: 1, marginTop: 12, width: '100%', paddingHorizontal: 16 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 40 }} />
                ) : notes.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: isDarkMode ? '#777' : '#888', marginTop: 60, fontSize: 18 }}>No notes found.</Text>
                ) : (
                    <FlatList
                        data={notes.slice(0, 6)}
                        keyExtractor={item => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        renderItem={({ item }) => (
                            <Animated.View entering={FadeIn.springify()} style={styles.noteCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={styles.noteTitle}>{item.title || 'Untitled Note'}</Text>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        {/* Lock/Unlock Button */}
                                        {item.locked ? (
                                            <TouchableOpacity onPress={() => handleUnlockPress(item)} style={{ marginRight: 4, backgroundColor: '#F59E0B', borderRadius: 8, padding: 6 }}>
                                                <MaterialIcons name="lock" size={18} color={'#ffffff'} />
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity onPress={() => handleLockPress(item)} style={{ marginRight: 4, backgroundColor: '#F59E0B', borderRadius: 8, padding: 6 }}>
                                                <MaterialIcons name="lock-open" size={18} color={'#ffffff'} />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity onPress={() => tryOpenNote(item)} style={{ marginRight: 4, backgroundColor: '#22C55E', borderRadius: 8, padding: 6 }}>
                                            <FontAwesome name="eye" size={18} color={'#ffffff'} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleEditNote(item)} style={{ marginRight: 4, backgroundColor: '#3B82F6', borderRadius: 8, padding: 6 }}>
                                            <FontAwesome name="edit" size={18} color={'#ffffff'} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteNote(item.id)} style={{ backgroundColor: '#EF4444', borderRadius: 8, padding: 6 }}>
                                            <FontAwesome name="trash" size={18} color={'#ffffff'} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text style={styles.noteBody} numberOfLines={2}>{item.body || item.content || ''}</Text>
                                {item.image && (
                                    <View style={{ marginTop: 8, marginBottom: 4 }}>
                                        <Image
                                            source={{ uri: item.image }}
                                            style={{ width: 100, height: 100, borderRadius: 12 }}
                                            onError={(error) => console.log('Image load error:', error)}
                                            onLoad={() => console.log('Image loaded successfully:', item.image)}
                                        />
                                    </View>
                                )}
                                <Text style={styles.noteDate}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
                            </Animated.View>
                        )}
                    />
                )}
            </View>
            {/* Floating Action Buttons */}
            <View style={{ position: 'absolute', right: 24, bottom: 100, zIndex: 10 }}>
                {/* NS AI Button */}
                <TouchableOpacity
                    style={{
                        backgroundColor: isDarkMode ? '#F59E0B' : '#F59E0B',
                        borderRadius: 28,
                        width: 52,
                        height: 52,
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 6,
                        marginBottom: 12,
                        shadowColor: isDarkMode ? '#F59E0B' : '#F59E0B',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                    onPress={handleOpenAIModal}
                    activeOpacity={0.85}
                >
                    <MaterialIcons name="auto-awesome" size={24} color="#fff" />
                </TouchableOpacity>
                
                {/* Add Note Button */}
                <TouchableOpacity
                    style={{
                        backgroundColor: isDarkMode ? '#fff' : '#F59E0B',
                        borderRadius: 32,
                        width: 56,
                        height: 56,
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 6,
                        shadowColor: isDarkMode ? '#fff' : '#F59E0B',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                    onPress={handleAddNewNote}
                    activeOpacity={0.85}
                >
                    <Text style={{ color: isDarkMode ? '#F59E0B' : '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 2 }}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Add Note Modal - Beautiful Card Style, Improved Layout */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowAddModal(false)}
            >
                <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ width: '100%', alignItems: 'center' }}
                    >
                        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', borderRadius: 24, padding: 28, width: width * 0.92, maxWidth: 420, shadowColor: isDarkMode ? '#fff' : '#F59E0B', shadowOpacity: 0.13, shadowRadius: 18, elevation: 8 }}>
                                <Text style={{ fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#F59E0B', marginBottom: 18, textAlign: 'center' }}>{editMode ? 'Edit Note' : 'Add Note'}</Text>
                                {/* Title Input */}
                                <TextInput
                                    style={{ fontSize: 18, fontWeight: '600', color: isDarkMode ? '#fff' : '#F59E0B', backgroundColor: isDarkMode ? '#2e2e2e' : '#FEF3C7', borderRadius: 8, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: isDarkMode ? '#333' : '#FDE68A' }}
                                    placeholder="Title (optional)"
                                    value={noteTitle}
                                    onChangeText={setNoteTitle}
                                    maxLength={60}
                                />
                                {/* Formatting Toolbar */}
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, justifyContent: 'center' }}>
                                    <TouchableOpacity onPress={() => setIsBold(v => !v)} style={{ backgroundColor: isBold ? (isDarkMode ? '#fff' : '#F59E0B') : (isDarkMode ? '#333' : '#FEF3C7'), borderRadius: 6, padding: 8, margin: 2 }}>
                                        <Text style={{ color: isBold ? (isDarkMode ? '#333' : '#fff') : (isDarkMode ? '#fff' : '#F59E0B'), fontWeight: 'bold', fontSize: 18 }}>B</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsItalic(v => !v)} style={{ backgroundColor: isItalic ? (isDarkMode ? '#fff' : '#F59E0B') : (isDarkMode ? '#333' : '#FEF3C7'), borderRadius: 6, padding: 8, margin: 2 }}>
                                        <Text style={{ color: isItalic ? (isDarkMode ? '#333' : '#fff') : (isDarkMode ? '#fff' : '#F59E0B'), fontStyle: 'italic', fontSize: 18 }}>I</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsUnderline(v => !v)} style={{ backgroundColor: isUnderline ? (isDarkMode ? '#fff' : '#F59E0B') : (isDarkMode ? '#333' : '#FEF3C7'), borderRadius: 6, padding: 8, margin: 2 }}>
                                        <Text style={{ color: isUnderline ? (isDarkMode ? '#333' : '#fff') : (isDarkMode ? '#fff' : '#F59E0B'), textDecorationLine: 'underline', fontSize: 18 }}>U</Text>
                                    </TouchableOpacity>
                                    <Text style={{ color: isDarkMode ? '#fff' : '#F59E0B', fontWeight: '600', marginLeft: 10 }}>Size:</Text>
                                    {fontSizes.map(size => (
                                        <TouchableOpacity key={size} onPress={() => setFontSize(size)} style={{ backgroundColor: fontSize === size ? (isDarkMode ? '#fff' : '#F59E0B') : (isDarkMode ? '#333' : '#FEF3C7'), borderRadius: 6, paddingHorizontal: 8, marginHorizontal: 2, marginVertical: 2 }}>
                                            <Text style={{ color: fontSize === size ? (isDarkMode ? '#333' : '#fff') : (isDarkMode ? '#fff' : '#F59E0B'), fontWeight: 'bold' }}>{size}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <Text style={{ color: isDarkMode ? '#fff' : '#F59E0B', fontWeight: '600', marginLeft: 10 }}>Color:</Text>
                                    {fontColors.map(color => (
                                        <TouchableOpacity key={color} onPress={() => setFontColor(color)} style={{ backgroundColor: color, borderRadius: 12, width: 22, height: 22, marginHorizontal: 2, marginVertical: 2, borderWidth: fontColor === color ? 2 : 0, borderColor: isDarkMode ? '#fff' : '#F59E0B' }} />
                                    ))}
                                    <TouchableOpacity onPress={handleStartVoice} style={{ backgroundColor: isListening ? (isDarkMode ? '#EA4335' : '#EA4335') : (isDarkMode ? '#333' : '#FEF3C7'), borderRadius: 6, padding: 8, margin: 2 }}>
                                        <Text style={{ color: isListening ? (isDarkMode ? '#fff' : '#fff') : (isDarkMode ? '#fff' : '#F59E0B'), fontSize: 18 }}>{isListening ? 'Stop' : 'Voice'}</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={[
                                        {
                                            fontSize,
                                            color: isDarkMode ? '#fff' : fontColor,
                                            fontWeight: isBold ? 'bold' : 'normal',
                                            fontStyle: isItalic ? 'italic' : 'normal',
                                            textDecorationLine: isUnderline ? 'underline' : 'none',
                                            backgroundColor: isDarkMode ? '#2e2e2e' : '#f8fafd',
                                            borderRadius: 8,
                                            padding: 12,
                                            minHeight: 80,
                                            marginBottom: 16,
                                            textAlignVertical: 'top',
                                            borderWidth: 1,
                                            borderColor: isDarkMode ? '#333' : '#e0eafc',
                                            fontFamily: fontFamily,
                                        },
                                    ]}
                                    placeholder="Type your note..."
                                    placeholderTextColor={isDarkMode ? '#9ca3af' : '#9CA3AF'}
                                    value={noteBody}
                                    onChangeText={setNoteBody}
                                    multiline
                                    maxLength={1000}
                                />
                                {/* Image, Camera, Mic, and Share Buttons Row */}
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16, gap: 14 }}>
                                    <TouchableOpacity onPress={handlePickImage} style={{ backgroundColor: isDarkMode ? '#333' : '#FEF3C7', borderRadius: 8, padding: 10, marginRight: 4 }}>
                                        <FontAwesome name="image" size={22} color={isDarkMode ? '#fff' : '#F59E0B'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleTakePhoto} style={{ backgroundColor: isDarkMode ? '#333' : '#FEF3C7', borderRadius: 8, padding: 10, marginRight: 4 }}>
                                        <FontAwesome name="camera" size={22} color={isDarkMode ? '#fff' : '#F59E0B'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={isListening ? handleStopVoice : handleStartVoice} style={{ backgroundColor: isListening ? (isDarkMode ? '#EA4335' : '#EA4335') : (isDarkMode ? '#333' : '#FEF3C7'), borderRadius: 8, padding: 10, marginRight: 4 }}>
                                        <FontAwesome name="microphone" size={22} color={isListening ? (isDarkMode ? '#fff' : '#fff') : (isDarkMode ? '#fff' : '#F59E0B')} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleOCRExtraction} style={{ backgroundColor: isDarkMode ? '#4CAF50' : '#2E7D32', borderRadius: 8, padding: 10, marginRight: 4 }}>
                                        <FontAwesome name="text-width" size={22} color="#ffffff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleShareNote} style={{ backgroundColor: isDarkMode ? '#F59E0B' : '#F59E0B', borderRadius: 8, padding: 10 }}>
                                        <FontAwesome name="share-alt" size={22} color={isDarkMode ? '#fff' : '#fff'} />
                                    </TouchableOpacity>
                                </View>
                                {image && (
                                    <View style={{ marginBottom: 12, alignSelf: 'flex-start' }}>
                                        <Text style={{ color: isDarkMode ? '#fff' : '#F59E0B', marginBottom: 4 }}>Attached Image:</Text>
                                        <Image source={{ uri: image }} style={{ width: 120, height: 120, borderRadius: 12 }} />
                                    </View>
                                )}
                                {/* Save/Cancel Buttons */}
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                                    <TouchableOpacity
                                        style={{ backgroundColor: isDarkMode ? '#333' : '#FEF3C7', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 }}
                                        onPress={() => setShowAddModal(false)}
                                        disabled={saving}
                                    >
                                        <Text style={{ color: isDarkMode ? '#fff' : '#F59E0B', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ backgroundColor: isDarkMode ? '#fff' : '#F59E0B', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}
                                        onPress={editMode ? handleSaveEdit : handleSaveNote}
                                        disabled={saving || !noteBody.trim()}
                                    >
                                        <Text style={{ color: isDarkMode ? '#333' : '#fff', fontWeight: 'bold', fontSize: 16 }}>{saving ? 'Saving...' : editMode ? 'Save Changes' : 'Save'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </BlurView>
            </Modal>

            {/* Lock / Unlock Modal */}
            <Modal
                visible={lockModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setLockModalVisible(false)}
            >
                <BlurView tint={isDarkMode ? 'dark' : 'light'} intensity={120} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', borderRadius: 22, padding: 22, width: width * 0.9, maxWidth: 420 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#333', marginBottom: 12 }}>{lockMode === 'set' ? 'Lock Note' : 'Unlock Note'}</Text>

                        {/* Lock Type Selector when setting */}
                        {lockMode === 'set' && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                {(['pin', 'pattern', 'biometric'] as const).map(t => (
                                    <TouchableOpacity key={t} onPress={async () => { setLockType(t); setBiometricVerified(false); if (t === 'biometric') { await promptBiometricSetupVerify(); } }} style={{ flex: 1, marginHorizontal: 4, backgroundColor: lockType === t ? (isDarkMode ? '#F59E0B' : '#F59E0B') : (isDarkMode ? '#2a2a2a' : '#f3f4f6'), borderRadius: 10, padding: 10, alignItems: 'center' }}>
                                        <Text style={{ color: lockType === t ? '#fff' : (isDarkMode ? '#ddd' : '#374151'), fontWeight: '700', textTransform: 'capitalize' }}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* PIN UI */}
                        {(lockMode === 'set' && lockType === 'pin') && (
                            <View>
                                <Text style={{ color: isDarkMode ? '#fff' : '#333', marginBottom: 6 }}>Set PIN (min 4 digits)</Text>
                                <TextInput value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={8} style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#f8fafd', borderRadius: 10, padding: 12, color: isDarkMode ? '#fff' : '#333', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#e5e7eb', marginBottom: 8 }} />
                                <TextInput value={pinConfirm} onChangeText={setPinConfirm} keyboardType="number-pad" secureTextEntry maxLength={8} placeholder="Confirm PIN" placeholderTextColor={isDarkMode ? '#9ca3af' : '#9CA3AF'} style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#f8fafd', borderRadius: 10, padding: 12, color: isDarkMode ? '#fff' : '#333', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#e5e7eb' }} />
                            </View>
                        )}

                        {/* Pattern UI (simple 3x3 grid) */}
                        {((lockMode === 'set' && lockType === 'pattern') || (lockMode === 'unlock' && (targetNote?.lockType === 'pattern'))) && (
                            <View style={{ marginVertical: 10 }}>
                                <Text style={{ color: isDarkMode ? '#fff' : '#333', marginBottom: 6 }}>{lockMode === 'set' ? 'Draw pattern (tap dots in order)' : 'Draw pattern to unlock'}</Text>
                                <View style={{ width: 220, height: 220, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {Array.from({ length: 9 }).map((_, idx) => (
                                        <TouchableOpacity key={idx} onPress={() => setPattern(p => (p.includes(idx) ? p : [...p, idx]))} style={{ width: 70, height: 70, margin: 3, borderRadius: 35, backgroundColor: pattern.includes(idx) ? '#F59E0B' : (isDarkMode ? '#2a2a2a' : '#f3f4f6'), borderWidth: 2, borderColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: pattern.includes(idx) ? '#fff' : (isDarkMode ? '#555' : '#bbb') }} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {lockMode === 'unlock' && (
                                    <TouchableOpacity onPress={() => setPattern([])} style={{ alignSelf: 'center', marginTop: 6 }}>
                                        <Text style={{ color: '#F59E0B', fontWeight: '600' }}>Clear</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Biometric hint */}
                        {((lockMode === 'set' && lockType === 'biometric') || (lockMode === 'unlock' && (targetNote?.lockType === 'biometric'))) && (
                            <View style={{ marginBottom: 10 }}>
                                <Text style={{ color: isDarkMode ? '#fff' : '#333', marginBottom: 8 }}>
                                    {lockMode === 'set'
                                        ? `Use your ${biometricTypes || 'biometrics'} to secure this note.`
                                        : `Use your ${biometricTypes || 'biometrics'} to unlock.`}
                                </Text>
                                {lockMode === 'set' && (
                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <TouchableOpacity onPress={openBiometricSettings} style={{ backgroundColor: isDarkMode ? '#333' : '#f3f4f6', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 }}>
                                                <Text style={{ color: isDarkMode ? '#fff' : '#374151', fontWeight: '700' }}>Set up biometrics</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={promptBiometricSetupVerify} style={{ backgroundColor: '#F59E0B', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 }}>
                                                <Text style={{ color: '#fff', fontWeight: '700' }}>Verify now</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={{ color: biometricVerified ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                                            {biometricVerified ? 'Biometric verified' : 'Not verified yet'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Unlock with PIN */}
                        {(lockMode === 'unlock' && targetNote?.lockType === 'pin') && (
                            <TextInput value={unlockInput} onChangeText={setUnlockInput} keyboardType="number-pad" secureTextEntry maxLength={8} placeholder="Enter PIN" placeholderTextColor={isDarkMode ? '#9ca3af' : '#9CA3AF'} style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#f8fafd', borderRadius: 10, padding: 12, color: isDarkMode ? '#fff' : '#333', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#e5e7eb', marginBottom: 8 }} />
                        )}

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                            {lockMode === 'set' && targetNote?.locked && (
                                <TouchableOpacity onPress={() => removeLock(targetNote)} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: isDarkMode ? '#333' : '#f3f4f6', marginRight: 8 }}>
                                    <Text style={{ color: isDarkMode ? '#fff' : '#374151', fontWeight: '700' }}>Remove Lock</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => setLockModalVisible(false)} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: isDarkMode ? '#333' : '#f3f4f6', marginRight: 8 }}>
                                <Text style={{ color: isDarkMode ? '#fff' : '#374151', fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                            {lockMode === 'set' ? (
                                <TouchableOpacity onPress={saveLock} disabled={lockType==='biometric' && !biometricVerified} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: (lockType==='biometric' && !biometricVerified) ? (isDarkMode ? '#9CA3AF' : '#D1D5DB') : '#F59E0B' }}>
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={verifyUnlock} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#F59E0B' }}>
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>Unlock</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </BlurView>
            </Modal>

            {/* View Note Modal */}
            <Modal
                visible={!!viewNote}
                animationType="none"
                transparent
                onRequestClose={() => setViewNote(null)}
            >
                <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1 }}>
                    <BlurView tint={isDarkMode ? 'dark' : 'light'} intensity={140} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        {/* Dim overlay for extra depth */}
                        <Animated.View entering={FadeIn.duration(420)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)' }} />
                        <Animated.View entering={SlideInUp.duration(800).springify().damping(18).mass(0.9)} style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', borderRadius: 22, padding: 28, width: width * 0.92, maxWidth: 420, shadowColor: isDarkMode ? '#fff' : '#F59E0B', shadowOpacity: 0.13, shadowRadius: 18, elevation: 8 }}>
                            {/* Skeleton loading (brief, elegant) */}
                            {viewNoteLoading ? (
                                <>
                                    <View style={{ height: 24, borderRadius: 6, backgroundColor: isDarkMode ? '#2a2a2a' : '#FDE68A', marginBottom: 16, opacity: 0.8 }} />
                                    <View style={{ alignSelf: 'center', width: 180, height: 180, borderRadius: 16, backgroundColor: isDarkMode ? '#2a2a2a' : '#FFF3BF', marginBottom: 16, opacity: 0.9 }} />
                                    <View style={{ height: 12, borderRadius: 6, backgroundColor: isDarkMode ? '#2a2a2a' : '#FEF08A', marginBottom: 8 }} />
                                    <View style={{ height: 12, borderRadius: 6, backgroundColor: isDarkMode ? '#2a2a2a' : '#FEF08A', marginBottom: 8, width: '92%' }} />
                                    <View style={{ height: 12, borderRadius: 6, backgroundColor: isDarkMode ? '#2a2a2a' : '#FEF08A', marginBottom: 16, width: '86%' }} />
                                </>
                            ) : (
                                <>
                                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#F59E0B', marginBottom: 12, textAlign: 'center' }}>{viewNote?.title || 'Untitled Note'}</Text>
                                    {viewNote?.image && (
                                        <Image onLoad={() => setViewNoteLoading(false)} source={{ uri: viewNote.image }} style={{ width: 180, height: 180, borderRadius: 16, alignSelf: 'center', marginBottom: 16 }} />
                                    )}
                                    <ScrollView style={{ maxHeight: 220 }}>
                                        <Text style={{ fontSize: viewNote?.fontSize || 16, color: viewNote?.fontColor || (isDarkMode ? '#fff' : '#F59E0B'), fontWeight: viewNote?.isBold ? 'bold' : 'normal', fontStyle: viewNote?.isItalic ? 'italic' : 'normal', textDecorationLine: viewNote?.isUnderline ? 'underline' : 'none', marginBottom: 10 }}>
                                            {viewNote?.body}
                                        </Text>
                                    </ScrollView>
                                    <Text style={{ fontSize: 13, color: isDarkMode ? '#777' : '#888', textAlign: 'right', marginTop: 12 }}>{viewNote?.createdAt ? new Date(viewNote.createdAt).toLocaleString() : ''}</Text>
                                </>
                            )}
                            <TouchableOpacity
                                style={{ backgroundColor: isDarkMode ? '#333' : '#FEF3C7', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginTop: 18, alignSelf: 'center' }}
                                onPress={() => setViewNote(null)}
                            >
                                <Text style={{ color: isDarkMode ? '#fff' : '#F59E0B', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </BlurView>
                </Animated.View>
            </Modal>

            {/* NS AI Modal */}
            <Modal
                visible={showAIModal}
                animationType="none"
                transparent
                onRequestClose={() => setShowAIModal(false)}
            >
                <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1 }}>
                    <BlurView tint={isDarkMode ? 'dark' : 'light'} intensity={140} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Animated.View entering={FadeIn.duration(420)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)' }} />
                        <Animated.View entering={SlideInUp.duration(800).springify().damping(18).mass(0.9)} style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', borderRadius: 22, padding: 28, width: width * 0.92, maxWidth: 420, maxHeight: height * 0.8, shadowColor: isDarkMode ? '#F59E0B' : '#F59E0B', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }}>
                            
                            {/* Header */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                <MaterialIcons name="auto-awesome" size={28} color={isDarkMode ? '#F59E0B' : '#F59E0B'} />
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#333', marginLeft: 12 }}>NS AI</Text>
                                <TouchableOpacity onPress={() => setShowAIModal(false)} style={{ marginLeft: 'auto' }}>
                                    <MaterialIcons name="close" size={24} color={isDarkMode ? '#fff' : '#666'} />
                                </TouchableOpacity>
                            </View>

                            {/* Prompt Input */}
                            <Text style={{ fontSize: 16, fontWeight: '600', color: isDarkMode ? '#fff' : '#333', marginBottom: 8 }}>What would you like to create?</Text>
                            <TextInput
                                style={{
                                    backgroundColor: isDarkMode ? '#2e2e2e' : '#f8fafd',
                                    borderRadius: 12,
                                    padding: 16,
                                    fontSize: 16,
                                    color: isDarkMode ? '#fff' : '#333',
                                    borderWidth: 1,
                                    borderColor: isDarkMode ? '#444' : '#e5e7eb',
                                    marginBottom: 16,
                                    minHeight: 80,
                                    textAlignVertical: 'top'
                                }}
                                placeholder="Enter your prompt here... (e.g., 'Create a meeting agenda for project planning')"
                                placeholderTextColor={isDarkMode ? '#9ca3af' : '#9CA3AF'}
                                value={aiPrompt}
                                onChangeText={setAiPrompt}
                                multiline
                                maxLength={500}
                            />

                            {/* Generate Button */}
                            <TouchableOpacity
                                onPress={handleGenerateAIContent}
                                disabled={aiLoading}
                                style={{
                                    backgroundColor: aiLoading ? (isDarkMode ? '#B45309' : '#D97706') : (isDarkMode ? '#F59E0B' : '#F59E0B'),
                                    borderRadius: 12,
                                    padding: 16,
                                    alignItems: 'center',
                                    marginBottom: 16,
                                    opacity: aiLoading ? 0.7 : 1
                                }}
                            >
                                {aiLoading ? (
                                    <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                        <Beautiful3DLoader visible={true} text="Generating with NS AI..." size="large" color={isDarkMode ? '#FDE68A' : '#F59E0B'} />
                                    </View>
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Generate with NS AI</Text>
                                )}
                            </TouchableOpacity>

                            {/* Generated Content */}
                            {aiGeneratedContent ? (
                                <>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: isDarkMode ? '#fff' : '#333', marginBottom: 8 }}>Generated Content:</Text>
                                    <ScrollView style={{ maxHeight: 200, backgroundColor: isDarkMode ? '#2e2e2e' : '#f8fafd', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: isDarkMode ? '#444' : '#e5e7eb' }}>
                                        <Text style={{ fontSize: 14, color: isDarkMode ? '#e5e7eb' : '#374151', lineHeight: 20 }}>{aiGeneratedContent}</Text>
                                    </ScrollView>
                                    
                                    {/* Action Buttons */}
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity
                                            onPress={handleCopyAIContent}
                                            style={{
                                                flex: 1,
                                                backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                                                borderRadius: 10,
                                                padding: 12,
                                                alignItems: 'center',
                                                flexDirection: 'row',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <MaterialIcons name="content-copy" size={18} color={isDarkMode ? '#fff' : '#374151'} style={{ marginRight: 6 }} />
                                            <Text style={{ color: isDarkMode ? '#fff' : '#374151', fontSize: 14, fontWeight: '600' }}>Copy</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity
                                            onPress={handleAddAIAsNote}
                                            style={{
                                                flex: 1,
                                                backgroundColor: isDarkMode ? '#059669' : '#10B981',
                                                borderRadius: 10,
                                                padding: 12,
                                                alignItems: 'center',
                                                flexDirection: 'row',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <MaterialIcons name="note-add" size={18} color="#fff" style={{ marginRight: 6 }} />
                                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Add as Note</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : null}
                        </Animated.View>
                    </BlurView>
                </Animated.View>
            </Modal>

        </View>
    );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDarkMode ? '#0a0a0a' : '#f7fafd',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubble: {
        position: 'absolute',
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: width * 0.25,
        backgroundColor: '#FBBF24',
        opacity: 0.08,
        zIndex: 0,
    },

    welcomeBox: {
        padding: 20,
        alignItems: 'center',
        marginTop: height * 0.1,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: isDarkMode ? '#fff' : '#F59E0B',
    },

    subText: {
        fontSize: 18,
        color: isDarkMode ? '#aaa' : '#555',
        marginTop: 8,
    },

    noteCard: {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDarkMode ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDarkMode ? '#fff' : '#F59E0B',
    },

    noteBody: {
        fontSize: 14,
        color: isDarkMode ? '#ccc' : '#666',
        marginTop: 4,
    },

    noteDate: {
        fontSize: 12,
        color: isDarkMode ? '#888' : '#aaa',
        marginTop: 8,
        textAlign: 'right',
    },
});

export default HomeScreen;