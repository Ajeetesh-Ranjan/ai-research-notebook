interface PreviewPaneProps {
  format: string;
  scope: string;
}

export function PreviewPane({ format, scope }: PreviewPaneProps) {
  return (
    <div className="rounded-lg border border-border-default bg-surface p-6">
      <h3 className="mb-4 text-sm font-semibold text-fg-primary">Export Preview</h3>
      <div className="space-y-3 text-sm text-fg-secondary">
        <div className="flex justify-between border-b border-border-subtle pb-2">
          <span>Format</span>
          <span className="font-medium text-fg-primary">{format.toUpperCase()}</span>
        </div>
        <div className="flex justify-between border-b border-border-subtle pb-2">
          <span>Scope</span>
          <span className="font-medium text-fg-primary">{scope}</span>
        </div>
        <div className="flex justify-between border-b border-border-subtle pb-2">
          <span>Documents</span>
          <span className="font-medium text-fg-primary">3</span>
        </div>
        <div className="flex justify-between border-b border-border-subtle pb-2">
          <span>Annotations</span>
          <span className="font-medium text-fg-primary">12</span>
        </div>
        <div className="flex justify-between border-b border-border-subtle pb-2">
          <span>Notes</span>
          <span className="font-medium text-fg-primary">8</span>
        </div>
        <div className="flex justify-between border-b border-border-subtle pb-2">
          <span>Estimated Size</span>
          <span className="font-medium text-fg-primary">~2.4 MB</span>
        </div>
      </div>

      <div className="mt-6 rounded bg-bg-subtle p-3 font-mono text-xs text-fg-muted">
        <p>{`# CiteMind Export`}</p>
        <p>{`Format: ${format.toUpperCase()}`}</p>
        <p>{`Scope: ${scope}`}</p>
        <p>{`Generated: ${new Date().toLocaleString()}`}</p>
      </div>
    </div>
  );
}
