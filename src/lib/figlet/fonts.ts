import { STANDARD_FLF } from "./standard";

export type FigletFontDefinition = {
  name: string;
  source: string;
};

export const FIGLET_FONTS: FigletFontDefinition[] = [
  {
    name: "Standard",
    source: STANDARD_FLF,
  },
];
