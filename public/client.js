async function getJSON(url, params) {
  const q = new URLSearchParams(params);
  const res = await fetch(`${url}?${q.toString()}`);
  return await res.json();
}

document.getElementById('form-one').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const stock = (fd.get('stock') || '').trim();
  const like = !!fd.get('like');

  const data = await getJSON('/api/stock-prices', { stock, like });
  document.getElementById('out-one').textContent = JSON.stringify(data, null, 2);
});

document.getElementById('form-two').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const stock1 = (fd.get('stock1') || '').trim();
  const stock2 = (fd.get('stock2') || '').trim();
  const like = !!fd.get('like');

  // El backend soporta ?stock=AAPL&stock=MSFT
  const params = new URLSearchParams();
  params.append('stock', stock1);
  params.append('stock', stock2);
  if (like) params.append('like', 'true');

  const res = await fetch(`/api/stock-prices?${params.toString()}`);
  const data = await res.json();
  document.getElementById('out-two').textContent = JSON.stringify(data, null, 2);
});
