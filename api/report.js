import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { start, end, format } = req.query;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('date', start)
    .lte('date', end);

  if (error) return res.status(500).json({ error: error.message });

  const totalPackages = data.reduce((s, r) => s + r.packages, 0);
  const totalPrice = data.reduce((s, r) => s + (r.packages * r.price), 0);

  if (format === "pdf") {
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${start}_${end}.pdf`);

    doc.text(`Отчёт с ${start} по ${end}`);
    doc.text(`Всего пакетов: ${totalPackages}`);
    doc.text(`Итого сумма: ${totalPrice} сом`);
    doc.moveDown();

    data.forEach(o => {
      doc.text(`${o.date} | ${o.title} | ${o.packages} пак. | ${o.price} сом`);
    });

    doc.pipe(res);
    doc.end();
  } else {
    res.json({ orders: data, totalPackages, totalPrice });
  }
}
