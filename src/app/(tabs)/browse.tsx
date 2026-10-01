import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PlantPhoto } from '../../components/PlantPhoto';
import { Chip } from '../../components/ui';
import { learnStatus, type LearnStatus } from '../../core/daily';
import { normalizeName } from '../../core/text';
import type { PlantCategory } from '../../core/types';
import { PLANTS } from '../../data/plants';
import { useStore } from '../../state/store';
import { CATEGORY_LABEL, useColors } from '../../theme';

const FILTERS: (PlantCategory | 'all')[] = ['all', 'flower', 'houseplant', 'tree'];

export default function Browse() {
  const c = useColors();
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PlantCategory | 'all'>('all');

  const plants = useMemo(() => {
    const q = normalizeName(query);
    return PLANTS.filter((p) => filter === 'all' || p.category === filter)
      .filter((p) => !q || normalizeName(`${p.commonName} ${p.scientificName} ${p.family}`).includes(q))
      .sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [query, filter]);

  return (
    <FlatList
      data={plants}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 12 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search plants, species or families"
            placeholderTextColor={c.textMuted}
            autoCorrect={false}
            style={[styles.search, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}
          />
          <View style={styles.chips}>
            {FILTERS.map((f) => (
              <Chip
                key={f}
                label={f === 'all' ? 'All' : CATEGORY_LABEL[f]}
                selected={filter === f}
                onPress={() => setFilter(f)}
              />
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={{ color: c.textMuted }}>No plants match “{query}”.</Text>}
      renderItem={({ item }) => {
        return (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/plant/[id]', params: { id: item.id } })}
            style={[styles.row, { borderColor: c.border, backgroundColor: c.surface }]}
          >
            <View style={styles.thumb}>
              <PlantPhoto plant={item} compact />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.text }]}>{item.commonName}</Text>
              <Text style={{ color: c.textMuted, fontStyle: 'italic' }}>{item.scientificName}</Text>
            </View>
            <StatusDots status={learnStatus(state.learn, item.id)} />
          </Pressable>
        );
      }}
    />
  );
}

const STATUS_LABEL: Record<LearnStatus, string> = {
  new: 'Not learned yet',
  learning: 'Learned, repeat to come',
  learned: 'Learned',
};

/** Two dots: one for the lesson, one for the repeat. */
function StatusDots({ status }: { status: LearnStatus }) {
  const c = useColors();
  const filled = { new: 0, learning: 1, learned: 2 }[status];
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={STATUS_LABEL[status]}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < filled ? c.primary : c.border }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
  search: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  thumb: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden' },
  name: { fontSize: 17, fontWeight: '600' },
});
