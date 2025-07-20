// ✅ DASHBOARD.JS — Full Functional Dashboard Script for Liyog Pharmacy CMS

const PRODUCTS_PER_PAGE = 10; let currentPage = 1; let allProducts = []; let currentEditId = null;

const form = document.getElementById("productForm"); const previewModal = document.getElementById("previewModal"); 
const previewBody = document.getElementById("previewBody"); const statusMsg = document.getElementById("status"); const tableBody = document.getElementById("productTableBody"); const paginationControls = document.getElementById("paginationControls"); const searchInput = document.getElementById("searchInput"); const categoryFilter = document.getElementById("categoryFilter"); const categorySelect = document.getElementById("category"); const previewBtn = document.getElementById("previewBtn");

// ✅ Fetch and Populate Categories
async function loadCategories() { const { data, error } = await client.from("categories").select("name"); if (error) return; categorySelect.innerHTML = '<option value="">Select Category</option>'; categoryFilter.innerHTML = '<option value="">All Categories</option>'; data.forEach(({ name }) => { categorySelect.innerHTML += <option value="${name}">${name}</option>; categoryFilter.innerHTML += <option value="${name}">${name}</option>; }); }

// ✅ Fetch All Products 
async function loadProducts() { const { data, error } = await client.from("products").select("*").order("created_at", { ascending: false }); if (!error) { allProducts = data; renderProducts(); } }

// ✅ Render Products with Pagination 
function renderProducts() { let filtered = allProducts; const search = searchInput.value.toLowerCase(); const category = categoryFilter.value;

if (search) { filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.tags.toLowerCase().includes(search)); } if (category) { filtered = filtered.filter(p => p.category === category); }

const start = (currentPage - 1) * PRODUCTS_PER_PAGE; const paginated = filtered.slice(start, start + PRODUCTS_PER_PAGE);

tableBody.innerHTML = paginated.map(p => <tr> <td>${p.name}</td> <td>${p.category}</td> <td>${p.price}</td> <td>${p.discount_price || "-"}</td> <td><img src="${p.image1}" width="40" /></td> <td>${p.published ? "✅" : "❌"}</td> <td> <button onclick="editProduct('${p.id}')">✏️</button> <button onclick="togglePublish('${p.id}', ${!p.published})">${p.published ? "Unpublish" : "Publish"}</button> <button onclick="deleteProduct('${p.id}')">🗑️</button> </td> </tr>).join("");

const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE); paginationControls.innerHTML = <button onclick="changePage(-1)" ${currentPage === 1 ? "disabled" : ""}>Previous</button> <span>Page ${currentPage} of ${totalPages}</span> <button onclick="changePage(1)" ${currentPage === totalPages ? "disabled" : ""}>Next</button>; }

// ✅ Change Page 
                           function changePage(delta) { currentPage += delta; renderProducts(); }

// ✅ Edit Product 
                           function editProduct(id) { const product = allProducts.find(p => p.id === id); if (!product) return; currentEditId = id; Object.keys(product).forEach(key => { const el = document.getElementById(key); if (el) el.value = product[key]; }); statusMsg.textContent = Editing: ${product.name}; }

// ✅ Publish/Unpublish 
                           async function togglePublish(id, publishState) { const { error } = await client.from("products").update({ published: publishState }).eq("id", id); if (!error) { statusMsg.textContent = publishState ? "Product Published ✅" : "Product Unpublished ❌"; loadProducts(); } }

// ✅ Delete Product 
                           async function deleteProduct(id) { if (!confirm("Delete this product?")) return; const { error } = await client.from("products").delete().eq("id", id); if (!error) { statusMsg.textContent = "Product Deleted 🗑️"; loadProducts(); } }

// ✅ Save Product 
                           form.onsubmit = async (e) => { e.preventDefault(); const formData = new FormData(form); const payload = Object.fromEntries(formData.entries());

if (currentEditId) { const { error } = await client.from("products").update(payload).eq("id", currentEditId); if (!error) { statusMsg.textContent = "Product Updated ✅"; currentEditId = null; } } else { const { error } = await client.from("products").insert([payload]); if (!error) statusMsg.textContent = "Product Saved ✅"; } form.reset(); loadProducts(); };

// ✅ Preview Product 
                           previewBtn.onclick = () => { const formData = new FormData(form); const p = Object.fromEntries(formData.entries()); previewBody.innerHTML = <h2>${p.name}</h2> <p><strong>Category:</strong> ${p.category}</p> <p><strong>Price:</strong> ₦${p.price}</p> <p><strong>Description:</strong> ${p.description}</p> <div><img src="${p.image1}" width="100" /></div> <p><strong>Tags:</strong> ${p.tags}</p> <p><strong>Video:</strong> ${p.video ?<video width="200" controls src="${p.video}"></video>: "-"}</p> <p><strong>YouTube:</strong> ${p.youtube ?<a href="${p.youtube}" target="_blank">Watch</a>: "-"}</p>; previewModal.style.display = "block"; };

// ✅ Close Preview 
                           function closePreview() { previewModal.style.display = "none"; }

// ✅ Auto Actions 
                           searchInput.oninput = renderProducts; categoryFilter.onchange = renderProducts;

// ✅ Init 
                           loadCategories(); 
                           loadProducts();


