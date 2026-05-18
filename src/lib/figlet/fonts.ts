export type FigletFontDefinition = {
  name: string;
  load: () => Promise<string>;
};

const fontModules = import.meta.glob<string>("../../../node_modules/figlet/fonts/*.flf", {
  query: "?raw",
  import: "default",
});

export const FIGLET_FONT_NAMES = Object.keys(fontModules)
  .map((path) => path.replace(/^.*\//, "").replace(/\.flf$/, ""))
  .sort((left, right) => left.localeCompare(right, "en"));

export const FIGLET_FONTS: FigletFontDefinition[] = FIGLET_FONT_NAMES.map((name) => ({
  name,
  load: async () => {
    const path = `../../../node_modules/figlet/fonts/${name}.flf`;
    const loader = fontModules[path];
    if (!loader) {
      throw new Error(`FIGlet font not found: ${name}`);
    }

    return loader();
  },
}));

export async function loadFigletFont(name: string): Promise<string> {
  const font = FIGLET_FONTS.find((item) => item.name === name) ?? FIGLET_FONTS.find((item) => item.name === "Standard");
  if (!font) {
    throw new Error("No FIGlet fonts are available.");
  }

  return font.load();
}
