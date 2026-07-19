import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { exportApi } from '@/lib/apiClient';
import { FormatSelector } from './FormatSelector';
import { PreviewPane } from './PreviewPane';
import { FileDown, Loader2, Download } from 'lucide-react';
import { EXPORT_FORMATS } from '@/lib/constants';
import toast from 'react-hot-toast';

export function ExportDialog() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;
  const [format, setFormat] = useState('pdf');
  const [scope, setScope] = useState('project');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportApi.create(projectId, { format, scope });
      toast.success('Export started. Check your downloads soon.');
    } catch {
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const formats = EXPORT_FORMATS.map((f) => f.id);

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 border-r border-border-default bg-surface p-4">
        <div className="mb-4 flex items-center gap-2">
          <FileDown className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-fg-primary">Export</h2>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Format</label>
          <FormatSelector formats={formats} selected={format} onSelect={setFormat} />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-fg-muted">Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="input-field w-full text-sm"
          >
            <option value="project">Entire Project</option>
            <option value="document">Selected Document</option>
            <option value="selection">Current Selection</option>
            <option value="graph">Knowledge Graph</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="btn-primary flex w-full items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export {format.toUpperCase()}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <PreviewPane format={format} scope={scope} />
      </div>
    </div>
  );
}
