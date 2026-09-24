import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlantPhoto } from '../../components/PlantPhoto';
import { Card, SectionTitle } from '../../components/ui';
import { MAX_BOX } from '../../core/srs';
import { PLANT_IMAGES } from '../../data/plantImages.generated';
import { PLANTS_BY_ID } from '../../data/plants';
import { useStore } from '../../state/store';
import { CATEGORY_LABEL, serif, useColors } from '../../theme';

export default function PlantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = PLANTS_BY_ID[id];
  const c = useColors();
  const { state } = useStore();

  if (!plant) return <Text style={{ padding: 16, color: c.text }}>Unknown plant.</Text>;

  const progress = state.progress[plant.id];
  const credit = PLANT_IMAGES[plant.id]?.credit;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: plant.commonName }} />
      <View style={[styles.photo, { backgroundColor: c.surfaceMuted }]}>
        <PlantPhoto plant={plant} />
      </View>
      {credit && (
        <Text style={[styles.credit, { color: c.textMuted }]} onPress={() => Linking.openURL(credit.sourceUrl)}>
          Photo: {credit.author} · {credit.license}
        </Text>
      )}

      <Text style={[styles.name, { color: c.text, fontFamily: serif }]}>{plant.commonName}</Text>
      <Text style={[styles.sci, { color: c.textMuted, fontFamily: serif }]}>{plant.scientificName}</Text>

      <Card style={{ marginTop: 16 }}>
        <Text style={[styles.fact, { color: c.text }]}>{plant.fact}</Text>
      </Card>

      <SectionTitle>Details</SectionTitle>
      <Detail label="Family" value={plant.family} />
      <Detail label="Group" value={CATEGORY_LABEL[plant.category]} />
      {plant.aliases.length > 0 && <Detail label="Also accepted" value={plant.aliases.join(', ')} />}

      <SectionTitle>Your record</SectionTitle>
      {progress ? (
        <>
          <Detail label="Correct" value={`${progress.correct} of ${progress.seen}`} />
          <Detail label="Mastery" value={`${progress.box} / ${MAX_BOX}`} />
          <Detail label="Next review" value={formatDue(progress.dueAt)} />
        </>
      ) : (
        <Text style={{ color: c.textMuted }}>You haven’t met this plant on the lock screen yet.</Text>
      )}
    </ScrollView>
  );
}

function formatDue(dueAt: number): string {
  const mins = Math.round((dueAt - Date.now()) / 60_000);
  if (mins <= 0) return 'Due now';
  if (mins < 60) return `In ${mins} min`;
  if (mins < 48 * 60) return `In ${Math.round(mins / 60)} h`;
  return `In ${Math.round(mins / 1440)} days`;
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
  credit: { fontSize: 12, marginTop: 6 },
  name: { fontSize: 32, fontWeight: '700', marginTop: 16 },
  sci: { fontSize: 18, fontStyle: 'italic' },
  fact: { fontSize: 17, lineHeight: 25 },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
