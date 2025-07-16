// 🌐 Global Elements
const form = document.getElementById("product-form");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const tagsInput = document.getElementById("tags");
const priceInput = document.getElementById("price");
const imagesInput = document.getElementById("images");
const videoInput = document.getElementById("video");
const previewContainer = document.getElementById("image-preview");
const productTable = document.getElementById("product-table-body");
const discountInput = document.getElementById("discount"); // optional field
const quill = new Quill("#editor", { theme: "snow" });

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
  if (error) {
    log(`❌ Upload error: ${error.message}`);
    throw error;
  }
  const { data } = client.storage.from(bucket).getPublicUrl(uniqueId);
  return data.publicUrl;
}

// 🔄 Load Static Categories
async function fetchCategories() {
  const defaultCategories = [
    "Pain Relief", "Antibiotics", "Skincare", "Cough Syrups", "Tablets", "Injections"
  ];
  categoryInput.innerHTML += defaultCategories.map(c => `<option value="${c}">${c}</option>`).join("");
}

// 🧾 Form Submit (Product Save)
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

  if (!name || !category || !price || imageFiles.length === 0) {
    alert("Please fill all required fields and upload at least one image.");
    return;
  }

  // 🖼 Uploading Images
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

  // 🎞 Uploading Video
  let videoUrl = "";
  if (videoFile) {
    try {
      videoUrl = await uploadFile(videoFile, "product-videos");
      log(`🎞 Uploaded video: ${videoFile.name}`);
    } catch (err) {
      log(`❌ Video upload failed: ${videoFile.name}`);
    }
  }

  // ✅ Saving to Supabase
  const { error } = await client.from("products").insert([{
    name,
    category,
    tags,
    price,
    discount_percent: discount,
    description_html: description,
    image_urls: imageUrls,
    video_url: videoUrl,
    published: true  // default publish for now
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

// 📷 Preview Image
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

// 📥 Load Products into Table
async function loadProducts() {
  const { data, error } = await client
    .from("products")
    .select("id, name, category, price, product_number, discount_percent");

  if (data) {
    productTable.innerHTML = data.map(p => `
      <tr>
        <td>#${p.product_number || "—"}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>
          ${p.discount_percent ? `
            <s>₦${p.price}</s> 
            <strong>(${p.discount_percent}% OFF)</strong>
          ` : `₦${p.price}`}
        </td>
        <td>
          <button onclick="editProduct('${p.id}')">✏️ Edit</button>
          <button onclick="deleteProduct('${p.id}')">🗑 Delete</button>
        </td>
      </tr>
    `).join("");
  }
}

// 🧹 Delete Product
async function deleteProduct(id) {
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) {
    alert("❌ Failed to delete");
  } else {
    alert("🗑 Product deleted");
    loadProducts();
  }
}

// ✏️ Edit Hook (To be implemented)
function editProduct(id) {
  alert("🧪 Edit mode coming soon for product ID: " + id);
}

// 🧭 Load Initial Data
fetchCategories();
loadProducts();
