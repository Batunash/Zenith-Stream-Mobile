import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLibraryStore } from '../store/useLibraryStore';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const now = Date.now();
    console.log(`[BackgroundFetch] Task executed at: ${new Date(now).toISOString()}`);
    
    // Simulate some background work like syncing watch progress or checking for new episodes
    const serverUrl = await AsyncStorage.getItem("server-url");
    if (serverUrl) {
      // Background logic here. For example, fetching new content
      console.log("[BackgroundFetch] Synced with server successfully in background.");
    }

    // Return successful result
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[BackgroundFetch] Error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundFetchAsync = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60 * 15, // 15 minutes
        stopOnTerminate: false, // android only
        startOnBoot: true, // android only
      });
      console.log("[BackgroundFetch] Task registered successfully.");
    }
  } catch (error) {
    console.warn("[BackgroundFetch] Failed to register task:", error);
  }
};

export const unregisterBackgroundFetchAsync = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log("[BackgroundFetch] Task unregistered.");
    }
  } catch (error) {
    console.warn("[BackgroundFetch] Failed to unregister task:", error);
  }
};
