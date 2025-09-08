<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Отчёты — MiniApp</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:12px}
    label{display:block;margin-top:10px}
    input,button{font-size:16px;padding:8px;width:100%}
    .row{display:flex;gap:8px}
    .row input{flex:1}
  </style>
</head>
<body>
  <h2>Добавить запись</h2>

  <label>Дата
    <input id="date" type="date" />
  </label>

  <label>Название заказа
    <input id="order_name" type="text" placeholder="Например: Заказ на сумки" />
  </label>

  <div class="row">
    <label style="flex:1">Кол-во пакетов
      <input id="package_count" type="number" min="0" value="1" />
    </label>
    <label style="flex:1">Цена за пакет (сом)
      <input id="price_per_package" type="number" min="0" step="0.01" value="1.00" />
    </label>
  </div>

  <label>Доп. выплата (сумма)
    <input id="extra_payment" type="number" min="0" step="0.01" value="0.00" />
  </label>

  <button id="send">Сохранить и отправить боту</button>
  <div id="status" style="margin-top:12px;color:green"></div>

  <script>
    const tg = window.Telegram ? window.Telegram.WebApp : null;
    if (tg) {
      // можно расширить WebApp до полного экрана
      try{ tg.expand(); }catch(e){}
    }

    document.getElementById('send').addEventListener('click', ()=>{
      const data = {
        order_date: document.getElementById('date').value || new Date().toISOString().slice(0,10),
        order_name: document.getElementById('order_name').value.trim(),
        package_count: Number(document.getElementById('package_count').value||0),
        price_per_package: Number(document.getElementById('price_per_package').value||1),
        extra_payment: Number(document.getElementById('extra_payment').value||0)
      };

      // валидация
      if(!data.order_name){ alert('Введите название заказа'); return; }

      // отправляем данные боту через Telegram WebApp API
      // это превратит данные в service message, который бот получит как update.message.web_app_data.data
      if (tg && tg.sendData) {
        tg.sendData(JSON.stringify(data));
        document.getElementById('status').innerText = 'Отправлено боту — ждём подтверждения...';
      } else {
        alert('Запуск внутри Telegram обязателен.');
      }
    });
  </script>
</body>
</html>
