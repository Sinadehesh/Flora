import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EdibilityBadge } from '../../components/EdibilityBadge';
import { CluesList, Lookalikes } from '../../components/PlantFacts';
import { PlantPhoto } from '../../components/PlantPhoto';
import { Card, SectionTitle } from '../../components/ui';
import { MASTERED_STEP } from '../../core/daily';
import { lookalikesOf } from '../../core/quiz';
import { PLANT_DETAILS } from '../../data/plantDetails';
import { PLANT_IMAGES } from '../../data/plantImages.generated';
import { PLANTS, PLANTS_BY_ID } from '../../data/plants';
import { useStore } from '../../state/store';
import { CATEGORY_LABEL, serif, useColors } from '../../theme';

export default function PlantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = PLANTS_BY_ID[id];
  const c = useColors();
  const { state } = useStore();
  const [photo, setPhoto] = useState(0);

  if (!plant) return <Text style={{ padding: 16, color: c.text }}>Unknown plant.</Text>;

  const stats = state.stats[plant.id];
  const record = state.learn[plant.id];
  const photoCount = PLANT_IMAGES[plant.id]?.length ?? 0;
  const details = PLANT_DETAILS[plant.id];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: plant.commonName }} />
      <View style={[styles.photo, { backgroundColor: c.surfaceMuted }]}>
        <PlantPhoto plant={plant} photo={photo} />
      </View>
      {photoCount > 1 && (
        <View style={styles.thumbs}>
          {Array.from({ length: photoCount }, (_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Photo ${i + 1} of ${photoCount}`}
              accessibilityState={{ selected: i === photo }}
              onPress={() => setPhoto(i)}
              style={[styles.thumb, { borderColor: i === photo ? c.primary : 'transparent' }]}
            >
              <PlantPhoto plant={plant} photo={i} compact />
            </Pressable>
          ))}
        </View>
      )}

      <Text style={[styles.name, { color: c.text, fontFamily: serif }]}>{plant.commonName}</Text>
      <Text style={[styles.sci, { color: c.textMuted, fontFamily: serif }]}>{plant.scientificName}</Text>

      <Card style={{ marginTop: 16 }}>
        <Text style={[styles.fact, { color: c.text }]}>{plant.fact}</Text>
      </Card>

      <SectionTitle>How to recognise it</SectionTitle>
      <CluesList plant={plant} />

      {lookalikesOf(plant, PLANTS).length > 0 && (
        <>
          <SectionTitle>Often confused with</SectionTitle>
          <Lookalikes plant={plant} />
        </>
      )}

      {details && (
        <>
          <SectionTitle>About</SectionTitle>
          <Paragraph>{details.about}</Paragraph>

          <SectionTitle>Where it grows</SectionTitle>
          <Paragraph>{details.where}</Paragraph>

          <SectionTitle>Edible?</SectionTitle>
          <View style={{ marginBottom: 8 }}>
            <EdibilityBadge plant={plant} />
          </View>
          <Paragraph>{details.edibilityNote}</Paragraph>

          {details.uses && (
            <>
              <SectionTitle>Uses</SectionTitle>
              <Paragraph>{details.uses}</Paragraph>
            </>
          )}

          {details.lore && (
            <>
              <SectionTitle>Lore</SectionTitle>
              <Paragraph>{details.lore}</Paragraph>
            </>
          )}
        </>
      )}

      <SectionTitle>Details</SectionTitle>
      <Detail label="Family" value={plant.family} />
      <Detail label="Group" value={CATEGORY_LABEL[plant.category]} />
      {plant.aliases.length > 0 && <Detail label="Also called" value={plant.aliases.join(', ')} />}

      <SectionTitle>Your record</SectionTitle>
      {record ? (
        <>
          <Detail label="Collected" value={formatDay(record.learnedOn)} />
          <Detail label="Reviews passed" value={`${Math.min(record.step, MASTERED_STEP)} of ${MASTERED_STEP}`} />
          <Detail label="Next review" value={record.step >= MASTERED_STEP ? 'Mastered' : formatDay(record.dueOn)} />
        </>
      ) : (
        <Detail label="Status" value="Not in a lesson yet" />
      )}
      {stats && <Detail label="Correct answers" value={`${stats.correct} of ${stats.seen}`} />}

      <Text style={[styles.disclaimer, { color: c.textMuted }]}>
        General information only. Never eat a plant or use it as medicine based on an app. Many plants have toxic
        look-alikes.
      </Text>
    </ScrollView>
  );
}

function Paragraph({ children }: { children: string }) {
  const c = useColors();
  return <Text style={[styles.paragraph, { color: c.text }]}>{children}</Text>;
}

function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function Detail({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={[styles.detail, { borderColor: c.border }]}>
      <Text style={{ color: c.textMuted, fontSize: 15 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 15, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 20, overflow: 'hidden' },
  thumbs: { flexDirection: 'row', gap: 8, marginTop: 10 },
  thumb: { width: 60, height: 60, borderRadius: 10, overflow: 'hidden', borderWidth: 2 },
  name: { fontSize: 32, fontWeight: '700', marginTop: 16 },
  sci: { fontSize: 18, fontStyle: 'italic' },
  fact: { fontSize: 17, lineHeight: 25 },
  paragraph: { fontSize: 16, lineHeight: 24 },
  disclaimer: { fontSize: 13, lineHeight: 19, marginTop: 24 },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
