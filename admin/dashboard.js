// ✅ DASHBOARD.JS — Updated Functional Dashboard Script for Liyog Pharmacy CMS 
document.addEventListener("DOMContentLoaded", () => { 
  const PRODUCTS_PER_PAGE = 10; 
  let currentPage = 1; 
  let allProducts = []; 
  let currentEditId = null;

const form = document.getElementById("product-form"); 
const previewModal = document.getElementById("preview-modal"); 
const previewContent = document.getElementById("preview-content"); 
const tableBody = document.getElementById("product-table-body"); 
const paginationControls = document.getElementById("pagination"); 
  const searchInput = document.getElementById("search"); 
  const categoryFilter = document.getElementById("filter-category"); 
  const categorySelect = document.getElementById("category"); 
  const previewBtn = document.getElementById("preview-btn"); 
  const logPanel = document.getElementById("log-panel");

const quill = new Quill("#editor", { theme: "snow" });

// ✅ Log helper 
const log = (msg) => (logPanel.innerHTML += \n${msg});

// ✅ Load categories 
async function loadCategories() { 
  const { data, error } = await client.from("categories").select("name"); 
  if (error) return log("Error loading categories"); 
  categorySelect.innerHTML = '<option value="">-- Select Category --</option>'; 
  categoryFilter.innerHTML = '<option value="">-- All Categories --</option>'; 
  data.forEach(({ name }) => { categorySelect.innerHTML += <option value="${name}">${name}</option>; 
  categoryFilter.innerHTML += <option value="${name}">${name}</option>; }); }

// ✅ Load products 
async function loadProducts() { 
  const { data, error } = await client.from("products").select("*").order("created_at", { ascending: false }); 
  if (error) return log("Error loading products"); 
  allProducts = data; renderProducts(); }

// ✅ Render products with filters and pagination 
function renderProducts() { 
  let filtered = allProducts; 
  const search = searchInput.value.toLowerCase(); 
const cat = categoryFilter.value; 
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || (p.tags || '').toLowerCase().includes(search)); 
  if (cat) filtered = filtered.filter(p => p.category === cat);

const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
const paginated = filtered.slice(start, start + PRODUCTS_PER_PAGE);

tableBody.innerHTML = paginated.map(p => 
  <tr>
    <td>${p.id}</td>
    <td><img src="${p.image1 || ''}" class="thumbnail-img" width="40" /></td>
    <td>${p.name}</td>
    <td>${p.category}</td>
    <td>₦${p.price}</td>
    <td>${p.published ? '✅' : '❌'}</td>
    <td>
      <button onclick="editProduct('${p.id}')">✏️</button>
      <button onclick="togglePublish('${p.id}', ${!p.published})">${p.published ? 'Unpublish' : 'Publish'}</button>
      <button onclick="deleteProduct('${p.id}')">🗑️</button>
    </td>
  </tr>
`).join("");

const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
paginationControls.innerHTML = `
  <button onclick="changePage(-1)" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
  <span> Page ${currentPage} of ${totalPages} </span>
  <button onclick="changePage(1)" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
`;

}

window.changePage = (delta) => { 
  currentPage += delta; 
  renderProducts(); };

window.editProduct = (id) => { 
  const p = allProducts.find(prod => prod.id === id); 
  if (!p) return; currentEditId = id; 
  document.getElementById("name").value = p.name; 
  categorySelect.value = p.category; 
  document.getElementById("tags").value = p.tags; 
  document.getElementById("price").value = p.price; 
  document.getElementById("discount").value = p.discount || ""; 
  document.getElementById("youtube").value = p.youtube || ""; 
  document.getElementById("published").checked = p.published; quill.root.innerHTML = p.description || ""; log(Editing: ${p.name}); };

window.togglePublish = async (id, state) => { const { error } = await client.from("products").update({ published: state }).eq("id", id); 
if (!error) { log(state ? "✅ Published" : "❌ Unpublished"); 
loadProducts(); } };

window.deleteProduct = async (id) => { if (!confirm("Delete this product?")) 
  return; const { error } = await client.from("products").delete().eq("id", id); 
if (!error) { log("🗑️ Product deleted"); 
loadProducts(); } };

form.onsubmit = async (e) => { e.preventDefault(); 
const data = new FormData(form); 
const payload = { name: data.get("name"), 
category: data.get("category"), tags: data.get("tags"), price: parseFloat(data.get("price")), discount: parseFloat(data.get("discount")) || 0, youtube: data.get("youtube"), published: 
document.getElementById("published").checked, description: quill.root.innerHTML, };

if (currentEditId) {
  const { error } = await client.from("products").update(payload).eq("id", currentEditId);
  if (!error) log("✅ Product updated");
  currentEditId = null;
} else {
  const { error } = await client.from("products").insert([payload]);
  if (!error) log("✅ Product created");
}

form.reset();
quill.setText("");
loadProducts();

};

previewBtn.onclick = () => { 
  const data = new FormData(form); 
  const name = data.get("name"); 
  const category = data.get("category"); 
  const price = data.get("price"); 
  const tags = data.get("tags"); 
  const youtube = data.get("youtube"); 
  const desc = quill.root.innerHTML;

previewContent.innerHTML = `
  <h2>${name}</h2>
  <p><strong>Category:</strong> ${category}</p>
  <p><strong>Price:</strong> ₦${price}</p>
  <p><strong>Description:</strong></p>
  <div>${desc}</div>
  <p><strong>Tags:</strong> ${tags}</p>
  <p><strong>YouTube:</strong> ${youtube ? `<a href="${youtube}" target="_blank">Watch</a>` : "-"}</p>
`;
previewModal.style.display = "flex";

};

previewModal.addEventListener("click", (e) => { 
  if (e.target === previewModal)
  previewModal.style.display = "none"; });

searchInput.oninput = renderProducts; 
  categoryFilter.onchange = renderProducts;

loadCategories(); 
  loadProducts(); });

