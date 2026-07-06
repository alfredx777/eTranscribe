import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  getTranscript,
  updateTranscriptText,
  deleteTranscript,
  Transcript,
} from '../storage/db';

export default function DetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [item, setItem] = useState<Transcript | null>(null);
  const [text, setText] = useState('');

  // useAudioPlayer needs a source up front; pass an empty string until we
  // know the real audioUri, then it's created once via the player prop.
  const player = useAudioPlayer(item?.audioUri ?? undefined);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    getTranscript(id).then((t) => {
      setItem(t);
      setText(t?.text ?? '');
    });
  }, [id]);

  const handleSaveEdits = async () => {
    await updateTranscriptText(id, text);
    Alert.alert('Saved');
  };

  const handleDelete = async () => {
    Alert.alert('Delete transcript?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTranscript(id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handlePlayAudio = () => {
    if (!item?.audioUri) return;
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleExportText = async () => {
    const path = FileSystem.cacheDirectory + `transcript-${id}.txt`;
    await FileSystem.writeAsStringAsync(path, text);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path);
    } else {
      Alert.alert('Sharing not available on this device');
    }
  };

  if (!item) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <TextInput
        style={styles.textInput}
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.row}>
        {item.audioUri ? (
          <Pressable style={styles.actionButton} onPress={handlePlayAudio}>
            <Text style={styles.actionText}>
              {status.playing ? '■ Stop' : '▶ Play audio'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.actionButton} onPress={handleExportText}>
          <Text style={styles.actionText}>Export .txt</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={styles.saveButton} onPress={handleSaveEdits}>
          <Text style={styles.saveText}>Save edits</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1116',
  },
  textInput: {
    backgroundColor: '#171B21',
    color: '#E7EAF0',
    borderRadius: 12,
    padding: 16,
    minHeight: 220,
    fontSize: 16,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#232A34',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  actionText: {
    color: '#E7EAF0',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2D6CDF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  saveText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#3A1F1F',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  deleteText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
