type ParameterPanelProps = {
  outputWidth: number;
  charset: string;
  invert: boolean;
  preserveAspectRatio: boolean;
  colorPreview: boolean;
  onOutputWidthChange: (value: number) => void;
  onCharsetChange: (value: string) => void;
  onInvertChange: (value: boolean) => void;
  onPreserveAspectRatioChange: (value: boolean) => void;
  onColorPreviewChange: (value: boolean) => void;
};

export function ParameterPanel(props: ParameterPanelProps) {
  return (
    <div className="panel parameters">
      <label>
        输出宽度
        <input
          type="number"
          min={8}
          max={400}
          value={props.outputWidth}
          onChange={(event) => props.onOutputWidthChange(Number(event.target.value))}
        />
      </label>
      <label>
        自定义字符集
        <input value={props.charset} onChange={(event) => props.onCharsetChange(event.target.value)} />
      </label>
      <label className="check-row">
        <input type="checkbox" checked={props.invert} onChange={(event) => props.onInvertChange(event.target.checked)} />
        反色
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={props.preserveAspectRatio}
          onChange={(event) => props.onPreserveAspectRatioChange(event.target.checked)}
        />
        保持比例
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={props.colorPreview}
          onChange={(event) => props.onColorPreviewChange(event.target.checked)}
        />
        彩色预览
      </label>
    </div>
  );
}
