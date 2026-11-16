import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

/** Standard banner height in dp. Reserved even when no ad is loaded, so the layout never jumps. */
export const BANNER_HEIGHT = 50;

const LIVE_BANNER_UNIT_ID = 'ca-app-pub-5452343649745884/9168885258';
const bannerUnitId = __DEV__ ? TestIds.BANNER : LIVE_BANNER_UNIT_ID;

/** Fixed bottom banner. The slot keeps its height if the ad fails or has not loaded yet. */
export function BottomBanner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.slot,
        {
          height: BANNER_HEIGHT,
          bottom: insets.bottom,
          backgroundColor: theme.background,
        },
      ]}
    >
      <BannerAd unitId={bannerUnitId} size={BannerAdSize.BANNER} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
