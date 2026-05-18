import { useMemo, useState } from "react";
import { ExportActions } from "./ExportActions";
import { AsciiPreview } from "./AsciiPreview";
import { FIGLET_FONTS } from "../lib/figlet/fonts";
import { renderFiglet } from "../lib/figlet/figlet";

export function TextAsciiTab() {
  const [text, setText] = useState("ASCII");
  const [fontName, setFontName] = useState(FIGLET_FONTS[0].name);
  const [status, setStatus] = useState("");

  const font = FIGLET_FONTS.find((item) => item.name === fontName) ?? FIGLET_FONTS[0];
  const renderedText = useMemo(() => renderFiglet(text, font.source), [font.source, text]);
  const result = useMemo(
    () => ({
      text: renderedText,
      width: Math.max(0, ...renderedText.split("\n").map((line) => line.length)),
      height: renderedText ? renderedText.split("\n").length : 0,
    }),
    [renderedText],
  );

  return (
    <div className="tab-layout">
      <aside className="side-column">
        <div className="panel">
          <label>
            输入文字
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} />
          </label>
          <label>
            FIGlet 字体
            <select value={fontName} onChange={(event) => setFontName(event.target.value)}>
              {FIGLET_FONTS.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="actions">
          <ExportActions text={renderedText} fileStem="text-ascii" onStatus={setStatus} />
        </div>
        {status && <p className="status">{status}</p>}
      </aside>
      <section className="preview-column">
        <AsciiPreview result={result} placeholder="输入文字后会实时生成 FIGlet 字符画。" />
      </section>
    </div>
  );
}
