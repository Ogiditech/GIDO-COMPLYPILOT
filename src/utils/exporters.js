import { jsPDF } from 'jspdf';

const DISCLAIMER = 'Generated policies are a starting point. Have them reviewed by a qualified compliance or legal professional before adoption.';

export function policyToText(doc) {
  const head = `${doc.company}\n${doc.title}\nFramework: ${doc.framework} | Version ${doc.version} | Effective ${doc.effectiveDate}\n`;
  const body = doc.sections.map((s) => `${s.number}. ${s.title.toUpperCase()}\n${s.content}`).join('\n\n');
  return `${head}\n${body}\n\n---\n${DISCLAIMER}\n`;
}

export function exportPolicyPdf(doc) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 56;
  let y = 0;

  // Header band
  pdf.setFillColor(30, 27, 75);
  pdf.rect(0, 0, W, 96, 'F');
  pdf.setFillColor(13, 148, 136);
  pdf.rect(0, 92, W, 4, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('GIDO COMPLYPILOT', M, 32);
  pdf.setFontSize(20);
  pdf.text(doc.title, M, 62);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(doc.company, M, 80);
  pdf.text(`v${doc.version}  ·  Effective ${doc.effectiveDate}  ·  ${doc.framework}`, W - M, 80, { align: 'right' });

  y = 130;
  const ensure = (h) => {
    if (y + h > H - 60) { pdf.addPage(); y = 60; }
  };

  doc.sections.forEach((s) => {
    ensure(40);
    pdf.setTextColor(30, 27, 75);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(`${s.number}. ${s.title}`, M, y);
    y += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(40, 40, 50);
    s.content.split('\n').forEach((line) => {
      const bullet = line.startsWith('• ');
      const text = bullet ? line.slice(2) : line;
      const indent = bullet ? 14 : 0;
      const wrapped = pdf.splitTextToSize(text || ' ', W - M * 2 - indent);
      wrapped.forEach((w, i) => {
        ensure(15);
        if (bullet && i === 0) pdf.text('•', M + 2, y);
        pdf.text(w, M + indent, y);
        y += 15;
      });
      y += 2;
    });
    y += 12;
  });

  // Footer on every page
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 135);
    const d = pdf.splitTextToSize(DISCLAIMER, W - M * 2 - 60);
    pdf.text(d, M, H - 34);
    pdf.text(`${i} / ${pages}`, W - M, H - 34, { align: 'right' });
  }

  pdf.save(`${doc.company}-${doc.title}-v${doc.version}.pdf`.replace(/[^\w.-]+/g, '_'));
}
