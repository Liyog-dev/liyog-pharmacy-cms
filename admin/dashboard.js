‎// ✅ dashboard.js (Fully Patched – Multi Image Upload, Preview, Logging)
‎
‎const log = (msg) => {
‎  const logPanel = document.getElementById("log-panel");
‎  logPanel.innerHTML += `> ${msg}<br/>`;
‎};
‎
‎const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
‎
‎const form = document.getElementById("product-form");
‎const nameInput = document.getElementById("name");
‎const categoryInput = document.getElementById("category");
‎const tagsInput = document.getElementById("tags");
‎const priceInput = document.getElementById("price");
‎const imagesInput = document.getElementById("images");
‎const videoInput = document.getElementById("video");
‎const previewContainer = document.getElementById("image-preview");
‎const productTable = document.getElementById("product-table-body");
‎
‎const quill = new Quill("#editor", { theme: "snow" });
‎
‎async function uploadFile(file, bucket) {
‎  const path = `products/${Date.now()}_${file.name}`;
‎  const { error } = await supabase.storage.from(bucket).upload(path, file);
‎  if (error) throw error;
‎  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
‎  return data.publicUrl;
‎}
‎
‎async function fetchCategories() {
‎  const { data, error } = await supabase.from("products").select("category");
‎  if (data) {
‎    const uniqueCategories = [...new Set(data.map(p => p.category))];
‎    categoryInput.innerHTML += uniqueCategories.map(c => `<option value="${c}">${c}</option>`).join("");
‎  }
‎}
‎
‎form.addEventListener("submit", async (e) => {
‎  e.preventDefault();
‎
‎  const name = nameInput.value.trim();
‎  const category = categoryInput.value;
‎  const tags = tagsInput.value.trim();
‎  const price = parseFloat(priceInput.value);
‎  const description = quill.root.innerHTML.trim();
‎  const imageFiles = Array.from(imagesInput.files);
‎  const videoFile = videoInput.files[0];
‎
‎  if (!name || !category || !price || imageFiles.length === 0) {
‎    alert("Please fill all required fields and upload at least one image.");
‎    return;
‎  }
‎
‎  const imageUrls = [];
‎  for (let file of imageFiles) {
‎    try {
‎      const url = await uploadFile(file, "product-images");
‎      imageUrls.push(url);
‎      log(`✅ Uploaded image: ${file.name}`);
‎    } catch (err) {
‎      log(`❌ Failed image: ${file.name}`);
‎      alert("Image upload failed. Check log.");
‎      return;
‎    }
‎  }
‎
‎  let videoUrl = "";
‎  if (videoFile) {
‎    try {
‎      videoUrl = await uploadFile(videoFile, "product-videos");
‎      log(`🎞 Uploaded video: ${videoFile.name}`);
‎    } catch (err) {
‎      log(`❌ Video upload failed: ${videoFile.name}`);
‎    }
‎  }
‎
‎  const { error } = await supabase.from("products").insert([{
‎    name, category, tags, price,
‎    description_html: description,
‎    image_urls: imageUrls,
‎    video_url: videoUrl
‎  }]);
‎
‎  if (error) {
‎    log(`❌ DB Error: ${error.message}`);
‎    alert("Failed to upload product.");
‎  } else {
‎    log("✅ Product saved successfully.");
‎    alert("Product uploaded!");
‎    form.reset();
‎    quill.setContents([]);
‎    previewContainer.innerHTML = "";
‎    loadProducts();
‎  }
‎});
‎
‎imagesInput.addEventListener("change", () => {
‎  previewContainer.innerHTML = "";
‎  [...imagesInput.files].forEach(file => {
‎    const reader = new FileReader();
‎    reader.onload = e => {
‎      const img = document.createElement("img");
‎      img.src = e.target.result;
‎      img.className = "preview-img";
‎      previewContainer.appendChild(img);
‎    };
‎    reader.readAsDataURL(file);
‎  });
‎});
‎
‎async function loadProducts() {
‎  const { data, error } = await supabase.from("products").select("id, name, category, price");
‎  if (data) {
‎    productTable.innerHTML = data.map(p => `
‎      <tr>
‎        <td>${p.name}</td>
‎        <td>${p.category}</td>
‎        <td>₦${p.price}</td>
‎        <td><button onclick="deleteProduct('${p.id}')">🗑 Delete</button></td>
‎      </tr>`).join("");
‎  }
‎}
‎
‎async function deleteProduct(id) {
‎  const { error } = await supabase.from("products").delete().eq("id", id);
‎  if (error) {
‎    alert("Failed to delete");
‎  } else {
‎    alert("Deleted");
‎    loadProducts();
‎  }
‎}
‎
‎fetchCategories();
‎loadProducts();
‎
