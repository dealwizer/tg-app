// api/webhook.js
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.BOT_TOKEN; // от BotFather
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBAPP_URL = process.env.WEBAPP_URL; // https://.../ (frontend)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const update = req.body;

  try {
    // 1) команда /start: отправим кнопку "Открыть приложение"
    if (update.message && update.message.text && update.message.text.startsWith('/start')) {
      const chatId = update.message.chat.id;
      const replyMarkup = {
        inline_keyboard: [
          [
            { text: "Открыть приложение", web_app: { url: WEBAPP_URL } }
          ]
        ]
      };
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          chat_id: chatId,
          text: "Нажми кнопку, чтобы открыть мини-приложение",
          reply_markup: replyMarkup
        })
      });
      return res.json({ok:true});
    }

    // 2) пришли данные из Web App (service message с web_app_data)
    if (update.message && update.message.web_app_data && update.message.web_app_data.data) {
      const chatId = update.message.chat.id;
      const from = update.message.from || {};
      const raw = update.message.web_app_data.data;
      const obj = JSON.parse(raw);

      // Вставляем в Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: from.id,
          username: from.username || (from.first_name||''),
          order_date: obj.order_date,
          order_name: obj.order_name,
          package_count: obj.package_count,
          price_per_package: obj.price_per_package,
          extra_payment: obj.extra_payment
        }]);

      // ответим пользователю в чате
      let text;
      if (error) {
        console.error('supabase insert error', error);
        text = 'Ошибка при сохранении записи. ' + (error.message || '');
      } else {
        text = `Запись сохранена.\n${obj.order_date} — ${obj.order_name}\nПакетов: ${obj.package_count}\nИтого: ${(obj.package_count * obj.price_per_package + obj.extra_payment).toFixed(2)} сом`;
      }

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ chat_id: chatId, text })
      });

      return res.json({ok:true});
    }

    // другие update-и — можно логику расширить (команда для отчёта например)
    // пример: если пользователь пишет "/report 2025-09-01 2025-09-08"
    if (update.message && update.message.text && update.message.text.startsWith('/report')) {
      const chatId = update.message.chat.id;
      const parts = update.message.text.trim().split(/\s+/);
      // ожидаем: /report YYYY-MM-DD YYYY-MM-DD
      if (parts.length >= 3) {
        const fromDate = parts[1];
        const toDate = parts[2];
        const q = await supabase
          .from('orders')
          .select('order_date,order_name,package_count,price_per_package,extra_payment')
          .eq('user_id', update.message.from.id)
          .gte('order_date', fromDate)
          .lte('order_date', toDate);
        if (q.error) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({chat_id:chatId, text:'Ошибка при запросе отчёта'}) });
          return res.json({ok:true});
        }
        const rows = q.data || [];
        let total = 0;
        let lines = rows.map(r=>{
          const sum = Number(r.package_count) * Number(r.price_per_package) + Number(r.extra_payment || 0);
          total += sum;
          return `${r.order_date} | ${r.order_name} | пакеты:${r.package_count} | сумма:${sum.toFixed(2)}`;
        }).join('\n');
        const reply = `Отчёт ${fromDate} — ${toDate}\n\n${lines}\n\nИтого: ${total.toFixed(2)} сом`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({chat_id:chatId, text: reply}) });
      } else {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({chat_id:chatId, text: 'Формат: /report YYYY-MM-DD YYYY-MM-DD'}) });
      }
      return res.json({ok:true});
    }

    return res.json({ok:true});
  } catch (e) {
    console.error(e);
    return res.status(500).json({ok:false, error: String(e)});
  }
};
