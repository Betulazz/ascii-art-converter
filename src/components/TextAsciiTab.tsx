import { useEffect, useMemo, useState } from "react";
import { ExportActions } from "./ExportActions";
import { AsciiPreview } from "./AsciiPreview";
import { FIGLET_FONT_NAMES, loadFigletFont } from "../lib/figlet/fonts";
import { renderFiglet } from "../lib/figlet/figlet";

export function TextAsciiTab() {
  const [text, setText] = useState("ASCII");
  const [fontName, setFontName] = useState(FIGLET_FONT_NAMES.includes("Standard") ? "Standard" : FIGLET_FONT_NAMES[0]);
  const [fontSource, setFontSource] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isCurrent = true;
    setStatus(`正在加载字体：${fontName}`);

    loadFigletFont(fontName)
      .then((source) => {
        if (isCurrent) {
          setFontSource(source);
          setStatus("");
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setFontSource("");
          setStatus(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [fontName]);

  const renderedText = useMemo(() => (fontSource ? renderFiglet(text, fontSource) : ""), [fontSource, text]);
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
              {FIGLET_FONT_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
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
