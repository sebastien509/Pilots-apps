export async function uploadToCloudinary(file) {
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
    const preset = import.meta.env.VITE_CLOUDINARY_PRESET;
    if (!cloud || !preset) throw new Error('Cloudinary env not set');
    const url = `https://api.cloudinary.com/v1_1/${cloud}/auto/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', preset); // unsigned preset for demo
    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    return res.json(); // contains secure_url
    }