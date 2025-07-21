// 📦 Initialize Supabase
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔁 Form State
let isEditing = false;
let editingProductId = null;

// 🎨 Init Quill Editor
let quill;
window.addEventListener("DOMContentLoaded", async () => {
  quill = new Quill('#editor', { theme: 'snow' });
  await loadCategories();
  await fetchProducts();
  previewProduct();
});

// 🔄 Preview Product
function previewProduct() {
  const modal = document.getElementById("preview-modal");
  const content = document.getElementById("preview-content");

  const title = document.getElementById("name").value || "No title";
  const price = document.getElementById("price").value || "0";
  const desc = quill.root.innerHTML || "No description";
  const images = document.getElementById("image-preview").querySelectorAll("img");

  let imageHTML = "";
  images.forEach(img => {
    imageHTML += `<img src="${img.src}" class="preview-img" />`;
  });

  content.innerHTML = `
    <h2>${title}</h2>
    <p><strong>₦${price}</strong></p>
    <div>${desc}</div>
    <div>${imageHTML}</div>
  `;

  modal.style.display = "flex";
}

// 🧹 Reset Form
function resetForm() {
  document.getElementById("product-form").reset();
  document.getElementById("image-preview").innerHTML = "";
  quill.setText('');
  isEditing = false;
  editingProductId = null;
  previewProduct();
}

// 🗂 Load Categories
async function loadCategories() {
  const { data, error } = await supabase.from("categories").select("*");
  const selects = [document.getElementById("category"), document.getElementById("filter-category")];
  selects.forEach(select => select.innerHTML = `<option value="">-- Select Category --</option>`);

  if (error) return alert("Failed to load categories");

  data.forEach(cat => {
    selects.forEach(select => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  });
}

// 💾 Save Product
document.getElementById("product-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("name").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const category = document.getElementById("category").value;
  const tags = document.getElementById("tags").value.trim();
  const discount = parseFloat(document.getElementById("discount").value) || 0;
  const published = document.getElementById("published").checked;
  const description = quill.root.innerHTML;
  const imageElements = document.querySelectorAll("#image-preview img");

  if (!title || isNaN(price) || !category || imageElements.length === 0) {
    alert("Please fill in all required fields and upload at least one image.");
    return;
  }

  const images = [...imageElements].map(img => img.src);

  const payload = {
    title,
    price,
    category,
    tags,
    discount,
    description,
    images,
    published,
    updated_at: new Date(),
  };

  let response;
  if (isEditing && editingProductId) {
    response = await supabase.from("products").update(payload).eq("id", editingProductId);
    alert("Product updated!");
  } else {
    payload.created_at = new Date();
    response = await supabase.from("products").insert(payload);
    alert("Product added!");
  }

  if (response.error) {
    console.error(response.error);
    alert("Error: " + response.error.message);
  } else {
    resetForm();
    fetchProducts();
  }
});

// 🖼 Image Preview
document.getElementById("images").addEventListener("change", function () {
  const preview = document.getElementById("image-preview");
  preview.innerHTML = "";
  [...this.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement("img");
      img.src = reader.result;
      img.className = "thumbnail-img";
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// 👁 Preview Button
document.getElementById("preview-btn").addEventListener("click", previewProduct);
document.getElementById("preview-modal").addEventListener("click", e => {
  if (e.target.id === "preview-modal") e.currentTarget.style.display = "none";
});

// 🧾 Load Products
async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  const tableBody = document.getElementById("product-table-body");
  tableBody.innerHTML = "";

  if (error || !data.length) {
    tableBody.innerHTML = "<tr><td colspan='7'>No products found</td></tr>";
    return;
  }

  data.forEach(prod => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${prod.id}</td>
      <td><img src="${prod.images?.[0] || 'https://via.placeholder.com/50'}" width="50" /></td>
      <td>${prod.title}</td>
      <td>${prod.category}</td>
      <td>₦${prod.price}</td>
      <td>${prod.published ? "✅" : "❌"}</td>
      <td>
        <button onclick="editProduct('${prod.id}')">✏️</button>
        <button onclick="deleteProduct('${prod.id}')">🗑️</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ✏️ Edit Product
window.editProduct = async function (id) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error || !data) {
    alert("Failed to fetch product");
    return;
  }

  document.getElementById("name").value = data.title;
  document.getElementById("price").value = data.price;
  document.getElementById("category").value = data.category;
  document.getElementById("tags").value = data.tags || "";
  document.getElementById("discount").value = data.discount || "";
  document.getElementById("published").checked = data.published;

  quill.root.innerHTML = data.description || "";

  const preview = document.getElementById("image-preview");
  preview.innerHTML = "";
  (data.images || []).forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "thumbnail-img";
    preview.appendChild(img);
  });

  isEditing = true;
  editingProductId = id;
  previewProduct();
};

// 🗑 Delete Product
window.deleteProduct = async function (id) {
  const confirmed = confirm("Are you sure you want to delete this product?");
  if (!confirmed) return;

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    alert("Delete failed");
  } else {
    alert("Product deleted");
    fetchProducts();
  }
};
