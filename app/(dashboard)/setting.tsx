import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { useSettings, FontOption } from '../../context/SettingsContext';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

const SettingScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const { settings, setSetting, loading } = useSettings();
  const isDarkMode = theme === 'dark';

  // Animated bubbles
  const bubble1Scale = useSharedValue(1);
  const bubble2Scale = useSharedValue(1);
  React.useEffect(() => {
    bubble1Scale.value = withRepeat(withTiming(1.12, { duration: 2200 }), -1, true);
    bubble2Scale.value = withRepeat(withTiming(1.08, { duration: 1800 }), -1, true);
  }, []);
  const bubble1Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble1Scale.value }] }));
  const bubble2Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble2Scale.value }] }));

  // Dummy state for other settings
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all locally cached data? This will not delete your notes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would clear AsyncStorage or other caches here.
            Alert.alert('Success', 'Local cache has been cleared.');
          },
        },
      ]
    );
  };

  const styles = getStyles(isDarkMode);

  if (loading) {
    return <View style={styles.container}><Text style={styles.settingText}>Loading settings...</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={[styles.bubble, { top: -height * 0.1, left: -width * 0.2 }, bubble1Style]} />
      <Animated.View style={[styles.bubble, { bottom: -height * 0.15, right: -width * 0.18 }, bubble2Style]} />

      <Animated.View entering={FadeInUp.duration(1000).springify()}>
        <Text style={styles.title}>Settings</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(1000).delay(200).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>
        <View style={styles.settingItem}>
          <FontAwesome name="moon-o" size={24} color={styles.icon.color} />
          <Text style={styles.settingText}>Dark Mode</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
            onValueChange={toggleTheme}
            value={isDarkMode}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(1000).delay(400).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Default Note Styles</Text>
        <View style={styles.settingItem}>
          <FontAwesome name="text-height" size={24} color={styles.icon.color} />
          <Text style={styles.settingText}>Font Size: {settings.defaultFontSize.toFixed(0)}</Text>
        </View>
        {Platform.OS !== 'web' ? (
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={12}
            maximumValue={24}
            step={1}
            value={settings.defaultFontSize}
            onSlidingComplete={(value) => setSetting('defaultFontSize', value)}
            minimumTrackTintColor="#19376d"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#19376d"
          />
        ) : (
          <Text style={styles.infoText}>Font size slider is available on the mobile app.</Text>
        )}
        <View style={styles.settingItem}>
          <FontAwesome name="font" size={24} color={styles.icon.color} />
          <Text style={styles.settingText}>Font Family</Text>
        </View>
        <View style={styles.fontSelectorContainer}>
          {(['System', 'SpaceMono'] as FontOption[]).map(font => (
            <TouchableOpacity
              key={font}
              style={[styles.fontOption, settings.defaultFont === font && styles.fontOptionSelected]}
              onPress={() => setSetting('defaultFont', font)}
            >
              <Text style={[styles.fontOptionText, settings.defaultFont === font && styles.fontOptionTextSelected]}>
                {font}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(1000).delay(600).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Behavior</Text>
        <View style={styles.settingItem}>
          <FontAwesome name="check-circle" size={24} color={styles.icon.color} />
          <Text style={styles.settingText}>Confirm Before Deleting</Text>
          <Switch
            onValueChange={(value) => setSetting('confirmDelete', value)}
            value={settings.confirmDelete}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(1000).delay(800).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Advanced</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
          <FontAwesome name="trash" size={24} color={styles.icon.color} />
          <Text style={styles.settingText}>Clear Local Cache</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(1000).delay(1000).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <View style={styles.settingItem}>
          <FontAwesome name="info-circle" size={24} color={styles.icon.color} />
          <Text style={styles.settingText}>App Version</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#000000' : '#f7fafd',
    padding: 20,
  },
  bubble: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: '#000080',
    opacity: 0.08,
    zIndex: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
    marginBottom: 30,
    marginTop: 40,
  },
  card: {
    width: '100%',
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  settingText: {
    fontSize: 18,
    color: isDarkMode ? '#fff' : '#333',
    flex: 1,
    marginLeft: 15,
  },
  versionText: {
    fontSize: 18,
    color: isDarkMode ? '#888' : '#555',
  },
  infoText: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#555',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  fontSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  fontOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? '#444' : '#d1d5db',
  },
  fontOptionSelected: {
    backgroundColor: '#19376d',
    borderColor: '#19376d',
  },
  fontOptionText: {
    color: isDarkMode ? '#fff' : '#333',
    fontWeight: '600',
  },
  fontOptionTextSelected: {
    color: '#fff',
  },
  icon: {
    color: isDarkMode ? '#9ca3af' : '#19376d',
  },
});

export default SettingScreen;