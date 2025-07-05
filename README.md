# 🖼️ Framer Plugin – Alt Text Generator
This Framer plugin scans image nodes on the canvas and generates meaningful, concise **alt text** for accessibility using the **Groq LLaMA 4 API**. It lets you quickly apply that alt text back to the canvas with one click.
---

## 🚀 Features
- 🔍 Scans image nodes (`backgroundImage`) in the current canvas
- 🤖 Sends image URLs to Groq’s LLaMA model for alt text generation
- 📝 Displays alt text in a live-updating `<textarea>`
- ✅ Applies alt text back to the image node using Framer Plugin API
---

## 🔌 API Used
### [Groq LLaMA 4 (Scout)](https://groq.com/)
- **Model:** `meta-llama/llama-4-scout-17b-16e-instruct`
- **Endpoint:** `chat.completions.create`
- **Input:** Text + Image URL
- **Output:** AI-generated alt text (accessible label)
---

## 🧪 How to Test the Plugin
1. **Install and Run Framer Plugin Locally**
   - Make sure you have `framer-plugin` setup using Vite (or your preferred setup)
   - Install dependencies:
     ```bash
     npm install
     ```
2. **Create a `.env` file in root**  
   (Don't forget to include `.env` in `.gitignore`)
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```
3. Start the Plugin Development Server
   ```bash
   npm run dev
   ```
4. Open Framer
   - Open your project with image components on the canvas
   - Load the plugin in developer mode
   - The plugin UI will appear on the top right of the canvas
4. Using the Plugin
   - Click "Scan for Images"
   - Click "Generate" on any image to receive alt text
   - Optionally edit the text, then click "Apply" to save the alt attribute
  
---
