async function getReport() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  if (!start || !end) {
    alert("Укажи даты!");
    return;
  }

  const res = await fetch(`/api/report?start=${start}&end=${end}`);
  const data = await res.json();

  let html = `<h3>Отчёт</h3>
              <p>С ${start} по ${end}</p>
              <p>Всего пакетов: ${data.totalPackages}</p>
              <p>Итого сумма: ${data.totalPrice} сом</p>
              <table border="1" cellpadding="5">
                <tr><th>Дата</th><th>Название</th><th>Пакеты</th><th>Цена</th></tr>`;
  data.orders.forEach(o => {
    html += `<tr>
               <td>${o.date}</td>
               <td>${o.title}</td>
               <td>${o.packages}</td>
               <td>${o.price}</td>
             </tr>`;
  });
  html += `</table>`;

  document.getElementById("reportResult").innerHTML = html;
}

async function downloadPDF() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  const res = await fetch(`/api/report?start=${start}&end=${end}&format=pdf`);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${start}_${end}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
