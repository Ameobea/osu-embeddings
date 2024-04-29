import { get, writable } from 'svelte/store';
import { logError } from './sentry';
import { delay } from './util';

interface BeatmapData {
  beatmapId: number;
  modsBitmask: number;
  position: [number, number];
  averagePp: number;
  starRating: number;
  beatmapName: string;
  difficultyName: string;
  mapperName: string;
  releaseYear: number;
  lengthSeconds: number;
  bpm: number;
  AR: number;
  CS: number;
  OD: number;
  aimDifficulty: number;
  speedDifficulty: number;
}

export type Corpus = BeatmapData[];

const parseCorpus = (buffer: ArrayBuffer): BeatmapData[] => {
  const dataView = new DataView(buffer);

  // read item count first
  const numItems = dataView.getUint32(0, true);
  let rowDataOffset = 4;

  const beatmaps: BeatmapData[] = [];
  const stringStartOffset = numItems * 56 + 4;
  let stringOffset = stringStartOffset;

  const textDecoder = new TextDecoder();

  for (let i = 0; i < numItems; i++) {
    const beatmapId = dataView.getInt32(rowDataOffset, true);
    const modsBitmask = dataView.getUint32(rowDataOffset + 4, true);
    const x = dataView.getFloat32(rowDataOffset + 8, true);
    const y = dataView.getFloat32(rowDataOffset + 12, true);
    const averagePp = dataView.getFloat32(rowDataOffset + 16, true);
    const starRating = dataView.getFloat32(rowDataOffset + 20, true);
    const beatmapNameLength = dataView.getUint16(rowDataOffset + 24, true);
    const difficultyNameLength = dataView.getUint16(rowDataOffset + 26, true);
    const mapperNameLength = dataView.getUint16(rowDataOffset + 28, true);
    const releaseYear = dataView.getUint16(rowDataOffset + 30, true);
    const lengthSeconds = dataView.getUint16(rowDataOffset + 32, true);
    const bpm = dataView.getUint16(rowDataOffset + 34, true);
    const AR = dataView.getFloat32(rowDataOffset + 36, true);
    const CS = dataView.getFloat32(rowDataOffset + 40, true);
    const OD = dataView.getFloat32(rowDataOffset + 44, true);
    const aimDifficulty = dataView.getFloat32(rowDataOffset + 48, true);
    const speedDifficulty = dataView.getFloat32(rowDataOffset + 52, true);

    rowDataOffset += 56;

    const beatmapName = textDecoder.decode(new Uint8Array(buffer, stringOffset, beatmapNameLength));
    stringOffset += beatmapNameLength;
    const difficultyName = textDecoder.decode(new Uint8Array(buffer, stringOffset, difficultyNameLength));
    stringOffset += difficultyNameLength;
    const mapperName = textDecoder.decode(new Uint8Array(buffer, stringOffset, mapperNameLength));
    stringOffset += mapperNameLength;

    beatmaps.push({
      beatmapId,
      modsBitmask,
      position: [x, y],
      averagePp,
      starRating,
      beatmapName,
      difficultyName,
      mapperName,
      releaseYear,
      lengthSeconds,
      bpm,
      AR,
      CS,
      OD,
      aimDifficulty,
      speedDifficulty,
    });
  }

  return beatmaps;
};

type FetchedCorpus =
  | { status: 'notFetched' }
  | { status: 'loading' }
  | { status: 'loaded'; data: BeatmapData[] }
  | { status: 'error'; error: Error };

export const GlobalCorpus = writable<FetchedCorpus>({ status: 'notFetched' });

export const loadCorpus = async (url: string) => {
  if (get(GlobalCorpus).status !== 'notFetched') {
    return;
  }

  let i = 0;

  for (;;) {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const corpus = parseCorpus(buffer);
      GlobalCorpus.set({ status: 'loaded', data: corpus });
      return;
    } catch (err) {
      logError('Failed to load corpus', err);
      i += 1;
      if (i >= 3) {
        GlobalCorpus.set({ status: 'error', error: err as Error });
        throw err;
      }

      await delay(1000);
    }
  }
};
