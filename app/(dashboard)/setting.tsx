import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';

const SettingScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Dummy state for other settings
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [dataSyncEnabled, setDataSyncEnabled] = React.useState(false);

  const styles = getStyles(isDarkMode);

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        <Text style={styles.cardTitle}>General</Text>
        <View style={styles.settingItem}>
          <FontAwesome name="bell" size={24} color={styles.icon.color} />
          <Text style={styles.settingText}>Enable Notifications</Text>
          <Switch
            onValueChange={() => setNotificationsEnabled(prev => !prev)}
            value={notificationsEnabled}
          />
        </View>
        <View style={styles.settingItem}>
          <FontAwesome name="cloud-upload" size={24} color={styles.icon.color} />
          <Text style={styles.settingText}>Sync Data Automatically</Text>
          <Switch
            onValueChange={() => setDataSyncEnabled(prev => !prev)}
            value={dataSyncEnabled}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#121212' : '#f7fafd',
    padding: 20,
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
  icon: {
    color: isDarkMode ? '#9ca3af' : '#19376d',
  },
});

export default SettingScreen;