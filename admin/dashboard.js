// 🌐 Global Elements
const form = document.getElementById("product-form");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const tagsInput = document.getElementById("tags");
const priceInput = document.getElementById("price");
const discountInput = document.getElementById("discount");
const imagesInput = document.getElementById("images");
const videoInput = document.getElementById("video");
const publishedInput = document.getElementById("published");
const previewContainer = document.getElementById("image-preview");
const productTable = document.getElementById("product-table-body");
const previewBtn = document.getElementById("preview-btn");
const previewModal = document.getElementById("preview-modal");
const previewContent = document.getElementById("preview-content");
const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filter-category");
const pagination = document.getElementById("pagination");

const quill = new Quill("#editor", { theme: "snow" });

let currentPage = 1;
const pageSize = 5;

// 🧠 Logging Panel
const log = (msg) => {
  document.getElementById("log-panel").innerHTML += `> ${msg}<br/>`;
};

// ☁️ Uploading Files to Supabase
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

// 🔄 Load Static Categories
async function fetchCategories() {
  const categories = [
    "Pain Relief", "Antibiotics", "Skincare", "Cough Syrups", "Tablets", "Injections"
  ];
  categoryInput.innerHTML += categories.map(c => `<option value="${c}">${c}</option>`).join("");
  filterCategory.innerHTML += categories.map(c => `<option value="${c}">${c}</option>`).join("");
}

// 💾 Form Submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const category = categoryInput.value;
  const tags = tagsInput.value.trim();
  const price = parseFloat(priceInput.value);
  const discount = discountInput?.value ? parseFloat(discountInput.value) : null;
  const description = quill.root.innerHTML.trim();
  const imageFiles = Array.from(imagesInput.files);
  const videoFile = videoInput.files[0];
  const published = publishedInput.checked;

  if (!name || !category || !price || imageFiles.length === 0) {
    alert("Please fill all required fields and upload at least one image.");
    return;
  }

  const imageUrls = [];
  for (let file of imageFiles) {
    try {
      const url = await uploadFile(file, "product-images");
      imageUrls.push(url);
      log(`✅ Uploaded image: ${file.name}`);
    } catch (err) {
      log(`❌ Image upload failed: ${file.name}`);
      return;
    }
  }

  let videoUrl = "";
  if (videoFile) {
    try {
      videoUrl = await uploadFile(videoFile, "product-videos");
      log(`🎞 Uploaded video: ${videoFile.name}`);
    } catch (err) {
      log(`❌ Video upload failed: ${videoFile.name}`);
    }
  }

  const { error } = await client.from("products").insert([{
    name, category, tags, price,
    discount_percent: discount,
    description_html: description,
    image_urls: imageUrls,
    video_url: videoUrl,
    published
  }]);

  if (error) {
    log(`❌ DB Error: ${error.message}`);
    alert("Failed to upload product.");
  } else {
    log("✅ Product saved!");
    alert("Product uploaded successfully!");
    form.reset();
    quill.setContents([]);
    previewContainer.innerHTML = "";
    loadProducts();
  }
});

// 🖼 Image Preview
imagesInput.addEventListener("change", () => {
  previewContainer.innerHTML = "";
  [...imagesInput.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.className = "preview-img";
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// 👁 Preview Modal
previewBtn.addEventListener("click", () => {
  const name = nameInput.value;
  const category = categoryInput.value;
  const price = priceInput.value;
  const discount = discountInput.value;
  const description = quill.root.innerHTML;
  const published = publishedInput.checked;

  previewContent.innerHTML = `
    <h2>${name}</h2>
    <p><strong>Category:</strong> ${category}</p>
    <p><strong>Price:</strong> ₦${price} ${discount ? `– ${discount}% off` : ""}</p>
    <p><strong>Status:</strong> ${published ? "Published" : "Unpublished"}</p>
    <div>${description}</div>
    <button onclick="previewModal.style.display='none'">Close Preview</button>
  `;
  previewModal.style.display = "flex";
});

// 🧹 Delete Product
async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) {
    alert("❌ Failed to delete");
  } else {
    alert("🗑 Product deleted");
    loadProducts();
  }
}

// ✏️ Edit Product
async function editProduct(id) {
  const { data, error } = await client.from("products").select("*").eq("id", id).single();
  if (error) return alert("❌ Failed to load product for editing.");

  nameInput.value = data.name;
  categoryInput.value = data.category;
  tagsInput.value = data.tags || "";
  priceInput.value = data.price;
  discountInput.value = data.discount_percent || "";
  quill.root.innerHTML = data.description_html || "";
  publishedInput.checked = data.published;

  alert("✏️ Product loaded for editing. Save to overwrite.");
  // Add logic to "update" instead of "insert" (if needed)
}

// 📥 Load Products with Filters and Pagination
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
      <td>#${p.id}</td>
      <td><img src="${p.image_urls?.[0] || ""}" class="thumbnail-img"/></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>
        ${p.discount_percent ? `
          <s>₦${p.price}</s> 
          <strong>₦${(p.price * (1 - p.discount_percent / 100)).toFixed(2)} (${p.discount_percent}% OFF)</strong>
        ` : `₦${p.price}`}
      </td>
      <td>${p.published ? "✅ Published" : "⛔ Unpublished"}</td>
      <td>
        <button onclick="editProduct('${p.id}')">✏️ Edit</button>
        <button onclick="deleteProduct('${p.id}')">🗑 Delete</button>
      </td>
    </tr>
  `).join("");

  // Pagination
  const totalPages = Math.ceil(count / pageSize);
  pagination.innerHTML = `
    ${page > 1 ? `<button onclick="loadProducts(${page - 1})">⬅ Prev</button>` : ""}
    Page ${page} of ${totalPages}
    ${page < totalPages ? `<button onclick="loadProducts(${page + 1})">Next ➡</button>` : ""}
  `;
  currentPage = page;
}

// 🔍 Filters
searchInput.addEventListener("input", () => loadProducts(1));
filterCategory.addEventListener("change", () => loadProducts(1));

// 🚀 Initial Boot
fetchCategories();
loadProducts();
