import { downloadEpisodeService, removeEpisodeService, downloadImageService } from '../downloadService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { File } from 'expo-file-system';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('downloadService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadEpisodeService', () => {
    it('throws error if server-url is not set', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null); // server-url

      await expect(downloadEpisodeService('serie1', 'ep1')).rejects.toThrow('URL Yok');
      expect(Alert.alert).toHaveBeenCalledWith('Debug Hatası', 'Sunucu URL yok!');
    });

    it('throws error if token is not set', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce('http://server.url') // server-url
        .mockResolvedValueOnce(null); // auth-storage

      await expect(downloadEpisodeService('serie1', 'ep1')).rejects.toThrow('Token Yok');
      expect(Alert.alert).toHaveBeenCalledWith('Debug Hatası', 'Token yok!');
    });

    it('downloads file successfully', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce('http://server.url/') // server-url with trailing slash
        .mockResolvedValueOnce(JSON.stringify({ state: { token: 'my-token' } })); // auth-storage

      const resultUri = await downloadEpisodeService('serie1', 'ep1');

      expect(resultUri).toBe('file:///document-directory/video_serie1_ep1.mp4');
      expect(File.downloadFileAsync).toHaveBeenCalledWith(
        'http://server.url/download/ep1',
        expect.any(Object),
        {
          headers: {
            Authorization: 'Bearer my-token',
          },
        }
      );
      expect(Alert.alert).toHaveBeenCalledWith('Başarılı', 'Dosya başarıyla indi ve kaydedildi.');
    });

    it('throws error if download fails (resultFile.exists is false)', async () => {
      AsyncStorage.getItem
        .mockResolvedValueOnce('http://server.url') // server-url
        .mockResolvedValueOnce(JSON.stringify({ state: { token: 'my-token' } })); // auth-storage

      File.downloadFileAsync.mockResolvedValueOnce({ exists: false });

      await expect(downloadEpisodeService('serie1', 'ep1')).rejects.toThrow('Dosya oluşturulamadı (Exists: false)');
    });
  });

  describe('removeEpisodeService', () => {
    it('returns early if localPath is empty', async () => {
      await removeEpisodeService(null);
      // Nothing should happen
    });

    it('deletes file if it exists', async () => {
      const deleteSpy = jest.fn();
      jest.spyOn(File.prototype, 'delete').mockImplementation(deleteSpy);
      // We know MockFile sets exists = true by default

      await removeEpisodeService('file:///some-path');

      expect(deleteSpy).toHaveBeenCalled();
    });

    it('handles non-existent files', async () => {
      const deleteSpy = jest.fn();
      jest.spyOn(File.prototype, 'delete').mockImplementation(deleteSpy);
      
      // We need to override exists temporarily
      jest.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(false);

      await removeEpisodeService('file:///some-path');

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('catches and logs errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(File.prototype, 'delete').mockImplementation(() => {
        throw new Error('Test Delete Error');
      });

      await removeEpisodeService('file:///some-path');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Servis Silme Hatası:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('downloadImageService', () => {
    it('returns null if remoteUrl is missing', async () => {
      const result = await downloadImageService(null, 'serie1');
      expect(result).toBeNull();
    });

    it('returns existing file if it already exists', async () => {
      jest.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(true);
      
      const result = await downloadImageService('http://url.com/poster.png', 'serie1');
      expect(result).toBe('file:///document-directory/poster_serie1.png');
      expect(File.downloadFileAsync).not.toHaveBeenCalled();
    });

    it('downloads and returns new file uri', async () => {
      jest.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(false);
      File.downloadFileAsync.mockResolvedValueOnce({ exists: true, uri: 'file:///document-directory/poster_serie1.jpg' });

      const result = await downloadImageService('http://url.com/poster.jpg?query=1', 'serie1');
      expect(result).toBe('file:///document-directory/poster_serie1.jpg');
      expect(File.downloadFileAsync).toHaveBeenCalled();
    });

    it('returns null if download fails', async () => {
      jest.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(false);
      File.downloadFileAsync.mockResolvedValueOnce({ exists: false });

      const result = await downloadImageService('http://url.com/poster.jpg', 'serie1');
      expect(result).toBeNull();
    });

    it('catches and logs errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(false);
      File.downloadFileAsync.mockRejectedValueOnce(new Error('Network Error'));

      const result = await downloadImageService('http://url.com/poster.jpg', 'serie1');
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Poster indirme hatası:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('falls back to jpg extension when not found in url', async () => {
      jest.spyOn(File.prototype, 'exists', 'get').mockReturnValueOnce(false);
      File.downloadFileAsync.mockResolvedValueOnce({ exists: true, uri: 'file:///document-directory/poster_serie1.jpg' });

      // Url ending with dot so pop() returns empty string
      const result = await downloadImageService('http://url.com/poster.', 'serie1');
      expect(result).toBe('file:///document-directory/poster_serie1.jpg');
    });
  });
});
