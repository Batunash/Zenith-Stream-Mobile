import React from 'react';
import renderer, { act } from 'react-test-renderer';
import VideoPlayer from '../VideoPlayer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLibraryStore } from '../../../store/useLibraryStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const mockT = key => key;
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT })
}));

jest.mock('expo-keep-awake', () => ({
  useKeepAwake: jest.fn()
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20 })
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn(cb => {
    const cleanup = cb();
    if (global.mockFocusEffectCleanupStore) {
      global.mockFocusEffectCleanupStore.cleanup = cleanup;
    }
  })
}));

jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(),
  OrientationLock: {
    PORTRAIT_UP: 'PORTRAIT_UP',
    LANDSCAPE: 'LANDSCAPE'
  }
}));

jest.mock('expo-navigation-bar', () => ({
  setVisibilityAsync: jest.fn(),
  setBehaviorAsync: jest.fn()
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn()
}));

jest.mock('../../../store/useLibraryStore', () => ({
  useLibraryStore: jest.fn()
}));

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VideoView: () => <View testID="mock-video-view" />,
    useVideoPlayer: jest.fn((source, setup) => {
      const player = React.useMemo(() => {
        return {
          addListener: jest.fn((event, cb) => {
            if (!global.mockPlayerListeners) global.mockPlayerListeners = {};
            global.mockPlayerListeners[event] = cb;
            return { remove: jest.fn() };
          }),
          play: jest.fn(() => {
            if (global.mockPlayerPlayThrow) throw new Error("Play error");
          }),
          get currentTime() { return this._currentTime; },
          set currentTime(v) { 
            if (global.mockPlayerSeekThrow) throw new Error("Seek error");
            this._currentTime = v;
          },
          _currentTime: 0,
          duration: 100,
          playing: false,
        };
      }, []);

      React.useEffect(() => {
        if (setup) {
          if (global.mockPlayerSetupThrow) {
            setup({
              get loop() { throw new Error("Setup error"); },
              set loop(v) { throw new Error("Setup error"); }
            });
          } else {
            setup(player);
          }
        }
      }, [player, source]);

      return player;
    })
  };
});

describe('VideoPlayer', () => {
  let renderers = [];
  const mockNavigate = jest.fn();
  const mockGoBack = jest.fn();
  const mockMarkProgress = jest.fn();
  const mockMarkRecentlyWatched = jest.fn();
  const mockSetWatchProgress = jest.fn();
  const mockClearWatchProgress = jest.fn();

  const baseStore = {
    downloads: [],
    markProgress: mockMarkProgress,
    markRecentlyWatched: mockMarkRecentlyWatched,
    setWatchProgress: mockSetWatchProgress,
    clearWatchProgress: mockClearWatchProgress,
    watchProgress: {},
    hasHydrated: true,
    series: [
      {
        id: 's1',
        seasons: [
          { episodes: [{ id: 'e1', title: 'Ep 1' }] }
        ]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.mockPlayerListeners = {};
    useNavigation.mockReturnValue({ goBack: mockGoBack, navigate: mockNavigate });
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => '1000' }
      })
    );
    global.AbortController = jest.fn(() => ({
      abort: jest.fn(),
      signal: {}
    }));
  });

  afterEach(() => {
    renderers.forEach(r => {
      try { 
        act(() => { r.unmount(); }); 
      } catch (e) {}
    });
    renderers = [];
    jest.restoreAllMocks();
    delete global.mockPlayerListeners;
    delete global.mockPlayerSetupThrow;
    delete global.mockFocusEffectCleanupStore;
    delete global.mockPlayerSeekThrow;
    delete global.mockPlayerPlayThrow;
  });

  it('handles missing episodeId', async () => {
    useRoute.mockReturnValue({ params: {} });
    useLibraryStore.mockReturnValue(baseStore);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    const root = rootRenderer.root;

    // Should show error and a back button
    const errorText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'player.video_not_found'
    );
    expect(errorText.length).toBeGreaterThan(0);

    const backBtn = root.findByProps({ testID: 'error-back-button' });
    
    await act(async () => {
      backBtn.props.onPress();
    });

    // Wait for settimeout in handleBack
    await act(async () => {
      await new Promise(r => setTimeout(r, 150));
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('renders correctly for downloaded item', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    const root = rootRenderer.root;

    expect(root.findByProps({ testID: 'mock-video-view' })).toBeTruthy();
  });

  it('renders correctly for remote item (fetches server url)', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue(baseStore);
    AsyncStorage.getItem.mockResolvedValue('http://my-server.com');

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    const root = rootRenderer.root;

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://my-server.com/stream/e1',
      expect.objectContaining({ method: 'HEAD' })
    );

    expect(root.findByProps({ testID: 'mock-video-view' })).toBeTruthy();
  });

  it('handles remote item fetch failure (no url)', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue(baseStore);
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    const root = rootRenderer.root;

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const errorText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'player.connection_error'
    );
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('handles back button press', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    const root = rootRenderer.root;

    const backBtn = root.findByProps({ testID: 'video-back-button' });
    await act(async () => {
      backBtn.props.onPress();
    });

    await act(async () => {
      await new Promise(r => setTimeout(r, 150));
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('handles remote fetch failure (not ok)', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue(baseStore);
    AsyncStorage.getItem.mockResolvedValue('http://my-server.com');
    global.fetch.mockResolvedValueOnce({ ok: false });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    const errorText = rootRenderer.root.findAll(node => 
      node.type === 'Text' && node.props.children === 'player.video_not_found'
    );
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('handles remote fetch failure (invalid content length)', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue(baseStore);
    AsyncStorage.getItem.mockResolvedValue('http://my-server.com');
    global.fetch.mockResolvedValueOnce({ ok: true, headers: { get: () => '0' } });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    const errorText = rootRenderer.root.findAll(node => 
      node.type === 'Text' && node.props.children === 'player.video_not_found'
    );
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('handles fetch throw', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue(baseStore);
    AsyncStorage.getItem.mockResolvedValue('http://my-server.com');
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    const errorText = rootRenderer.root.findAll(node => 
      node.type === 'Text' && node.props.children === 'player.connection_error'
    );
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('triggers player events correctly', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    // Test statusChange to readyToPlay
    await act(async () => {
      if (global.mockPlayerListeners.statusChange) {
        global.mockPlayerListeners.statusChange({ status: 'readyToPlay' });
      }
    });

    // Test timeUpdate
    await act(async () => {
      if (global.mockPlayerListeners.timeUpdate) {
        global.mockPlayerListeners.timeUpdate({ currentTime: 50 }); // multiple of 5
      }
    });

    expect(mockSetWatchProgress).toHaveBeenCalled();
    expect(mockMarkProgress).toHaveBeenCalled();

    // Test playToEnd
    await act(async () => {
      if (global.mockPlayerListeners.playToEnd) {
        global.mockPlayerListeners.playToEnd();
      }
    });

    expect(mockClearWatchProgress).toHaveBeenCalled();
    expect(mockMarkRecentlyWatched).toHaveBeenCalled();

    await act(async () => {
      await new Promise(r => setTimeout(r, 150));
    });
  });

  it('handles status error in player', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    // Test statusChange to error
    await act(async () => {
      if (global.mockPlayerListeners.statusChange) {
        global.mockPlayerListeners.statusChange({ status: 'error', error: { message: 'Failed to play' } });
      }
    });

    const errorText = rootRenderer.root.findAll(node => 
      node.type === 'Text' && node.props.children === 'Failed to play'
    );
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('unmounts cleanly and saves progress if pos is within bounds', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });

    // Send timeUpdate to set currentTimeRef and durationRef
    await act(async () => {
      if (global.mockPlayerListeners.timeUpdate) {
        global.mockPlayerListeners.timeUpdate({ currentTime: 10 }); 
      }
    });

    // Unmount
    await act(async () => {
      rootRenderer.unmount();
    });

    // Should call setWatchProgress on unmount because currentTime > 2 and < duration-1
    expect(mockSetWatchProgress).toHaveBeenCalledWith('e1', 10, 100);
  });

  it('handles platform specific NavigationBar logic and seek error in statusChange', async () => {
    Platform.OS = 'android';
    global.mockPlayerSeekThrow = true;
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      watchProgress: { 'e1': { positionSec: 10 } },
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });
    
    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    // send readyToPlay
    await act(async () => {
      if (global.mockPlayerListeners.statusChange) {
        global.mockPlayerListeners.statusChange({ status: 'readyToPlay' });
      }
    });

    const NavigationBar = require('expo-navigation-bar');
    expect(NavigationBar.setVisibilityAsync).toHaveBeenCalled();
    
    const backBtn = rootRenderer.root.findByProps({ testID: 'video-back-button' });
    await act(async () => {
      backBtn.props.onPress();
    });
    
    await act(async () => {
      await new Promise(r => setTimeout(r, 150));
    });
    expect(mockGoBack).toHaveBeenCalled();
    Platform.OS = 'ios';
    delete global.mockPlayerSeekThrow;
  });

  it('handles playback play() throwing error in statusChange', async () => {
    global.mockPlayerPlayThrow = true;
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });
    
    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    // send readyToPlay
    await act(async () => {
      if (global.mockPlayerListeners.statusChange) {
        global.mockPlayerListeners.statusChange({ status: 'readyToPlay' });
      }
    });
    
    const errorText = rootRenderer.root.findAllByType('Text').some(t => t.props.children === 'player.playback_error' || t.props.children === 'Video oynatılamadı.');
    expect(errorText).toBeTruthy();
    delete global.mockPlayerPlayThrow;
  });

  it('triggers watchdog error after 15 seconds of playing', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    jest.useFakeTimers();
    const originalDateNow = Date.now;
    let timeNow = 1000;
    Date.now = jest.fn(() => timeNow);

    try {
      let rootRenderer;
      await act(async () => {
        rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
      });

      const { useVideoPlayer } = require('expo-video');
      const mockPlayer = useVideoPlayer.mock.results[useVideoPlayer.mock.results.length - 1].value;
      mockPlayer.playing = true;

      // advance watchdog timer
      await act(async () => {
        timeNow += 16000;
        jest.advanceTimersByTime(16000);
      });

      const errorText = rootRenderer.root.findAllByType('Text').some(t => t.props.children === 'player.timeout' || t.props.children === 'Video yüklenirken zaman aşımı oluştu.');
      expect(errorText).toBeTruthy();
      
      await act(async () => {
        rootRenderer.unmount();
      });
    } finally {
      Date.now = originalDateNow;
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  });

  it('handles save error on handleBack', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    mockSetWatchProgress.mockImplementationOnce(() => { throw new Error('Save progress failed'); });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    await act(async () => {
      if (global.mockPlayerListeners.timeUpdate) {
        global.mockPlayerListeners.timeUpdate({ currentTime: 10 }); 
      }
    });

    const backBtn = rootRenderer.root.findByProps({ testID: 'video-back-button' });
    await act(async () => {
      backBtn.props.onPress();
    });

    await act(async () => {
      await new Promise(r => setTimeout(r, 150));
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('handles ScreenOrientation lock error on handleBack', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    const ScreenOrientation = require('expo-screen-orientation');
    ScreenOrientation.lockAsync.mockImplementationOnce(() => Promise.resolve())
                               .mockImplementationOnce(async (val) => {
      if (val === 'PORTRAIT_UP') throw new Error('Lock error');
    });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });

    const backBtn = rootRenderer.root.findByProps({ testID: 'video-back-button' });
    await act(async () => {
      backBtn.props.onPress();
    });

    await act(async () => {
      await new Promise(r => setTimeout(r, 150));
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('handles AsyncStorage throw in loadServerUrl', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue(baseStore);
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Async error'));

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    const errorText = rootRenderer.root.findAllByType('Text').some(t => t.props.children === 'player.playback_error' || t.props.children === 'Beklenmedik bir hata oluştu.');
    expect(errorText).toBeTruthy();
  });

  it('triggers video_not_found error when isReady but videoUri and error are missing', async () => {
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: null }] // isReady will be true but videoUri null
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    const errorText = rootRenderer.root.findAllByType('Text').some(t => t.props.children === 'player.video_not_found' || t.props.children === 'Video kaynağı oluşturulamadı.');
    expect(errorText).toBeTruthy();
  });

  it('handles setup error in useVideoPlayer', async () => {
    global.mockPlayerSetupThrow = true;
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    const errorText = rootRenderer.root.findAllByType('Text').some(t => t.props.children === 'player.playback_error' || t.props.children === 'Video başlatılamadı.');
    expect(errorText).toBeTruthy();
    delete global.mockPlayerSetupThrow;
  });

  it('runs focus effect cleanup for android', async () => {
    global.mockFocusEffectCleanupStore = {};
    Platform.OS = 'android';
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }]
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    const NavigationBar = require('expo-navigation-bar');
    NavigationBar.setVisibilityAsync.mockClear();

    if (global.mockFocusEffectCleanupStore.cleanup) {
      await act(async () => {
        global.mockFocusEffectCleanupStore.cleanup();
      });
    }

    expect(NavigationBar.setVisibilityAsync).toHaveBeenCalledWith('visible');
    
    Platform.OS = 'ios';
    delete global.mockFocusEffectCleanupStore;
  });

  it('fallback seek catches error in timeUpdate', async () => {
    global.mockPlayerSeekThrow = true;
    useRoute.mockReturnValue({ params: { serieId: 's1', episodeId: 'e1' } });
    useLibraryStore.mockReturnValue({
      ...baseStore,
      downloads: [{ serieId: 's1', episodeId: 'e1', localPath: 'file:///local.mp4' }],
      watchProgress: { 'e1': { positionSec: 50, durationSec: 100 } }
    });

    let rootRenderer;
    await act(async () => {
      rootRenderer = renderer.create(<VideoPlayer />);
      renderers.push(rootRenderer);
    });
    
    await act(async () => {
      if (global.mockPlayerListeners.timeUpdate) {
        global.mockPlayerListeners.timeUpdate({ currentTime: 0 }); // First time update triggers fallback seek
      }
    });

    // We shouldn't crash.
    const backBtn = rootRenderer.root.findByProps({ testID: 'video-back-button' });
    expect(backBtn).toBeTruthy();
    
    delete global.mockPlayerSeekThrow;
  });
});
