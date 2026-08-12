import { jsPDF } from 'jspdf';

const EvaluationReport = ({ rawReport, onRestart }) => {
  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;
    const lineHeight = 7;
    let cursorY = 40;

    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237);
    doc.text('Mock Interview Report', margin, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 28);

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    
    const splitText = doc.splitTextToSize(rawReport, maxLineWidth);
    
    splitText.forEach(line => {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });
    
    doc.save(`interview-report-${Date.now()}.pdf`);
  };
  return (
    <div className="glass-panel">
      <h2 className="title" style={{fontSize: '2rem', marginBottom: '1.5rem'}}>Final Evaluation Report</h2>
      <div className="report-grid" style={{background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px'}}>
        <div style={{whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '0.95rem', color: '#e2e8f0'}}>
          {rawReport}
        </div>
      </div>
      <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
        <button onClick={exportPDF} className="btn btn-primary" style={{flex: 1}}>
          📄 Export to PDF
        </button>
        <button onClick={onRestart} className="btn btn-primary" style={{flex: 1, background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', border: '1px solid var(--glass-border)'}}>
          Start New Session
        </button>
      </div>
    </div>
  );
};

export default EvaluationReport;
