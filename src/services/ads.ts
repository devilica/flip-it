import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentStatus,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

export interface RewardedAdProvider {
  /** Whether the player may try to watch a rewarded ad. */
  isAvailable(): boolean;
  /**
   * Shows a rewarded ad. Resolves true only when AdMob reports the reward was earned.
   * Closing the ad early or a failed load resolves false.
   */
  showRewarded(): Promise<boolean>;
  /** Gathers consent if required, initializes the SDK, and preloads an ad. */
  prepare(): Promise<void>;
}

/** Live rewarded unit for Flip it! Release builds request this unit. */
const LIVE_REWARDED_UNIT_ID = 'ca-app-pub-5452343649745884/3854200587';

/** Debug builds use Google's test unit so development views are not counted as real traffic. */
const rewardedUnitId = __DEV__ ? TestIds.REWARDED : LIVE_REWARDED_UNIT_ID;

/** Live interstitial unit. Release builds request this unit after every fifth level. */
const LIVE_INTERSTITIAL_UNIT_ID = 'ca-app-pub-5452343649745884/1770962723';
const interstitialUnitId = __DEV__ ? TestIds.INTERSTITIAL : LIVE_INTERSTITIAL_UNIT_ID;

const INTERSTITIAL_EVERY = 5;

class LevelInterstitial {
  private ad: InterstitialAd | null = null;
  private loading: Promise<boolean> | null = null;
  private showing = false;

  /** Loads one interstitial. A shown or failed ad is discarded and a new one is requested. */
  preload(): Promise<boolean> {
    if (this.ad?.loaded) return Promise.resolve(true);
    if (this.loading) return this.loading;

    this.ad?.destroy();
    const ad = InterstitialAd.createForAdRequest(interstitialUnitId);
    this.ad = ad;

    this.loading = new Promise((resolve) => {
      let settled = false;
      const finish = (loaded: boolean) => {
        if (settled) return;
        settled = true;
        unsubscribeLoaded();
        unsubscribeError();
        this.loading = null;
        resolve(loaded);
      };
      const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => finish(true));
      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));
      ad.load();
    });

    return this.loading;
  }

  /**
   * Shows the preloaded ad. Resolves as soon as it closes, fails, or nothing is ready,
   * so the player is never stuck between levels.
   */
  async showIfLoaded(): Promise<void> {
    const ad = this.ad;
    if (this.showing || !ad?.loaded) return;

    this.showing = true;
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        unsubscribeClosed();
        unsubscribeError();
        this.showing = false;
        ad.removeAllListeners();
        ad.destroy();
        if (this.ad === ad) this.ad = null;
        this.preload();
        resolve();
      };
      const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, finish);
      ad.show().catch(finish);
    });
  }
}

const levelInterstitial = new LevelInterstitial();

class AdMobRewardedAds implements RewardedAdProvider {
  private ad: RewardedAd | null = null;
  private loading: Promise<boolean> | null = null;
  private prepared: Promise<void> | null = null;
  private showing = false;

  isAvailable(): boolean {
    return true;
  }

  prepare(): Promise<void> {
    if (!this.prepared) {
      this.prepared = this.start().catch((error: unknown) => {
        this.prepared = null;
        throw error;
      });
    }
    return this.prepared;
  }

  private async start(): Promise<void> {
    try {
      const info = await AdsConsent.requestInfoUpdate();
      if (info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED) {
        await AdsConsent.showForm();
      }
    } catch {
      // Consent lookup can fail offline. The ad request still goes out, and the SDK enforces its own limits.
    }
    await mobileAds().initialize();
    await Promise.all([this.preload(), levelInterstitial.preload()]);
  }

  /** Loads one rewarded ad. A shown or failed ad is discarded and a new one is requested. */
  private preload(): Promise<boolean> {
    if (this.ad?.loaded) return Promise.resolve(true);
    if (this.loading) return this.loading;

    this.ad?.destroy();
    const ad = RewardedAd.createForAdRequest(rewardedUnitId);
    this.ad = ad;

    this.loading = new Promise((resolve) => {
      let settled = false;
      const finish = (loaded: boolean) => {
        if (settled) return;
        settled = true;
        unsubscribeLoaded();
        unsubscribeError();
        this.loading = null;
        resolve(loaded);
      };
      const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => finish(true));
      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => finish(false));
      ad.load();
    });

    return this.loading;
  }

  async showRewarded(): Promise<boolean> {
    if (this.showing) return false;
    try {
      await this.prepare();
    } catch {
      return false;
    }

    const loaded = await this.preload();
    const ad = this.ad;
    if (!loaded || !ad?.loaded) return false;

    this.showing = true;
    return new Promise((resolve) => {
      let earned = false;
      let settled = false;
      const finish = (rewarded: boolean) => {
        if (settled) return;
        settled = true;
        unsubscribeReward();
        unsubscribeClosed();
        unsubscribeError();
        this.showing = false;
        ad.removeAllListeners();
        ad.destroy();
        if (this.ad === ad) this.ad = null;
        this.preload();
        resolve(rewarded);
      };
      const unsubscribeReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });
      const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned));
      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
        if (!earned) finish(false);
      });
      ad.show().catch(() => finish(false));
    });
  }
}

export const rewardedAds: RewardedAdProvider = new AdMobRewardedAds();

/** Starts consent and preloading. Safe to call more than once. */
export function prepareRewardedAds(): Promise<void> {
  return rewardedAds.prepare();
}

/**
 * Shows an interstitial after levels 5, 10, 15, and so on.
 * Other levels, and a missing ad, resolve without showing anything.
 */
export async function showLevelInterstitial(levelNumber: number): Promise<void> {
  if (!Number.isInteger(levelNumber) || levelNumber <= 0 || levelNumber % INTERSTITIAL_EVERY !== 0) return;
  try {
    await rewardedAds.prepare();
  } catch {
    return;
  }
  await levelInterstitial.showIfLoaded();
}
