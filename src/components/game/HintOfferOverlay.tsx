import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { useI18n } from '@/i18n';
import { rewardedAds } from '@/services/ads';
import { HINTS_PER_LEVEL } from '@/store/gameStore';

interface HintOfferOverlayProps {
  onGrant: () => void;
  onClose: () => void;
  /** How many hints the finished ad adds. */
  hints?: number;
}

/** Offers a rewarded ad for another set of hints. Nothing is granted unless the ad pays out. */
export function HintOfferOverlay({ onGrant, onClose, hints = HINTS_PER_LEVEL }: HintOfferOverlayProps) {
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
    if (rewarded) onGrant();
    else setAdError(true);
  };

  return (
    <OverlayPanel>
      <AppText size={30} weight="bold" align="center">
        {t('outOfHints')}
      </AppText>
      <AppText size={15} tone="muted" align="center">
        {hints === 1 ? t('watchForHintsOne') : t('watchForHints', { n: hints })}
      </AppText>
      <GameButton
        label={loadingAd ? t('loadingAd') : hints === 1 ? t('moreHint') : t('moreHints', { n: hints })}
        caption={loadingAd ? t('videoReady') : t('watchShortAd')}
        icon="play-circle"
        onPress={watchAd}
        disabled={loadingAd}
        style={styles.full}
      />
      {adError ? (
        <AppText size={13} tone="muted" align="center">
          {t('adNoHints')}
        </AppText>
      ) : null}
      <GameButton label={t('notNow')} variant="ghost" size="sm" onPress={onClose} disabled={loadingAd} style={styles.full} />
    </OverlayPanel>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
});
