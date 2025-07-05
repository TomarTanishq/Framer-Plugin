import { framer, CanvasNode } from "framer-plugin"
import { useState, useEffect } from "react"
import Groq from "groq-sdk/index.mjs"
import "./App.css"

const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
})

framer.showUI({
    position: "top right",
    width: 360,
    height: 600,
})

interface ImageInfo {
    node: CanvasNode
    id: string
    name: string
    src: string
    currentAltText?: string
    generatedAltText?: string
    isGenerating: boolean
    error?: string
}

async function llamaAltTextService(imageUrl: string): Promise<string> {
    try {
        const chatCompletion = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            max_tokens: 200,
            top_p: 1.0,
            stream: false,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Generate a concise and helpful alt text for accessibility:" },
                        { type: "image_url", image_url: { url: imageUrl } },
                    ],
                },
            ],
        })

        return chatCompletion.choices?.[0]?.message?.content?.trim() || "No alt text generated"
    } catch (error) {
        console.error("Groq SDK error:", error)
        return "Failed to generate alt text"
    }
}

export function App() {
    const [images, setImages] = useState<ImageInfo[]>([])
    const [isScanning, setIsScanning] = useState(false)

    const scanForImages = async () => {
        setIsScanning(true)
        setImages([])

        try {
            console.log("Requesting image nodes...")
            const imageNodes = await framer.getNodesWithAttributeSet("backgroundImage")

            if (!imageNodes.length) {
                console.warn("No image nodes found. Trying selected image.")
                const selectedImage = await framer.getImage()
                if (selectedImage) {
                    imageNodes.push(selectedImage)
                }
            }

            const scannedImages: ImageInfo[] = []

            for (const node of imageNodes) {
                const bg = (node as any).backgroundImage
                if (!bg?.url) continue

                scannedImages.push({
                    node,
                    id: node.id,
                    name: node.name || `Image ${node.id}`,
                    src: bg.url,
                    currentAltText: bg.altText || "",
                    isGenerating: false,
                })
            }

            setImages(scannedImages)
        } catch (err) {
            console.error("Image scan error:", err)
        } finally {
            setIsScanning(false)
        }
    }

    const generateAltTextForImage = async (index: number) => {
        const image = images[index]
        if (!image.src) return updateImageError(index, "No image source")

        setImages(prev =>
            prev.map((img, i) => i === index ? { ...img, isGenerating: true, error: undefined } : img)
        )

        const altText = await llamaAltTextService(image.src)

        setImages(prev =>
            prev.map((img, i) => i === index ? { ...img, generatedAltText: altText, isGenerating: false } : img)
        )
    }

    const updateImageError = (index: number, error: string) => {
        setImages(prev =>
            prev.map((img, i) => i === index ? { ...img, error, isGenerating: false } : img)
        )
    }

    const updateAltText = (index: number, altText: string) => {
        setImages(prev =>
            prev.map((img, i) => i === index ? { ...img, generatedAltText: altText } : img)
        )
    }

    const applyAltText = async (index: number) => {
        const image = images[index]
        const altText = image.generatedAltText?.trim() || image.currentAltText?.trim() || ""

        try {
            const bg = (image.node as any).backgroundImage
            if (!bg || !bg.cloneWithAttributes) throw new Error("Image node lacks backgroundImage")

            await (image.node as any).setAttributes({
                backgroundImage: bg.cloneWithAttributes({ altText }),
            })

            setImages(prev =>
                prev.map((img, i) => i === index ? { ...img, currentAltText: altText } : img)
            )
        } catch (error) {
            console.error("Apply error:", error)
            updateImageError(index, "Failed to apply alt text")
        }
    }

    useEffect(() => {
        scanForImages()
    }, [])

    return (
        <main className="alt-text-plugin">
            <h2>Alt Text Generator</h2>
            <button onClick={scanForImages} disabled={isScanning}>
                {isScanning ? "Scanning..." : "Scan for Images"}
            </button>

            <div className="images-list">
                {images.map((image, index) => (
                    <div key={image.id} className="image-item">
                        <img src={image.src} alt="Preview" style={{ width: "100%", maxHeight: "200px" }} />
                        <p>Current Alt: {image.currentAltText}</p>

                        <button onClick={() => generateAltTextForImage(index)} disabled={image.isGenerating}>
                            {image.isGenerating ? "Generating..." : "Generate"}
                        </button>

                        {image.generatedAltText && (
                            <div>
                                <label>Generated Alt Text:</label>
                                <textarea
                                    className="streamed-alt-text"
                                    value={image.generatedAltText}
                                    onChange={(e) => updateAltText(index, e.target.value)}
                                    rows={1}
                                    onInput={(e) => {
                                        const el = e.currentTarget;
                                        el.style.height = "auto";
                                        el.style.height = el.scrollHeight + "px";
                                    }}
                                />

                                <button onClick={() => applyAltText(index)}>Apply</button>
                            </div>
                        )}


                        {image.error && <p style={{ color: "red" }}>⚠️ {image.error}</p>}
                    </div>
                ))}
            </div>
        </main>
    )
}
