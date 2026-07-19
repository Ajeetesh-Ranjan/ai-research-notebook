import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { AnnotationLayer } from './AnnotationLayer';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

interface PDFPageProps {
  fileUrl: string;
  pageNumber: number;
  scale: number;
}

export function PDFPage({ fileUrl, pageNumber, scale }: PDFPageProps) {
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  return (
    <div className="relative mx-auto w-fit">
      <Document
        file={fileUrl}
        loading={
          <div className="flex h-64 items-center justify-center text-sm text-fg-muted">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading PDF...
          </div>
        }
        error={
          <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            Failed to load PDF. Please check the file and try again.
          </div>
        }
        onLoadSuccess={() => setLoading(false)}
      >
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderAnnotationLayer={false}
          renderTextLayer={true}
          onLoadSuccess={(page) => {
            setPageWidth(page.width);
            setPageHeight(page.height);
            setLoading(false);
          }}
          className="shadow-lg"
        />
        {!loading && pageWidth > 0 && (
          <AnnotationLayer
            pageNumber={pageNumber}
            width={pageWidth * scale}
            height={pageHeight * scale}
            scale={scale}
          />
        )}
      </Document>
    </div>
  );
}
