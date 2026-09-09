export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration>,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  return node;
}

const FIELD_BG = "#12141c";

export function field(control: HTMLElement): HTMLDivElement {
  const wrap = el("div", { marginBottom: "16px" });
  const label = el("div", {
    fontSize: "14px",
    color: "#9aa3c0",
    marginBottom: "8px",
    fontWeight: "600",
  });
  label.dataset.role = "label";
  wrap.append(label, control);
  return wrap;
}

export function setFieldLabel(field_: HTMLDivElement, text: string): void {
  const label = field_.querySelector<HTMLElement>('[data-role="label"]');
  if (label) label.textContent = text;
}

export function pillButton(bg: string): HTMLButtonElement {
  return el("button", {
    flex: "1",
    padding: "12px 14px",
    fontSize: "16px",
    fontWeight: "700",
    borderRadius: "12px",
    border: "none",
    background: bg,
    color: "#fff",
    cursor: "pointer",
  });
}

export function textInput(): HTMLInputElement {
  const input = el("input", {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "none",
    background: FIELD_BG,
    color: "#fff",
  });
  input.type = "text";
  return input;
}

export function rangeSlider(gradient: string, max: number): HTMLInputElement {
  const s = el("input", {
    width: "100%",
    height: "22px",
    borderRadius: "11px",
    background: gradient,
    cursor: "pointer",
    appearance: "none",
    boxSizing: "border-box",
  });
  (s.style as unknown as { webkitAppearance: string }).webkitAppearance = "none";
  s.type = "range";
  s.min = "0";
  s.max = String(max);
  return s;
}
