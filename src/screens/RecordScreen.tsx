import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { saveTranscript } from '../storage/db';

export default function RecordScreen({ navigation }: any) {
  const {
    state,
    fullTranscript,
    liveText,
    audioUri,
    errorMessage,
    start,
    stop,
    reset,
  } = useVoiceRecognition();

  const [saving, setSaving] = useState(false);
  const isListening = state === 'listening';

  const handleToggle = async () => {
    if (isListening) {
      await stop();
    } else {
      reset();
      try {
        await start();
      } catch (e: any) {
        Alert.alert('Could not start', e?.message ?? 'Unknown error');
      }
    }
  };

  const handleSave = async () => {
    if (!fullTranscript.trim()) {
      Alert.alert('Nothing to save', 'Record something first.');
      return;
    }
    setSaving(true);
    try {
      const title = fullTranscript.slice(0, 40) || 'Untitled transcript';
      await saveTranscript(title, fullTranscript.trim(), audioUri);
      reset();
      navigation.navigate('History');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.transcriptBox} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.transcriptText}>
          {fullTranscript || (
            <Text style={styles.placeholder}>
              Tap the mic and start speaking — your words will appear here live.
            </Text>
          )}
        </Text>
      </ScrollView>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          onPress={handleToggle}
          style={[styles.micButton, isListening && styles.micButtonActive]}
        >
          <Text style={styles.micButtonText}>
            {isListening ? '■ Stop' : '● Record'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={isListening || saving || !fullTranscript.trim()}
          style={[
            styles.saveButton,
            (isListening || !fullTranscript.trim()) && styles.saveButtonDisabled,
          ]}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        {isListening
          ? 'Listening… recognition restarts automatically after pauses.'
          : 'Recording captures both audio and a live transcript at the same time.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1116',
  },
  transcriptBox: {
    flex: 1,
    margin: 16,
    backgroundColor: '#171B21',
    borderRadius: 12,
  },
  transcriptText: {
    color: '#E7EAF0',
    fontSize: 17,
    lineHeight: 26,
  },
  placeholder: {
    color: '#5A6270',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 12,
  },
  micButton: {
    backgroundColor: '#2D6CDF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
  },
  micButtonActive: {
    backgroundColor: '#D6392F',
  },
  micButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#232A34',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 32,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: '#E7EAF0',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#5A6270',
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: 24,
  },
});
