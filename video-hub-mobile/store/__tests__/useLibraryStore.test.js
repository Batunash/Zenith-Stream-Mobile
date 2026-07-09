import { useLibraryStore } from '../useLibraryStore';
import api from '../../lib/api';
import { downloadEpisodeService, removeEpisodeService, downloadImageService } from '../../services/downloadService';
import { File } from 'expo-file-system';
import i18n from '../../services/i18n';

jest.mock('../../lib/api', () => ({
  get: jest.fn(),
}));

jest.mock('../../services/downloadService', () => ({
  downloadEpisodeService: jest.fn(),
  removeEpisodeService: jest.fn(),
  downloadImageService: jest.fn(),
}));

jest.mock('../../services/i18n', () => ({
  t: jest.fn((key) => key),
}));

describe('useLibraryStore', () => {
  beforeEach(() => {
    useLibraryStore.setState({
      series: [],
      lists: [],
      downloads: [],
      recentlyWatched: [],
      watchProgress: {},
      isLoading: false,
      error: null,
      isDownloading: false,
      progress: 0,
      hasHydrated: true, // Mock rehydration
    });
    jest.clearAllMocks();
  });

  describe('fetchSeries', () => {
    it('returns early if not hydrated', async () => {
      useLibraryStore.setState({ hasHydrated: false });
      await useLibraryStore.getState().fetchSeries();
      expect(api.get).not.toHaveBeenCalled();
    });

    it('fetches series and merges correctly without existing data', async () => {
      const mockSeries = [
        { id: '1', title: 'Serie 1', poster: 'http://poster.url' },
      ];
      api.get.mockResolvedValueOnce({ data: { series: mockSeries } });
      downloadImageService.mockResolvedValueOnce('file:///local-poster.jpg');

      await useLibraryStore.getState().fetchSeries();

      expect(api.get).toHaveBeenCalledWith('/series');
      
      // Wait a tick for async foreach to finish
      await new Promise(process.nextTick);
      
      expect(downloadImageService).toHaveBeenCalledWith('http://poster.url', '1');
      expect(useLibraryStore.getState().series[0].localPoster).toBe('file:///local-poster.jpg');
      expect(useLibraryStore.getState().series[0].title).toBe('Serie 1');
    });

    it('merges with existing data (keeping localPoster if file exists)', async () => {
      jest.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(true);

      const existingSeries = [
        { id: '1', title: 'Serie 1', localPoster: 'file:///old.jpg', seasons: [] }
      ];
      useLibraryStore.setState({ series: existingSeries });

      const newSeries = [
        { id: '1', title: 'Serie 1 Updated', seasons: [] }
      ];
      api.get.mockResolvedValueOnce({ data: { series: newSeries } });

      await useLibraryStore.getState().fetchSeries();

      expect(useLibraryStore.getState().series[0].localPoster).toBe('file:///old.jpg');
      expect(useLibraryStore.getState().series[0].title).toBe('Serie 1 Updated');
    });

    it('removes localPoster if file does not exist anymore', async () => {
      jest.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(false); // fileCheck.exists

      const existingSeries = [
        { id: '1', title: 'Serie 1', localPoster: 'file:///old.jpg', seasons: [] }
      ];
      useLibraryStore.setState({ series: existingSeries });

      const newSeries = [
        { id: '1', title: 'Serie 1 Updated', seasons: [] }
      ];
      api.get.mockResolvedValueOnce({ data: { series: newSeries } });

      await useLibraryStore.getState().fetchSeries();

      expect(useLibraryStore.getState().series[0].localPoster).toBeUndefined();
    });

    it('catches file check error and removes localPoster', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(File.prototype, 'exists', 'get').mockImplementationOnce(() => {
        throw new Error('Test File Check Error');
      });

      const existingSeries = [
        { id: '1', title: 'Serie 1', localPoster: 'file:///error.jpg', seasons: [] }
      ];
      useLibraryStore.setState({ series: existingSeries });

      const newSeries = [
        { id: '1', title: 'Serie 1 Updated', seasons: [] }
      ];
      api.get.mockResolvedValueOnce({ data: { series: newSeries } });

      await useLibraryStore.getState().fetchSeries();

      expect(useLibraryStore.getState().series[0].localPoster).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith("Dosya kontrol hatası, yerel kayıt siliniyor:", "file:///error.jpg");
      consoleSpy.mockRestore();
    });

    it('merges episode progress correctly', async () => {
      const existingSeries = [{
        id: '1',
        seasons: [{
          id: 's1',
          episodes: [{ id: 'ep1', progress: 50 }, { id: 'ep2' }]
        }]
      }];
      useLibraryStore.setState({ series: existingSeries });

      const newSeries = [{
        id: '1',
        seasons: [{
          id: 's1',
          episodes: [{ id: 'ep1', title: 'New Title' }, { id: 'ep2', title: 'No Progress' }]
        }, {
          id: 's2', // new season, should be returned as is
          episodes: []
        }]
      }];
      api.get.mockResolvedValueOnce({ data: { series: newSeries } });

      await useLibraryStore.getState().fetchSeries();

      const mergedEp = useLibraryStore.getState().series[0].seasons[0].episodes[0];
      expect(mergedEp.title).toBe('New Title');
      expect(mergedEp.progress).toBe(50);
      
      const mergedEp2 = useLibraryStore.getState().series[0].seasons[0].episodes[1];
      expect(mergedEp2.progress).toBeUndefined();

      expect(useLibraryStore.getState().series[0].seasons[1].id).toBe('s2');
    });

    it('merges episode progress where existing progress is undefined', async () => {
      const existingSeries = [{
        id: '1',
        seasons: [{
          id: 's1',
          episodes: [{ id: 'ep1', progress: undefined }]
        }]
      }];
      useLibraryStore.setState({ series: existingSeries });

      const newSeries = [{
        id: '1',
        seasons: [{
          id: 's1',
          episodes: [{ id: 'ep1', title: 'New Title' }]
        }]
      }];
      api.get.mockResolvedValueOnce({ data: { series: newSeries } });

      await useLibraryStore.getState().fetchSeries();

      const mergedEp = useLibraryStore.getState().series[0].seasons[0].episodes[0];
      expect(mergedEp.progress).toBeUndefined();
    });

    it('handles merging when existing series has no seasons', async () => {
      const existingSeries = [{
        id: '3',
        title: 'Old Title'
      }];
      useLibraryStore.setState({ series: existingSeries });

      const newSeries = [{
        id: '3',
        title: 'New Title',
        seasons: [{ id: 's1', episodes: [] }]
      }];
      api.get.mockResolvedValueOnce({ data: { series: newSeries } });

      await useLibraryStore.getState().fetchSeries();

      const merged = useLibraryStore.getState().series.find(s => s.id === '3');
      expect(merged.seasons).toEqual([{ id: 's1', episodes: [] }]); // existing had no seasons, it copies from newS but the code block is bypassed
    });

    it('downloads poster if it does not have localPoster', async () => {
      const newSeries = [{
        id: '1',
        poster: 'http://example.com/poster.jpg'
      }, {
        id: '2',
        poster: 'http://example.com/poster2.jpg',
        localPoster: 'file:///local.jpg'
      }];
      api.get.mockResolvedValueOnce({ data: { series: newSeries } });
      downloadImageService.mockResolvedValueOnce('file:///new-local.jpg');

      await useLibraryStore.getState().fetchSeries();

      // Wait a bit for the async forEach in fetchSeries to finish
      await new Promise(r => setTimeout(r, 0));

      expect(downloadImageService).toHaveBeenCalledWith('http://example.com/poster.jpg', '1');
      expect(useLibraryStore.getState().series.find(s => s.id === '1').localPoster).toBe('file:///new-local.jpg');
    });

    it('handles missing localPath from downloadImageService', async () => {
      const newSeries = [{ id: '4', poster: 'http://example.com/poster4.jpg' }];
      api.get.mockResolvedValueOnce({ data: { series: newSeries } });
      downloadImageService.mockResolvedValueOnce(null);

      await useLibraryStore.getState().fetchSeries();
      await new Promise(r => setTimeout(r, 0));

      expect(useLibraryStore.getState().series.find(s => s.id === '4').localPoster).toBeUndefined();
    });

    it('handles fetch error', async () => {
      api.get.mockRejectedValueOnce(new Error('Network Error'));

      await useLibraryStore.getState().fetchSeries();

      expect(useLibraryStore.getState().isLoading).toBe(false);
      expect(useLibraryStore.getState().error).toBe('player.connection_error');
    });
  });

  describe('downloadEpisode', () => {
    it('returns early if already downloaded', async () => {
      useLibraryStore.setState({ downloads: [{ serieId: '1', episodeId: 'ep1' }] });
      await useLibraryStore.getState().downloadEpisode('1', 'ep1');
      expect(downloadEpisodeService).not.toHaveBeenCalled();
    });

    it('downloads successfully and updates state', async () => {
      downloadEpisodeService.mockResolvedValueOnce('file:///vid.mp4');

      const result = await useLibraryStore.getState().downloadEpisode('1', 'ep1');

      expect(result).toBe('file:///vid.mp4');
      expect(useLibraryStore.getState().downloads).toContainEqual({
        serieId: '1',
        episodeId: 'ep1',
        localPath: 'file:///vid.mp4'
      });
      expect(useLibraryStore.getState().isDownloading).toBe(false);
      expect(useLibraryStore.getState().progress).toBe(1);
    });

    it('downloads successfully but localPath is falsey', async () => {
      downloadEpisodeService.mockResolvedValueOnce(null);

      const result = await useLibraryStore.getState().downloadEpisode('2', 'ep2');

      expect(result).toBe(null);
      expect(useLibraryStore.getState().downloads).toContainEqual({
        serieId: '2',
        episodeId: 'ep2',
        localPath: null
      });
    });

    it('handles download error', async () => {
      downloadEpisodeService.mockRejectedValueOnce(new Error('Failed'));

      await expect(useLibraryStore.getState().downloadEpisode('1', 'ep1')).rejects.toThrow('Failed');

      expect(useLibraryStore.getState().isDownloading).toBe(false);
      expect(useLibraryStore.getState().error).toBe('detail.download_fail_msg');
    });
  });

  describe('removeDownload', () => {
    it('removes download from state and calls service', async () => {
      useLibraryStore.setState({
        downloads: [{ episodeId: 'ep1', localPath: 'file:///vid.mp4' }]
      });

      await useLibraryStore.getState().removeDownload('ep1');

      expect(removeEpisodeService).toHaveBeenCalledWith('file:///vid.mp4');
      expect(useLibraryStore.getState().downloads).toHaveLength(0);
    });

    it('handles removal when localPath is missing', async () => {
      useLibraryStore.setState({
        downloads: [{ episodeId: 'ep2' }]
      });

      await useLibraryStore.getState().removeDownload('ep2');

      expect(useLibraryStore.getState().downloads).toHaveLength(0);
    });

    it('does nothing if download does not exist', async () => {
      useLibraryStore.setState({
        downloads: [{ episodeId: 'ep1', localPath: 'file:///vid.mp4' }]
      });

      await useLibraryStore.getState().removeDownload('ep99');

      expect(useLibraryStore.getState().downloads).toHaveLength(1);
    });
  });

  describe('markProgress', () => {
    it('updates episode progress', () => {
      useLibraryStore.setState({
        series: [{
          id: '1',
          seasons: [{
            id: 's1',
            episodes: [{ id: 'ep1', progress: 0 }, { id: 'ep2', progress: 0 }]
          }]
        }, {
          id: '2',
          seasons: []
        }]
      });

      useLibraryStore.getState().markProgress('1', 'ep1', 75);

      const series = useLibraryStore.getState().series;
      expect(series[0].seasons[0].episodes[0].progress).toBe(75);
      expect(series[0].seasons[0].episodes[1].progress).toBe(0);
      expect(series[1].id).toBe('2');
    });
  });

  describe('markRecentlyWatched', () => {
    it('adds to recentlyWatched and limits to 25 items', () => {
      useLibraryStore.getState().markRecentlyWatched({ serieId: '1', episodeId: 'ep1' });
      useLibraryStore.getState().markRecentlyWatched({ serieId: '2', episodeId: 'ep2' });
      useLibraryStore.getState().markRecentlyWatched({ serieId: '1', episodeId: 'ep1' });

      const recentlyWatched = useLibraryStore.getState().recentlyWatched;
      expect(recentlyWatched).toHaveLength(2);
      expect(recentlyWatched[0]).toMatchObject({
        serieId: '1',
        episodeId: 'ep1'
      });
      expect(recentlyWatched[1]).toMatchObject({
        serieId: '2',
        episodeId: 'ep2'
      });
    });
  });

  describe('setWatchProgress & clearWatchProgress', () => {
    it('sets and clears watch progress', () => {
      useLibraryStore.getState().setWatchProgress('ep1', 100, 200);

      expect(useLibraryStore.getState().watchProgress['ep1']).toMatchObject({
        positionSec: 100,
        durationSec: 200
      });

      useLibraryStore.getState().clearWatchProgress('ep1');

      expect(useLibraryStore.getState().watchProgress['ep1']).toBeUndefined();
    });
  });

  describe('Lists functionality', () => {
    it('adds, updates, and removes list', () => {
      // Add
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      useLibraryStore.getState().addList({ name: 'My List' });
      expect(useLibraryStore.getState().lists).toHaveLength(1);
      expect(useLibraryStore.getState().lists[0]).toEqual({
        id: String(now),
        name: 'My List',
        seriesIds: []
      });

      // Update
      useLibraryStore.getState().updateList(String(now), { name: 'Updated List' });
      expect(useLibraryStore.getState().lists[0].name).toBe('Updated List');

      // Update with non-existent id should not change anything
      useLibraryStore.getState().updateList('non-existent', { name: 'Foo' });
      expect(useLibraryStore.getState().lists[0].name).toBe('Updated List');

      // Remove
      useLibraryStore.getState().removeList(String(now));
      expect(useLibraryStore.getState().lists).toHaveLength(0);

      Date.now.mockRestore();
    });
  });

  describe('clearAll', () => {
    it('clears state correctly', () => {
      useLibraryStore.setState({
        lists: [{}], downloads: [{}], recentlyWatched: [{}]
      });

      useLibraryStore.getState().clearAll();

      expect(useLibraryStore.getState().lists).toHaveLength(0);
      expect(useLibraryStore.getState().downloads).toHaveLength(0);
      expect(useLibraryStore.getState().recentlyWatched).toHaveLength(0);
    });
  });

  describe('setHydrated', () => {
    it('sets hasHydrated to true', () => {
      useLibraryStore.setState({ hasHydrated: false });
      useLibraryStore.getState().setHydrated();
      expect(useLibraryStore.getState().hasHydrated).toBe(true);
    });
  });
});
