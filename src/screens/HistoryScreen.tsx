import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listTranscripts, Transcript } from '../storage/db';

function formatDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<Transcript[]>([]);

  useFocusEffect(
    useCallback(() => {
      listTranscripts().then(setItems);
    }, [])
  );

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No transcripts yet.</Text>
        <Text style={styles.emptySub}>Record something on the Record tab to see it here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('Detail', { id: item.id })}
        >
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1116',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1116',
    padding: 24,
  },
  emptyText: {
    color: '#E7EAF0',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySub: {
    color: '#5A6270',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#171B21',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    color: '#E7EAF0',
    fontSize: 16,
    fontWeight: '600',
  },
  cardDate: {
    color: '#5A6270',
    fontSize: 12,
    marginTop: 6,
  },
});
