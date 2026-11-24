import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { GameButton } from '@/components/ui/GameButton';
import { OverlayPanel } from '@/components/ui/OverlayPanel';
import { useI18n } from '@/i18n';
import { rewardedAds } from '@/services/ads';
import { UNDOS_PER_AD } from '@/store/gameStore';

interface UndoOfferOverlayProps {
  onGrant: () => void;
  onClose: () => void;
}

/** Offers a rewarded ad for two more undos. Nothing is granted unless the ad pays out. */
export function UndoOfferOverlay({ onGrant, onClose }: UndoOfferOverlayProps) {
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
        {t('outOfUndos')}
      </AppText>
      <AppText size={15} tone="muted" align="center">
        {t('watchForUndos', { n: UNDOS_PER_AD })}
      </AppText>
      <GameButton
        label={loadingAd ? t('loadingAd') : t('moreUndos', { n: UNDOS_PER_AD })}
        caption={loadingAd ? t('videoReady') : t('watchShortAd')}
        icon="play-circle"
        onPress={watchAd}
        disabled={loadingAd}
        style={styles.full}
      />
      {adError ? (
        <AppText size={13} tone="muted" align="center">
          {t('adNoUndos')}
        </AppText>
      ) : null}
      <GameButton label={t('notNow')} variant="ghost" size="sm" onPress={onClose} disabled={loadingAd} style={styles.full} />
    </OverlayPanel>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
});
