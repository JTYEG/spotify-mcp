import { handleSpotifyRequest } from './utils.js';
import { z } from 'zod';
import type { SpotifyHandlerExtra, tool } from './types.js';

const playMusic: tool<{
  uri: z.ZodOptional<z.ZodString>;
  type: z.ZodOptional<z.ZodEnum<['track', 'album', 'artist', 'playlist']>>;
  id: z.ZodOptional<z.ZodString>;
  deviceId: z.ZodOptional<z.ZodString>;
}> = {
  name: 'playMusic',
  description: 'Start playing a Spotify track, album, artist, or playlist',
  schema: {
    uri: z
      .string()
      .optional()
      .describe('The Spotify URI to play (overrides type and id)'),
    type: z
      .enum(['track', 'album', 'artist', 'playlist'])
      .optional()
      .describe('The type of item to play'),
    id: z.string().optional().describe('The Spotify ID of the item to play'),
    deviceId: z
      .string()
      .optional()
      .describe('The Spotify device ID to play on'),
  },
  handler: async (args, extra: SpotifyHandlerExtra) => {
    const { uri, type, id, deviceId } = args;

    if (!uri && (!type || !id)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Must provide either a URI or both a type and ID',
            isError: true,
          },
        ],
      };
    }

    let spotifyUri = uri;
    if (!spotifyUri && type && id) {
      spotifyUri = `spotify:${type}:${id}`;
    }

    await handleSpotifyRequest(async (spotifyApi) => {
      const device = deviceId || '';

      if (!spotifyUri) {
        await spotifyApi.player.startResumePlayback(device);
        return;
      }

      if (type === 'track') {
        await spotifyApi.player.startResumePlayback(device, undefined, [
          spotifyUri,
        ]);
      } else {
        await spotifyApi.player.startResumePlayback(device, spotifyUri);
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: `Started playing ${type || 'music'} ${id ? `(ID: ${id})` : ''}`,
        },
      ],
    };
  },
};

const playbackAction: tool<{
  action: z.ZodEnum<['pause', 'skipToNext', 'skipToPrevious', 'resume']>;
  deviceId: z.ZodOptional<z.ZodString>;
}> = {
  name: 'playbackAction',
  description:
    'Perform a playback action (pause, resume, skip to next, skip to previous)',
  schema: {
    action: z
      .enum(['pause', 'skipToNext', 'skipToPrevious', 'resume'])
      .describe('The playback action to perform'),
    deviceId: z
      .string()
      .optional()
      .describe('The Spotify device ID to perform the action on'),
  },
  handler: async (args, extra: SpotifyHandlerExtra) => {
    const { action, deviceId } = args;

    let successMessage = '';

    await handleSpotifyRequest(async (spotifyApi) => {
      const device = deviceId || '';
      switch (action) {
        case 'pause':
          await spotifyApi.player.pausePlayback(device);
          successMessage = 'Playback paused';
          break;
        case 'resume':
          await spotifyApi.player.startResumePlayback(device);
          successMessage = 'Playback resumed';
          break;
        case 'skipToNext':
          await spotifyApi.player.skipToNext(device);
          successMessage = 'Skipped to next track';
          break;
        case 'skipToPrevious':
          await spotifyApi.player.skipToPrevious(device);
          successMessage = 'Skipped to previous track';
          break;
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: successMessage,
        },
      ],
    };
  },
};

export const playTools = [playMusic, playbackAction];
