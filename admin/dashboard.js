// ======================= // dashboard.js // =======================


let currentPage = 1; let itemsPerPage = 10; let allProducts = [];

// Fetch products from Supabase 
document.addEventListener('DOMContentLoaded', async () => { await loadProducts(); setupSearch(); });

async function loadProducts() { const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });

if (error) { console.error('Error fetching products:', error); return; }

allProducts = data; displayProducts(); }

function displayProducts() { const start = (currentPage - 1) * itemsPerPage; const end = start + itemsPerPage; const paginatedItems = allProducts.slice(start, end);

const productTableBody = document.getElementById('productTableBody'); productTableBody.innerHTML = '';

paginatedItems.forEach(product => { const row = document.createElement('tr'); row.innerHTML = <td>${product.product_number || '-'}</td> <td>${product.name}</td> <td> ${product.discount_percent ? <span style="text-decoration:line-through; color:red">₦${calculateOriginalPrice(product.price, product.discount_percent)}</span> <br><strong>₦${product.price}</strong> <br><span class="text-green-600">${product.discount_percent}% OFF</span>:₦${product.price}} </td> <td><img src="${product.thumbnail_url || '#'}" class="h-10 w-10 rounded"/></td> <td>${product.published ? '✅' : '❌'}</td> <td> <button class="btn-edit" onclick="openEditModal(${product.id})">✏️</button> <button class="btn-delete" onclick="deleteProduct(${product.id})">🗑️</button> </td> ; productTableBody.appendChild(row); });

renderPagination(); }

function calculateOriginalPrice(finalPrice, discountPercent) { const discount = parseFloat(discountPercent); const price = parseFloat(finalPrice); return Math.round((price / (1 - discount / 100))); }

function renderPagination() { const totalPages = Math.ceil(allProducts.length / itemsPerPage); const pagination = document.getElementById('pagination'); pagination.innerHTML = '';

for (let i = 1; i <= totalPages; i++) { const btn = document.createElement('button'); btn.innerText = i; btn.className = i === currentPage ? 'bg-green-500 text-white px-3 py-1 mx-1 rounded' : 'bg-gray-300 px-3 py-1 mx-1 rounded'; btn.onclick = () => { currentPage = i; displayProducts(); }; pagination.appendChild(btn); } }

function setupSearch() { const searchInput = document.getElementById('searchInput'); searchInput.addEventListener('input', () => { const keyword = searchInput.value.toLowerCase(); const filtered = allProducts.filter(product => product.name.toLowerCase().includes(keyword) || (product.product_number + '').includes(keyword) ); currentPage = 1; allProducts = filtered; displayProducts(); }); }

async function deleteProduct(productId) { if (!confirm('Are you sure you want to delete this product?')) return;

const { error } = await supabase.from('products').delete().eq('id', productId); if (error) { alert('Error deleting product'); console.error(error); } else { alert('Product deleted'); await loadProducts(); } }

// ====================== // Edit Modal Logic // ======================

let currentEditId = null;

function openEditModal(productId) { const product = allProducts.find(p => p.id === productId); if (!product) return;

currentEditId = productId; document.getElementById('edit-name').value = product.name; document.getElementById('edit-price').value = product.price; document.getElementById('edit-thumbnail').value = product.thumbnail_url || ''; document.getElementById('edit-discount').value = product.discount_percent || ''; document.getElementById('edit-published').checked = product.published || false; document.getElementById('edit-modal').classList.remove('hidden'); }

document.getElementById('edit-close').onclick = () => { document.getElementById('edit-modal').classList.add('hidden'); currentEditId = null; };

document.getElementById('edit-save').onclick = async () => { const updatedData = { name: document.getElementById('edit-name').value, price: parseFloat(document.getElementById('edit-price').value), thumbnail_url: document.getElementById('edit-thumbnail').value, discount_percent: document.getElementById('edit-discount').value || null, published: document.getElementById('edit-published').checked, };

const { error } = await supabase.from('products').update(updatedData).eq('id', currentEditId); if (error) { alert('Error updating product'); console.error(error); } else { alert('Product updated successfully'); document.getElementById('edit-modal').classList.add('hidden'); currentEditId = null; await loadProducts(); } };

