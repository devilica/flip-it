import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { useI18n } from '@/i18n';
import { rewardedAds } from '@/services/ads';
import { BONUS_MOVES } from '@/store/gameStore';
import { palette, spacing } from '@/theme';

interface FailOverlayProps {
  canUseBonus: boolean;
  onRetry: () => void;
  onBonus: () => void;
  onHome: () => void;
}

function SadTile() {
  const tilt = useSharedValue(0);
  const drop = useSharedValue(-30);

  useEffect(() => {
    drop.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.back(2)) });
    tilt.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [drop, tilt]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }, { rotate: `${tilt.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.sadTile, style]}>
      <Ionicons name="sad-outline" size={48} color="#FFFFFF" />
    </Animated.View>
  );
}

export function FailOverlay({ canUseBonus, onRetry, onBonus, onHome }: FailOverlayProps) {
  const { t } = useI18n();
  const [loadingAd, setLoadingAd] = useState(false);
  const [adError, setAdError] = useState(false);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const watchAd = async () => {
    setAdError(false);
    setLoadingAd(true);
    const rewarded = await rewardedAds.showRewarded();
    if (!mounted.current) return;
    setLoadingAd(false);
    if (rewarded) onBonus();
    else setAdError(true);
  };

  return (
    <OverlayPanel>
      <SadTile />
      <AppText size={30} weight="bold" align="center">
        {t('outOfMoves')}
      </AppText>
      <AppText size={15} tone="muted" align="center">
        {t('soClose')}
      </AppText>
      <GameButton label={t('tryAgain')} icon="refresh" size="lg" onPress={onRetry} style={styles.full} />
      {canUseBonus && rewardedAds.isAvailable() ? (
        <GameButton
          label={loadingAd ? t('loadingAd') : t('bonusMoves', { n: BONUS_MOVES })}
          caption={loadingAd ? t('videoReady') : t('watchShortAd')}
          icon="play-circle"
          variant="secondary"
          onPress={watchAd}
          disabled={loadingAd}
          style={styles.full}
        />
      ) : null}
      {adError ? (
        <AppText size={13} tone="muted" align="center">
          {t('adNoMoves')}
        </AppText>
      ) : null}
      <GameButton label={t('home')} icon="home" variant="ghost" size="sm" onPress={onHome} style={styles.full} />
    </OverlayPanel>
  );
}

const styles = StyleSheet.create({
  sadTile: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: palette.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  full: { alignSelf: 'stretch' },
});
