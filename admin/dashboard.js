// Liyog Pharmacy Admin Dashboard

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("product-form");
const categorySelect = document.getElementById("category");
const filterCategory = document.getElementById("filter-category");
const productTableBody = document.getElementById("product-table-body");
const logPanel = document.getElementById("log-panel");
const previewBtn = document.getElementById("preview-btn");
const previewModal = document.getElementById("preview-modal");
const previewContent = document.getElementById("preview-content");
const imagePreview = document.getElementById("image-preview");
const searchInput = document.getElementById("search");

const quill = new Quill("#editor", { theme: "snow" });

function log(msg) {
  logPanel.innerHTML += `\n${msg}`;
}

function resetForm() {
  form.reset();
  quill.setContents([]);
  imagePreview.innerHTML = "";
}

async function fetchCategories() {
  const { data, error } = await supabase.from("categories").select("id, name");
  if (error) return log("❌ Error loading categories: " + error.message);
  categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
  filterCategory.innerHTML = '<option value="">-- All Categories --</option>';
  data.forEach(cat => {
    const option = `<option value="${cat.id}">${cat.name}</option>`;
    categorySelect.innerHTML += option;
    filterCategory.innerHTML += option;
  });
}

function getImageUrls(files) {
  return Promise.all(
    [...files].map(async file => {
      const { data, error } = await supabase.storage.from("product-images").upload(`products/${Date.now()}_${file.name}`, file);
      if (error) throw error;
      const { data: url } = supabase.storage.from("product-images").getPublicUrl(data.path);
      return url.publicUrl;
    })
  );
}

async function uploadVideo(file) {
  const { data, error } = await supabase.storage.from("product-videos").upload(`videos/${Date.now()}_${file.name}`, file);
  if (error) throw error;
  const { data: url } = supabase.storage.from("product-videos").getPublicUrl(data.path);
  return url.publicUrl;
}

function renderPreview(product) {
  previewContent.innerHTML = `
    <h2>🧾 Preview Product</h2>
    <p><strong>Name:</strong> ${product.name}</p>
    <p><strong>Category:</strong> ${product.category}</p>
    <p><strong>Tags:</strong> ${product.tags}</p>
    <p><strong>Price:</strong> ₦${product.price}</p>
    <p><strong>Discount:</strong> ${product.discount || "None"}%</p>
    <p><strong>Carton Quantity:</strong> ${product.carton_quantity || "N/A"}</p>
    <p><strong>Published:</strong> ${product.published ? "Yes" : "No"}</p>
    <div><strong>Description:</strong> ${product.description}</div>
    ${product.image_urls.map(url => `<img src="${url}" class="preview-img" />`).join('')}
    ${product.video_url ? `<video controls src="${product.video_url}" style="max-width:100%;"></video>` : ''}
    ${product.youtube_url ? `<iframe width="100%" height="315" src="${product.youtube_url}" frameborder="0" allowfullscreen></iframe>` : ''}
  `;
  previewModal.style.display = "flex";
}

function closeModal() {
  previewModal.style.display = "none";
}

previewBtn.addEventListener("click", async () => {
  const product = await extractFormData();
  renderPreview(product);
});

previewModal.addEventListener("click", (e) => {
  if (e.target.id === "preview-modal") closeModal();
});

async function extractFormData() {
  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;
  const tags = document.getElementById("tags").value;
  const price = parseFloat(document.getElementById("price").value);
  const discount = parseInt(document.getElementById("discount").value) || 0;
  const description = quill.root.innerHTML;
  const published = document.getElementById("published").checked;
  const carton_quantity = parseInt(document.getElementById("carton_quantity").value) || null;
  const youtube_url = document.getElementById("youtube_url").value;
  const imageFiles = document.getElementById("images").files;
  const videoFile = document.getElementById("video").files[0];

  const image_urls = await getImageUrls(imageFiles);
  const video_url = videoFile ? await uploadVideo(videoFile) : null;

  return {
    name, category, tags, price, discount, description,
    published, carton_quantity, youtube_url,
    image_urls, video_url
  };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const product = await extractFormData();
    const { error } = await supabase.from("products").insert([product]);
    if (error) throw error;
    log("✅ Product saved successfully.");
    resetForm();
    fetchProducts();
  } catch (err) {
    log("❌ Error saving product: " + err.message);
  }
});

async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("id", { ascending: false });
  if (error) return log("❌ Error fetching products: " + error.message);
  renderProducts(data);
}

function renderProducts(products) {
  productTableBody.innerHTML = "";
  products.forEach(p => {
    const hasDiscount = p.discount && p.discount > 0;
    const discountedPrice = hasDiscount ? p.price * (1 - p.discount / 100) : p.price;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td><img src="${p.image_urls[0]}" class="thumbnail-img" width="50" /></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>
        ${hasDiscount ? `<s>₦${p.price}</s> <strong>₦${discountedPrice.toFixed(2)}</strong>` : `₦${p.price}`}
      </td>
      <td>${p.published ? "✅" : "❌"}</td>
      <td>
        <button onclick="editProduct(${p.id})">✏️ Edit</button>
      </td>
    `;
    productTableBody.appendChild(row);
  });
}

async function editProduct(id) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) return log("❌ Cannot load product: " + error.message);
  document.getElementById("name").value = data.name;
  document.getElementById("category").value = data.category;
  document.getElementById("tags").value = data.tags;
  document.getElementById("price").value = data.price;
  document.getElementById("discount").value = data.discount;
  document.getElementById("carton_quantity").value = data.carton_quantity;
  document.getElementById("youtube_url").value = data.youtube_url;
  document.getElementById("published").checked = data.published;
  quill.root.innerHTML = data.description;
}

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.toLowerCase();
  const { data, error } = await supabase.from("products").select("*");
  if (error) return;
  const filtered = data.filter(p => p.name.toLowerCase().includes(query));
  renderProducts(filtered);
});

filterCategory.addEventListener("change", async () => {
  const cat = filterCategory.value;
  const { data, error } = await supabase.from("products").select("*");
  if (error) return;
  const filtered = cat ? data.filter(p => p.category == cat) : data;
  renderProducts(filtered);
});

fetchCategories();
fetchProducts();
                                                                                   
