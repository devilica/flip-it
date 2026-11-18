import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isExpoGo } from '@/services/ads';

type BannerModule = typeof import('react-native-google-mobile-ads');

const bannerAds: BannerModule | null = isExpoGo ? null : (require('react-native-google-mobile-ads') as BannerModule);

/** Standard banner height in dp. Reserved even when no ad is loaded, so the layout never jumps. */
export const BANNER_HEIGHT = 50;

const LIVE_BANNER_UNIT_ID = 'ca-app-pub-5452343649745884/9168885258';
const bannerUnitId = bannerAds ? (__DEV__ ? bannerAds.TestIds.BANNER : LIVE_BANNER_UNIT_ID) : '';

/** Fixed bottom banner. The slot keeps its height if the ad fails or has not loaded yet. */
export function BottomBanner() {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.slot,
        {
          height: BANNER_HEIGHT,
          bottom: insets.bottom,
        },
      ]}
    >
      {bannerAds ? <bannerAds.BannerAd unitId={bannerUnitId} size={bannerAds.BannerAdSize.BANNER} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
