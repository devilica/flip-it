import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { rewardedAds } from '@/services/ads';
import { HINTS_PER_LEVEL } from '@/store/gameStore';

interface HintOfferOverlayProps {
  onGrant: () => void;
  onClose: () => void;
}

/** Offers a rewarded ad for another set of hints. Nothing is granted unless the ad pays out. */
export function HintOfferOverlay({ onGrant, onClose }: HintOfferOverlayProps) {
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
    if (rewarded) onGrant();
    else setAdError(true);
  };

  return (
    <OverlayPanel>
      <AppText size={30} weight="bold" align="center">
        Out of hints
      </AppText>
      <AppText size={15} tone="muted" align="center">
        Watch a short ad for {HINTS_PER_LEVEL} more hints.
      </AppText>
      <GameButton
        label={loadingAd ? 'Loading ad...' : `+${HINTS_PER_LEVEL} hints`}
        caption={loadingAd ? 'The video opens when it is ready' : 'Watch a short ad'}
        icon="play-circle"
        onPress={watchAd}
        disabled={loadingAd}
        style={styles.full}
      />
      {adError ? (
        <AppText size={13} tone="muted" align="center">
          Ad didn't finish. No extra hints.
        </AppText>
      ) : null}
      <GameButton label="Not now" variant="ghost" size="sm" onPress={onClose} disabled={loadingAd} style={styles.full} />
    </OverlayPanel>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
});
