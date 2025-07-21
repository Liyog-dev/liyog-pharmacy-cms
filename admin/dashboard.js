// 📦 Initialize Supabase
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let isEditing = false;
let editingProductId = null;

// 🌀 Load categories dynamically
async function loadCategories() {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) {
    alert("Failed to load categories");
    return;
  }

  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  data.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.name;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}

// 🔄 Preview Product Details
function previewProduct() {
  document.getElementById("preview-title").textContent = document.getElementById("title").value || 'No title';
  document.getElementById("preview-price").textContent = "₦" + (document.getElementById("price").value || '0');
  document.getElementById("preview-desc").textContent = document.getElementById("description").value || 'No description';

  const imgURL = document.getElementById("image").value;
  document.getElementById("preview-image").src = imgURL || "https://via.placeholder.com/150";
}

// 🧾 Reset Form
function resetForm() {
  document.getElementById("product-form").reset();
  isEditing = false;
  editingProductId = null;
  previewProduct();
}

// 💾 Submit Handler
document.getElementById("product-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const category = document.getElementById("category").value;
  const image = document.getElementById("image").value.trim();
  const published = document.getElementById("publish").checked;

  if (!title || !description || isNaN(price) || !category) {
    alert("Please fill in all required fields.");
    return;
  }

  const payload = {
    title,
    description,
    price,
    category,
    image,
    published,
    updated_at: new Date(),
  };

  let response;
  if (isEditing && editingProductId) {
    response = await supabase.from("products").update(payload).eq("id", editingProductId);
    alert("Product updated successfully!");
  } else {
    payload.created_at = new Date();
    response = await supabase.from("products").insert(payload);
    alert("Product added successfully!");
  }

  if (response.error) {
    console.error(response.error);
    alert("Error: " + response.error.message);
  } else {
    resetForm();
    fetchProducts();
  }
});

// 🔍 Edit Product
async function editProduct(id) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error || !data) {
    alert("Failed to fetch product");
    return;
  }

  document.getElementById("title").value = data.title;
  document.getElementById("description").value = data.description;
  document.getElementById("price").value = data.price;
  document.getElementById("category").value = data.category;
  document.getElementById("image").value = data.image || "";
  document.getElementById("publish").checked = data.published;

  isEditing = true;
  editingProductId = id;
  previewProduct();
}

// 🗑️ Delete Product
async function deleteProduct(id) {
  const confirmDelete = confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    alert("Failed to delete product");
  } else {
    alert("Product deleted");
    fetchProducts();
  }
}

// 📦 Load All Products
async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  const container = document.getElementById("products-list");
  container.innerHTML = "";

  if (error || !data.length) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }

  data.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${prod.image || 'https://via.placeholder.com/100'}" alt="${prod.title}">
      <div>
        <h3>${prod.title}</h3>
        <p>₦${prod.price}</p>
        <p>${prod.description.substring(0, 50)}...</p>
        <button onclick="editProduct('${prod.id}')">✏️ Edit</button>
        <button onclick="deleteProduct('${prod.id}')">🗑️ Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 🔁 Hook Events
document.getElementById("title").addEventListener("input", previewProduct);
document.getElementById("price").addEventListener("input", previewProduct);
document.getElementById("description").addEventListener("input", previewProduct);
document.getElementById("image").addEventListener("input", previewProduct);

// 🚀 On Load
window.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  await fetchProducts();
  previewProduct();
});
