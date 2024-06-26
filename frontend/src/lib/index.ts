// place files you want to import through the `$lib` alias in this folder.

import type { NumberValue } from 'd3-scale';
import type { ScoreMetadata } from '../corpus';
import { UnreachableError } from '../util';
import { sixCategoryColorMap } from '../viz/colormap';

export enum ColorMode {
  StarRating,
  AveragePP,
  ReleaseYear,
  AimSpeedRatio,
  Mods,
  Length,
}

interface ColorModeConfig {
  explicitMinVal?: number;
  explicitMaxVal?: number;
  getValue: (d: ScoreMetadata) => number;
  title: string;
  colorMapper?: (value: number) => [number, number, number];
  tickCount?: number;
  tickFormat?: (domainValue: NumberValue, index: number) => string;
  tickValues?: number[];
}

export const ColorModeConfigs: { [K in ColorMode]: ColorModeConfig } = {
  [ColorMode.StarRating]: {
    explicitMinVal: 3.8,
    explicitMaxVal: 9.3,
    getValue: (d) => d.starRating,
    title: 'Star Rating',
  },
  [ColorMode.AveragePP]: {
    explicitMinVal: 100,
    explicitMaxVal: 615,
    getValue: (d) => d.averagePp,
    title: 'Average PP',
  },
  [ColorMode.ReleaseYear]: {
    getValue: (d) => d.releaseYear,
    title: 'Year Ranked',
    tickFormat: (domainValue) => String(domainValue),
  },
  [ColorMode.AimSpeedRatio]: {
    explicitMinVal: 0.85,
    explicitMaxVal: 1.6,
    getValue: (d) => d.aimDifficulty / d.speedDifficulty,
    title: 'Aim/Speed Ratio',
  },
  [ColorMode.Mods]: {
    explicitMinVal: 0,
    explicitMaxVal: 6,
    getValue: (d) => {
      const modString = d.modString;
      if (modString.length === 0) {
        return 0;
      }

      if (modString.includes('EZ')) {
        return 5;
      }
      if (modString.includes('FL')) {
        return 4;
      }

      if (modString.includes('DT') && modString.includes('HR')) {
        return 3;
      }

      if (modString.includes('DT')) {
        return 1;
      }
      if (modString.includes('HR')) {
        return 2;
      }

      throw new UnreachableError(`Unhandled mod string: ${modString}`);
    },
    title: 'Mods',
    colorMapper: sixCategoryColorMap,
    tickCount: 6,
    tickValues: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
    tickFormat: (domainValue) => {
      switch (Math.floor(typeof domainValue === 'number' ? domainValue : domainValue.valueOf())) {
        case 0:
          return 'None';
        case 1:
          return 'DT';
        case 2:
          return 'HR';
        case 3:
          return 'DTHR';
        case 4:
          return 'FL';
        case 5:
          return 'EZ';
        default:
          throw new UnreachableError(`Unhandled domain value: ${domainValue}`);
      }
    },
  },
  [ColorMode.Length]: {
    getValue: (d) => d.lengthSeconds,
    title: 'Length Seconds (inc. mods)',
    explicitMinVal: 10,
    explicitMaxVal: 620,
    tickValues: [10, 60, 120, 180, 300, 420, 600],
    tickFormat: (domainValue) => {
      const value = typeof domainValue === 'number' ? domainValue : domainValue.valueOf();
      return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
    },
  },
};
