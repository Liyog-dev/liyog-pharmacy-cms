
// 📦 Final dashboard.js with full image/video edit support
// 🔐 Protect dashboard: Only allow logged-in users (admin only)
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session }, error } = await client.auth.getSession();

  if (error || !session) {
    window.location.href = "auth.html"; // 🔁 redirect to login if not logged in
    return;
  }

  // ✅ OPTIONAL: Check if the user is an admin
  const userEmail = session.user.email;

  // 🛡️ Option 1: Basic email check
  const allowedAdminEmail = "ejumahbartholomew@gmail.com"; // Replace with your actual email
  if (userEmail !== allowedAdminEmail) {
    alert("Access denied. Admins only.");
    await client.auth.signOut();
    window.location.href = "auth.html";
    return;
  }

  // 🛡️ Option 2 (Advanced): Query your profile table to check for a role
  /*
  const { data: profile } = await client
    .from("profile")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    alert("Access denied. Admins only.");
    await client.auth.signOut();
    window.location.href = "/auth.html";
    return;
  }
  */

  // 🟢 If passed, user stays on dashboard
  console.log("✅ Authenticated admin:", userEmail);
});

// 🌐 Global Elements
const form = document.getElementById("product-form");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const tagsInput = document.getElementById("tags");
const priceInput = document.getElementById("price");
const discountInput = document.getElementById("discount");
const imagesInput = document.getElementById("images");
const videoInput = document.getElementById("video");
const youtubeInput = document.getElementById("youtube_url");
const cartonQuantityInput = document.getElementById("carton_quantity");
const publishedInput = document.getElementById("published");
const previewContainer = document.getElementById("image-preview");
const productTable = document.getElementById("product-table-body");
const previewBtn = document.getElementById("preview-btn");
const previewModal = document.getElementById("preview-modal");
const previewContent = document.getElementById("preview-content");
const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filter-category");
const pagination = document.getElementById("pagination");
const videoPreviewContainer = document.getElementById("video-preview") || document.createElement("div");
const submitBtn = document.getElementById("submit-button");
const liyogxCoinsInput = document.getElementById("liyogx_coins");

const quill = new Quill("#editor", { theme: "snow" });
let currentPage = 1;
const pageSize = 5;
let editingProductId = null;
let allImageItems = []; // { type: "existing" | "new", url?, file? }
let existingVideoUrl = "";

const log = (msg) => {
  document.getElementById("log-panel").innerHTML += `> ${msg}<br/>`;
};

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

const showSpinner = (text = "Saving") => {
  const spinnerOverlay = document.createElement("div");
  spinnerOverlay.id = "spinner-overlay";
  spinnerOverlay.style = `
    position: fixed; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(255, 255, 255, 0.9);
    z-index: 10000;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    font-family: Arial; font-weight: bold;
    font-size: 18px; color: green;
  `;
  spinnerOverlay.innerHTML = `
    <div class="spinner"></div>
    <div style="margin-top: 10px;">LiyXStore Global..<br><small>${text}...</small></div>
  `;
  document.body.appendChild(spinnerOverlay);
};

const hideSpinner = () => {
  const spinner = document.getElementById("spinner-overlay");
  if (spinner) spinner.remove();
};

async function uploadFile(file, bucket) {
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2)}_${file.name}`;
  const { error } = await client.storage.from(bucket).upload(uniqueId, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  const { data } = client.storage.from(bucket).getPublicUrl(uniqueId);
  return data.publicUrl;
}

async function fetchCategories() {
  const { data, error } = await client.from("categories").select("name");
  if (error) return console.error("Failed to fetch categories", error);

  categoryInput.innerHTML = '<option value="">Select Category</option>' +
    data.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
  filterCategory.innerHTML = '<option value="">All Categories</option>' +
    data.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
}


function renderImagePreview() {
  previewContainer.innerHTML = "";
  allImageItems.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "preview-wrapper";
    wrapper.setAttribute("draggable", true);

    const img = document.createElement("img");
    img.src = item.type === "existing" ? item.url : URL.createObjectURL(item.file);
    img.className = "preview-img";

    const removeBtn = document.createElement("div");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = "&times;";
    removeBtn.addEventListener("click", () => {
      allImageItems.splice(index, 1);
      renderImagePreview();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    previewContainer.appendChild(wrapper);
  });

  // drag & drop
  let dragged;
  previewContainer.addEventListener("dragstart", (e) => {
    dragged = e.target.closest(".preview-wrapper");
  });

  previewContainer.addEventListener("dragover", (e) => e.preventDefault());

  previewContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    const target = e.target.closest(".preview-wrapper");
    if (dragged && target && dragged !== target) {
      const from = Array.from(previewContainer.children).indexOf(dragged);
      const to = Array.from(previewContainer.children).indexOf(target);
      const moved = allImageItems.splice(from, 1)[0];
      allImageItems.splice(to, 0, moved);
      renderImagePreview();
    }
  });
}

imagesInput.addEventListener("change", () => {
  const newFiles = Array.from(imagesInput.files).map(file => ({ type: "new", file }));
  allImageItems = [...allImageItems, ...newFiles];
  renderImagePreview();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Saving...';
  showSpinner();

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const tags = tagsInput.value.trim();
  const price = parseFloat(priceInput.value);
  const discount = discountInput?.value ? parseFloat(discountInput.value) : null;
  const description = quill.root.innerHTML.trim();
  const youtube_url = youtubeInput.value.trim();
  const carton_quantity = parseInt(cartonQuantityInput.value);
  const published = publishedInput.checked;
  const videoFile = videoInput.files[0];
  const liyogx_coins = liyogxCoinsInput.value ? parseFloat(liyogxCoinsInput.value) : null;


  if (!name || !category || !price) {
    alert("Please fill all required fields.");
    submitBtn.disabled = false;
    submitBtn.textContent = "💾 Save Product";
    hideSpinner();
    return;
  }

  try {
    const imageUrls = [];
    for (let item of allImageItems) {
      if (item.type === "existing") {
        imageUrls.push(item.url);
      } else {
        const url = await uploadFile(item.file, "product-images");
        imageUrls.push(url);
      }
    }

    let videoUrl = existingVideoUrl;
    if (videoFile) {
      videoUrl = await uploadFile(videoFile, "product-videos");
      log(`🎞 Uploaded video: ${videoFile.name}`);
    }

    const productData = {
      name, category, tags, price,
      discount_percent: discount,
      description_html: description,
      published, carton_quantity,
      image_urls: imageUrls,
      video_url: videoUrl,
      ...(youtube_url && { youtube_url }),
      ...(liyogx_coins !== null && { liyogx_coins })
    };

    let response;
    if (editingProductId) {
      response = await client.from("products").update(productData).eq("id", editingProductId);
    } else {
      response = await client.from("products").insert([productData]);
    }

    if (response.error) {
      log(`❌ DB Error: ${response.error.message}`);
      showToast("An error occurred", "error");
    } else {
      showToast(editingProductId ? "Product updated" : "Product created", "success");
      editingProductId = null;
      allImageItems = [];
      existingVideoUrl = "";
      form.reset();
      quill.setContents([]);
      previewContainer.innerHTML = "";
      videoPreviewContainer.innerHTML = "";
      loadProducts();
    }
  } catch (err) {
    log("❌ Upload failed: " + err.message);
    showToast("Upload failed", "error");
  }

  hideSpinner();
  submitBtn.disabled = false;
  submitBtn.textContent = "💾 Save Product";
});

previewBtn.addEventListener("click", () => {
  const name = nameInput.value;
  const category = categoryInput.value;
  const price = priceInput.value;
  const discount = discountInput.value;
  const published = publishedInput.checked;
  const description = quill.root.innerHTML;
  const carton_quantity = cartonQuantityInput.value;
  const youtube_url = youtubeInput.value;

  const imageHTML = allImageItems.map(item => {
    const src = item.type === "existing" ? item.url : URL.createObjectURL(item.file);
    return `<img src="${src}" class="preview-thumb" />`;
  }).join("");

  const videoHTML = videoInput.files[0]
    ? `<video controls class="preview-video"><source src="${URL.createObjectURL(videoInput.files[0])}" /></video>`
    : existingVideoUrl ? `<video controls class="preview-video"><source src="${existingVideoUrl}" /></video>` : "";

  const youtubeEmbed = youtube_url
    ? `<div class="preview-youtube"><iframe width="100%" height="200" src="${youtube_url}" frameborder="0" allowfullscreen></iframe></div>`
    : "";

  previewContent.innerHTML = `
    <div class="preview-header">
      <h2>${name}</h2>
      <button class="close-preview" onclick="previewModal.style.display='none'">✖</button>
    </div>

    <div class="preview-grid">
      <div class="preview-left">
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Price:</strong> ₦${price} ${discount ? `– ${discount}% off` : ""}</p>
        <p><strong>Status:</strong> ${published ? "✅ Published" : "⛔ Unpublished"}</p>
        <p><strong>Carton Quantity:</strong> ${carton_quantity || "N/A"}</p>
        <div class="preview-description">${description}</div>
        ${youtubeEmbed}
      </div>

      <div class="preview-right">
        <div class="preview-images">${imageHTML}</div>
        ${videoHTML}
      </div>
    </div>
  <button onclick="previewModal.style.display='none'">Close Preview</button>
  `;
  previewModal.style.display = "flex";
});

window.editProduct = async function (id) {
  const { data, error } = await client.from("products").select("*").eq("id", id).single();
  if (error) return alert("❌ Failed to load product for editing.");

  editingProductId = id;
  allImageItems = (data.image_urls || []).map(url => ({ type: "existing", url }));
  existingVideoUrl = data.video_url || "";

  nameInput.value = data.name;
  categoryInput.value = data.category;
  tagsInput.value = data.tags || "";
  priceInput.value = data.price;
  discountInput.value = data.discount_percent || "";
  cartonQuantityInput.value = data.carton_quantity || "";
  youtubeInput.value = data.youtube_url || "";
  quill.root.innerHTML = data.description_html || "";
  publishedInput.checked = data.published;
  liyogxCoinsInput.value = data.liyogx_coins || "";

  renderImagePreview();
  videoPreviewContainer.innerHTML = existingVideoUrl ? `<video controls width="200"><source src="${existingVideoUrl}" /></video>` : "";

  form.scrollIntoView({ behavior: "smooth" });
  document.querySelectorAll(".form-group").forEach(f => f.classList.add("editing-highlight"));
  setTimeout(() => {
    document.querySelectorAll(".form-group").forEach(f => f.classList.remove("editing-highlight"));
  }, 2000);

  showToast("✏️ Product loaded for editing", "info");
};

// ... Keep your deleteProduct, loadProducts, fetchCategories as is
window.deleteProduct = async function (id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) {
    showToast("❌ Failed to delete", "error");
  } else {
    showToast("🗑 Product deleted", "success");
    loadProducts();
  }
};

async function loadProducts(page = 1) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const search = searchInput.value.trim();
  const category = filterCategory.value;

  let query = client.from("products").select("*", { count: "exact" }).order("id", { ascending: false }).range(from, to);
  if (search) query = query.ilike("name", `%${search}%`);
  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;
  if (error) return log("❌ Failed to load products");

  productTable.innerHTML = data.map(p => `
    <tr>
      <td>#${p.product_number || p.id}</td>
      <td><img src="${p.image_urls?.[0] || 'https://cdn-icons-png.flaticon.com/512/2965/2965567.png'}" class="thumbnail-img" style="width: 60px; height: 60px; object-fit: cover;" /></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${p.discount_percent ? `<s>₦${p.price}</s> <strong>₦${(p.price * (1 - p.discount_percent / 100)).toFixed(2)} (${p.discount_percent}% OFF)</strong>` : `₦${p.price}`}</td>
      <td>${p.published ? "✅ Published" : "⛔ Unpublished"}</td>
      <td>
        <button onclick="editProduct('${p.id}')">✏️ Edit</button>
        <button onclick="deleteProduct('${p.id}')">🗑 Delete</button>
      </td>
    </tr>
  `).join("");

  const totalPages = Math.ceil(count / pageSize);
  pagination.innerHTML = `
    ${page > 1 ? `<button onclick="loadProducts(${page - 1})">⬅ Prev</button>` : ""}
    Page ${page} of ${totalPages}
    ${page < totalPages ? `<button onclick="loadProducts(${page + 1})">Next ➡</button>` : ""}
  `;
  currentPage = page;
}

searchInput.addEventListener("input", () => loadProducts(1));
filterCategory.addEventListener("change", () => loadProducts(1));

fetchCategories();
loadProducts();
async function logout() {
  await client.auth.signOut();
  window.location.href = "auth.html";
}

