function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

// обработка формы
document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  const order = {
    date: formData.get("date"),
    title: formData.get("title"),
    packages: Number(formData.get("packages")),
    price: Number(formData.get("price")),
  };

  const res = await fetch("/api/addOrder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });

  const result = await res.json();
  document.getElementById("status").innerText = result.message || "Сохранено!";
  e.target.reset();
});
