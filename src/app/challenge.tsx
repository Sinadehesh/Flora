import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { blocker } from '../blocker';
import { PlantPhoto } from '../components/PlantPhoto';
import { Button } from '../components/ui';
import {
  challengeReducer,
  penaltySecondsLeft,
  startChallenge,
  type ChallengeEvent,
  type ChallengeState,
} from '../core/challenge';
import { dayKey, lockScreenPool, pickLockPlant } from '../core/daily';
import { buildChoices } from '../core/quiz';
import type { Plant } from '../core/types';
import { PLANTS_BY_ID } from '../data/plants';
import { correctToday, emergencyLeft, useDeck, useStore } from '../state/store';
import { serif, useColors } from '../theme';

const randomPhoto = () => Math.floor(Math.random() * 1_000_000);

function haptic(success: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

/**
 * The lock-screen intercept. Opened by the native blocker as
 * `floralock://challenge?source=Instagram`, or from the home screen with
 * `?practice=1` for extra practice (no unlock, no emergency exit).
 * Questions come from today's exam: the plants learned today and the ones due their repeat.
 */
export default function ChallengeScreen() {
  // `package` is set when the Android blocker opened this screen over a locked app.
  const {
    source,
    practice,
    package: lockedPackage,
  } = useLocalSearchParams<{ source?: string; practice?: string; package?: string }>();
  const isPractice = practice === '1';
  const { state: store, dispatch } = useStore();
  const deck = useDeck();
  const c = useColors();

  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [now, setNow] = useState(Date.now);
  const [emergencyUsed, setEmergencyUsed] = useState(false);
  // A fresh photo for every question, so users learn the plant rather than one picture.
  const [photo, setPhoto] = useState(randomPhoto);

  const pickPlant = (excludeId?: string) => {
    const t = Date.now();
    const pool = lockScreenPool(deck, store.learn, dayKey(t), store.settings.plantsPerDay);
    return pickLockPlant(pool, correctToday(store, t), Math.random, excludeId);
  };

  // Pick the first plant only once saved progress has loaded, so the daily plan sees it.
  useEffect(() => {
    if (store.hydrated && !challenge && deck.length) setChallenge(startChallenge(pickPlant().id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.hydrated, challenge, deck]);

  // Tick the penalty countdown.
  useEffect(() => {
    if (challenge?.phase !== 'penalty') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [challenge?.phase]);

  const plant: Plant | undefined = challenge ? PLANTS_BY_ID[challenge.plantId] : undefined;
  const choices = useMemo(
    () => (plant ? buildChoices(plant, deck) : []),
    // Re-deal only when the plant changes, not on every progress update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plant?.id],
  );

  if (!challenge || !plant) {
    return <View style={[styles.screen, { backgroundColor: c.background }]} />;
  }

  const send = (event: ChallengeEvent) => setChallenge((s) => (s ? challengeReducer(s, event) : s));

  const answer = (guess: string, correct: boolean) => {
    if (challenge.phase !== 'question') return;
    const t = Date.now();
    dispatch({ type: 'answer', plantId: plant.id, correct, now: t });
    send({ type: 'answer', correct, guess, now: t, penaltySeconds: store.settings.penaltySeconds });
    setNow(t);
    haptic(correct);
    if (correct && !isPractice) blocker.grantTemporaryAccess(lockedPackage, store.settings.unlockMinutes);
  };

  // After a penalty, ask a different plant: re-asking the same one would be a free guess.
  const retry = () => {
    setPhoto(randomPhoto());
    send({ type: 'retry', now: Date.now(), nextPlantId: pickPlant(plant.id).id });
  };

  const nextCard = () => {
    setPhoto(randomPhoto());
    setChallenge(startChallenge(pickPlant(plant.id).id));
  };

  const emergencyUnlock = () => {
    dispatch({ type: 'useEmergency', now: Date.now() });
    blocker.grantTemporaryAccess(lockedPackage, store.settings.unlockMinutes);
    setEmergencyUsed(true);
  };

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  // Leaving a real lock: close the challenge, then open the unlocked app or go to the home screen.
  const continueToApp = () => {
    router.replace('/');
    if (lockedPackage) blocker.returnToApp(lockedPackage);
  };
  const skipApp = () => {
    router.replace('/');
    if (lockedPackage) blocker.goHome();
  };
  const secondsLeft = penaltySecondsLeft(challenge, now);
  const emergencies = emergencyLeft(store, now);
  const appName = source ?? 'your app';

  if (emergencyUsed) {
    return (
      <Result
        title="Emergency unlock"
        body={`${appName} is open for ${store.settings.unlockMinutes} minutes. ${emergencies} emergency unlock${emergencies === 1 ? '' : 's'} left today.`}
        primary={{ label: `Continue to ${appName}`, onPress: continueToApp }}
      />
    );
  }

  if (challenge.phase === 'unlocked') {
    return (
      <Result
        plant={plant}
        photo={photo}
        title={`Yes — ${plant.commonName}!`}
        body={
          isPractice ? plant.fact : `You earned ${store.settings.unlockMinutes} minutes of ${appName}. ${plant.fact}`
        }
        primary={
          isPractice
            ? { label: 'Next card', onPress: nextCard }
            : { label: `Continue to ${appName}`, onPress: continueToApp }
        }
        secondary={isPractice ? { label: 'Done', onPress: leave } : undefined}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: c.textMuted }]}>
            {isPractice ? 'Practice' : `${appName} is locked`}
          </Text>
          {isPractice && (
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={leave} hitSlop={12}>
              <Text style={{ color: c.textMuted, fontSize: 22 }}>✕</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.photo, { backgroundColor: c.surfaceMuted }]}>
          <PlantPhoto plant={plant} photo={photo} showHint={challenge.phase === 'question'} />
          {challenge.phase === 'penalty' && (
            <View style={[StyleSheet.absoluteFill, styles.penaltyOverlay, { backgroundColor: c.overlay }]}>
              <Text style={styles.countdown} accessibilityLiveRegion="polite">
                {secondsLeft}
              </Text>
              <Text style={styles.countdownLabel}>{secondsLeft ? 'Take a good look' : 'Ready'}</Text>
            </View>
          )}
        </View>

        {challenge.phase === 'question' ? (
          <View style={styles.panel}>
            <Text style={[styles.prompt, { color: c.text, fontFamily: serif }]}>What is this plant?</Text>
            <View style={styles.choices}>
              {choices.map((choice) => (
                <Button
                  key={choice.id}
                  variant="secondary"
                  label={choice.commonName}
                  onPress={() => answer(choice.commonName, choice.id === plant.id)}
                />
              ))}
            </View>

            {!isPractice && (
              <View style={styles.escapes}>
                <Button variant="ghost" label={`I don't need ${appName} right now`} onPress={skipApp} />
                {emergencies > 0 && (
                  <Pressable accessibilityRole="button" onPress={emergencyUnlock} hitSlop={8}>
                    <Text style={[styles.emergency, { color: c.textMuted }]}>
                      Emergency unlock ({emergencies} left today)
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={[styles.wrong, { color: c.danger }]}>
              Not quite{challenge.guess ? ` — not ${challenge.guess}` : ''}.
            </Text>
            <Text style={[styles.answerName, { color: c.text, fontFamily: serif }]}>{plant.commonName}</Text>
            <Text style={[styles.sci, { color: c.textMuted, fontFamily: serif }]}>
              {plant.scientificName} · {plant.family}
            </Text>
            <Text style={[styles.fact, { color: c.text }]}>{plant.fact}</Text>
            <Button
              label={secondsLeft ? `Try again in ${secondsLeft}s` : 'Try another plant'}
              disabled={secondsLeft > 0}
              onPress={retry}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Result({
  plant,
  photo,
  title,
  body,
  primary,
  secondary,
}: {
  plant?: Plant;
  photo?: number;
  title: string;
  body: string;
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}) {
  const c = useColors();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {plant && (
          <View style={[styles.photo, { backgroundColor: c.surfaceMuted }]}>
            <PlantPhoto plant={plant} photo={photo} />
          </View>
        )}
        <View style={styles.panel}>
          <Text style={[styles.answerName, { color: c.success, fontFamily: serif }]}>{title}</Text>
          {plant && (
            <Text style={[styles.sci, { color: c.textMuted, fontFamily: serif }]}>
              {plant.scientificName} · {plant.family}
            </Text>
          )}
          <Text style={[styles.fact, { color: c.text }]}>{body}</Text>
          <Button label={primary.label} onPress={primary.onPress} />
          {secondary && <Button variant="ghost" label={secondary.label} onPress={secondary.onPress} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center', flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  kicker: { fontSize: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  photo: { width: '100%', aspectRatio: 1, maxHeight: 380, borderRadius: 24, overflow: 'hidden' },
  penaltyOverlay: { alignItems: 'center', justifyContent: 'center' },
  countdown: { color: '#fff', fontSize: 96, fontWeight: '800', fontVariant: ['tabular-nums'] },
  countdownLabel: { color: '#fff', fontSize: 16, fontWeight: '600', opacity: 0.9 },
  panel: { marginTop: 20, gap: 10 },
  prompt: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  choices: { gap: 10 },
  escapes: { marginTop: 8, alignItems: 'center', gap: 4 },
  emergency: { fontSize: 14, textDecorationLine: 'underline', paddingVertical: 6 },
  wrong: { fontSize: 16, fontWeight: '700' },
  answerName: { fontSize: 32, fontWeight: '700' },
  sci: { fontSize: 16, fontStyle: 'italic' },
  fact: { fontSize: 17, lineHeight: 25, marginVertical: 8 },
});
