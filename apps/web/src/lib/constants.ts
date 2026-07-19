export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const MOCK_AI = import.meta.env.VITE_MOCK_AI === 'true';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FCD34D' },
  { name: 'Green', value: '#4ADE80' },
  { name: 'Blue', value: '#60A5FA' },
  { name: 'Pink', value: '#F472B6' },
  { name: 'Purple', value: '#A78BFA' },
  { name: 'Orange', value: '#FB923C' },
];

export const ANNOTATION_TYPES = [
  'highlight',
  'underline',
  'strikethrough',
  'text_comment',
  'area_comment',
  'ink',
] as const;

export const EXPORT_FORMATS = [
  { id: 'markdown', name: 'Markdown', ext: '.md' },
  { id: 'pdf', name: 'PDF', ext: '.pdf' },
  { id: 'html', name: 'HTML', ext: '.html' },
  { id: 'docx', name: 'Word', ext: '.docx' },
] as const;

export const CITATION_STYLES = [
  { id: 'apa-7', name: 'APA 7th Edition' },
  { id: 'mla-9', name: 'MLA 9th Edition' },
  { id: 'chicago-nb', name: 'Chicago 17th (Notes-Bibliography)' },
  { id: 'chicago-ad', name: 'Chicago 17th (Author-Date)' },
  { id: 'ieee', name: 'IEEE' },
  { id: 'harvard', name: 'Harvard' },
  { id: 'vancouver', name: 'Vancouver' },
] as const;

export const GRAPH_NODE_TYPES = [
  'document',
  'note',
  'highlight',
  'concept',
  'entity',
  'topic',
  'question',
] as const;

export const GRAPH_EDGE_TYPES = [
  'cites',
  'supports',
  'contradicts',
  'relates_to',
  'contains',
  'derived_from',
  'answers',
] as const;

export const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl+K', description: 'Command palette / global search' },
  { key: 'Ctrl+Shift+B', description: 'Toggle left sidebar' },
  { key: 'Ctrl+Shift+R', description: 'Toggle right panel' },
  { key: 'Ctrl+O', description: 'Open document' },
  { key: 'Ctrl+N', description: 'New project' },
  { key: 'Ctrl+Shift+N', description: 'New note' },
  { key: 'Ctrl+Shift+H', description: 'Highlight selected text' },
  { key: 'Ctrl+F', description: 'Find in document' },
  { key: 'Ctrl+Shift+F', description: 'Search across documents' },
  { key: 'Ctrl+G', description: 'Open knowledge graph' },
  { key: 'Ctrl+Shift+E', description: 'Export' },
  { key: 'Ctrl+/', description: 'Show keyboard shortcuts' },
  { key: 'Escape', description: 'Close modal / cancel selection' },
] as const;

export const DEFAULT_PAGE_SIZE = 25;
