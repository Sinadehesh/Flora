import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { blocker } from '../../blocker';
import { useLockState } from '../../components/LockSetup';
import { PlantPhoto } from '../../components/PlantPhoto';
import { Button, Card, SectionTitle } from '../../components/ui';
import { dayKey, dueRepeats, lessonStudied, todaysNewPlants } from '../../core/daily';
import { accuracy, botanyIQ, inProgressCount, learnedCount, troublePlants } from '../../core/stats';
import { PLANTS } from '../../data/plants';
import { useDeck, useStore } from '../../state/store';
import { serif, useColors } from '../../theme';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function Home() {
  const c = useColors();
  const { state } = useStore();
  const deck = useDeck();
  const [lock] = useLockState();

  const now = Date.now();
  const today = dayKey(now);
  const perDay = state.settings.plantsPerDay;
  const fresh = todaysNewPlants(deck, state.learn, today, perDay);
  const repeats = dueRepeats(deck, state.learn, today);
  const studied = lessonStudied(deck, state.learn, today);
  const examDone = state.examDoneOn === today;
  const tomorrow = dayKey(now + DAY_MS);
  const tomorrowRepeats = dueRepeats(deck, state.learn, tomorrow).length;
  const tomorrowNew = todaysNewPlants(deck, state.learn, tomorrow, perDay).length;

  const acc = accuracy(state.stats);
  const trouble = troublePlants(deck, state.stats);
  const nothingLeft = !fresh.length && !repeats.length;
  // Free users who've met every flower: Plus has more plants to learn.
  const offerPlus = !state.plus && deck.every((p) => state.learn[p.id]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {blocker.available && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings')}
          style={[styles.lockBanner, { backgroundColor: lock.enabled ? c.surface : c.primary, borderColor: c.border }]}
        >
          <Text style={{ color: lock.enabled ? c.text : c.onPrimary, fontSize: 16, fontWeight: '700' }}>
            {lock.enabled
              ? `🔒 Guarding ${lock.blockedCount} app${lock.blockedCount === 1 ? '' : 's'}`
              : '🔓 Your apps aren’t locked yet — set up the lock'}
          </Text>
        </Pressable>
      )}

      <Card style={{ gap: 12 }}>
        <Text style={[styles.cardLabel, { color: c.textMuted }]}>Today</Text>
        {examDone || nothingLeft ? (
          <>
            <Text style={[styles.headline, { color: c.text, fontFamily: serif }]}>
              {nothingLeft && !examDone ? 'Nothing due today' : '✓ Done for today'}
            </Text>
            <Text style={[styles.body, { color: c.textMuted }]}>
              {tomorrowNew + tomorrowRepeats === 0
                ? 'You’ve learned every plant in your deck. Your locked apps keep quizzing you on them.'
                : `Tomorrow: ${plural(tomorrowNew, 'new plant')}${tomorrowRepeats ? ` and ${plural(tomorrowRepeats, 'repeat')}` : ''}.`}
            </Text>
            {examDone && !nothingLeft && (
              <Button
                variant="secondary"
                label="Go over today’s lesson again"
                onPress={() => router.push({ pathname: '/lesson', params: { review: '1' } })}
              />
            )}
            {offerPlus && (
              <>
                <Text style={[styles.body, { color: c.text }]}>
                  You’ve met all {deck.length} flowers. FloraLock Plus adds {PLANTS.length - deck.length} houseplants
                  and trees.
                </Text>
                <Button label="See FloraLock Plus" onPress={() => router.push('/upgrade')} />
              </>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.headline, { color: c.text, fontFamily: serif }]}>
              {studied ? 'Take today’s exam' : fresh.length ? plural(fresh.length, 'new plant') : 'Repeat day'}
            </Text>
            {fresh.length > 0 && (
              <View style={styles.thumbs}>
                {fresh.map((p) => (
                  <View key={p.id} style={[styles.thumb, { backgroundColor: c.surfaceMuted }]}>
                    <PlantPhoto plant={p} compact />
                  </View>
                ))}
              </View>
            )}
            <Text style={[styles.body, { color: c.textMuted }]}>
              {fresh.length && !studied ? 'See each plant once, then a short multiple-choice exam. ' : ''}
              {repeats.length ? `Plus ${plural(repeats.length, 'plant')} from earlier coming back once.` : ''}
            </Text>
            <Button
              label={studied || !fresh.length ? 'Start the exam' : 'Start today’s lesson'}
              onPress={() => router.push('/lesson')}
            />
          </>
        )}
      </Card>

      <Card style={styles.iqCard}>
        <Text style={[styles.cardLabel, { color: c.textMuted }]}>Botany IQ</Text>
        <Text style={[styles.iq, { color: c.primary, fontFamily: serif }]}>{botanyIQ(deck, state.learn)}</Text>
        <View style={styles.statsRow}>
          <Stat label="Learned" value={`${learnedCount(deck, state.learn)}/${deck.length}`} />
          <Stat label="Repeat to come" value={String(inProgressCount(deck, state.learn))} />
          <Stat label="Accuracy" value={acc === null ? '—' : `${Math.round(acc * 100)}%`} />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          variant="secondary"
          label="Practice a question"
          onPress={() => router.push({ pathname: '/challenge', params: { practice: '1' } })}
        />
        <Button
          variant="ghost"
          label="Preview the lock screen"
          onPress={() => router.push({ pathname: '/challenge', params: { source: 'Instagram' } })}
        />
      </View>

      {trouble.length > 0 && (
        <>
          <SectionTitle>Keeps tripping you up</SectionTitle>
          {trouble.map((p) => {
            const s = state.stats[p.id];
            return (
              <Pressable
                key={p.id}
                accessibilityRole="link"
                onPress={() => router.push({ pathname: '/plant/[id]', params: { id: p.id } })}
                style={[styles.row, { borderColor: c.border, backgroundColor: c.surface }]}
              >
                <View style={styles.rowThumb}>
                  <PlantPhoto plant={p} compact />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>{p.commonName}</Text>
                  <Text style={{ color: c.textMuted }}>
                    Missed {s.wrong} of {s.seen}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 12 },
  lockBanner: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  cardLabel: { fontSize: 14, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  headline: { fontSize: 26, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21 },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden' },
  iqCard: { alignItems: 'center', paddingVertical: 20 },
  iq: { fontSize: 64, fontWeight: '700', lineHeight: 76 },
  statsRow: { flexDirection: 'row', marginTop: 8, alignSelf: 'stretch' },
  actions: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  rowThumb: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden' },
  rowTitle: { fontSize: 17, fontWeight: '600' },
});
