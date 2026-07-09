import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../backgroundService';

// Mock dependencies
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  unregisterTaskAsync: jest.fn(),
  BackgroundFetchResult: {
    NewData: 'NewData',
    Failed: 'Failed',
    NoData: 'NoData',
  },
}), { virtual: true });

jest.mock('expo-task-manager', () => {
  let registeredTasks = {};
  let taskCallbacks = {};
  
  return {
    defineTask: jest.fn((taskName, callback) => {
      taskCallbacks[taskName] = callback;
    }),
    isTaskRegisteredAsync: jest.fn(async (taskName) => {
      return !!registeredTasks[taskName];
    }),
    _setTaskRegistered: (taskName, isRegistered) => {
      registeredTasks[taskName] = isRegistered;
    },
    _getTaskCallback: (taskName) => taskCallbacks[taskName],
    _reset: () => {
      registeredTasks = {};
      taskCallbacks = {};
    }
  };
}, { virtual: true });

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

describe('backgroundService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TaskManager._reset();
    
    // Re-import module to trigger defineTask
    jest.isolateModules(() => {
      require('../backgroundService');
    });
  });

  describe('BACKGROUND_FETCH_TASK', () => {
    it('returns NewData if successful and serverUrl exists', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('http://example.com');
      
      const taskCallback = TaskManager._getTaskCallback('background-fetch-task');
      expect(taskCallback).toBeDefined();
      
      const result = await taskCallback();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('server-url');
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NewData);
    });

    it('returns NewData if successful but serverUrl is missing', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      
      const taskCallback = TaskManager._getTaskCallback('background-fetch-task');
      const result = await taskCallback();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('server-url');
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.NewData);
    });

    it('returns Failed if an error occurs', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('AsyncStorage error'));
      
      const taskCallback = TaskManager._getTaskCallback('background-fetch-task');
      const result = await taskCallback();
      
      expect(result).toBe(BackgroundFetch.BackgroundFetchResult.Failed);
    });
  });

  describe('registerBackgroundFetchAsync', () => {
    it('registers task if not already registered', async () => {
      TaskManager._setTaskRegistered('background-fetch-task', false);
      
      await registerBackgroundFetchAsync();
      
      expect(TaskManager.isTaskRegisteredAsync).toHaveBeenCalledWith('background-fetch-task');
      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
        'background-fetch-task',
        expect.any(Object)
      );
    });

    it('does not register task if already registered', async () => {
      TaskManager._setTaskRegistered('background-fetch-task', true);
      
      await registerBackgroundFetchAsync();
      
      expect(TaskManager.isTaskRegisteredAsync).toHaveBeenCalledWith('background-fetch-task');
      expect(BackgroundFetch.registerTaskAsync).not.toHaveBeenCalled();
    });

    it('handles errors during registration', async () => {
      TaskManager.isTaskRegisteredAsync.mockRejectedValueOnce(new Error('Task error'));
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await registerBackgroundFetchAsync();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[BackgroundFetch] Failed to register task:',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('unregisterBackgroundFetchAsync', () => {
    it('unregisters task if already registered', async () => {
      TaskManager._setTaskRegistered('background-fetch-task', true);
      
      await unregisterBackgroundFetchAsync();
      
      expect(TaskManager.isTaskRegisteredAsync).toHaveBeenCalledWith('background-fetch-task');
      expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalledWith('background-fetch-task');
    });

    it('does not unregister task if not registered', async () => {
      TaskManager._setTaskRegistered('background-fetch-task', false);
      
      await unregisterBackgroundFetchAsync();
      
      expect(TaskManager.isTaskRegisteredAsync).toHaveBeenCalledWith('background-fetch-task');
      expect(BackgroundFetch.unregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('handles errors during unregistration', async () => {
      TaskManager.isTaskRegisteredAsync.mockRejectedValueOnce(new Error('Task error'));
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await unregisterBackgroundFetchAsync();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[BackgroundFetch] Failed to unregister task:',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });
  });
});
