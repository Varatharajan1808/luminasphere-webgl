# DynamicSphere - WebGL Interactive Orb

A stunning interactive 3D orb built with WebGL, featuring smooth animations, dynamic color palettes, and responsive mouse interactions.

## 🌟 Features

- **Interactive 3D Orb** - Smooth WebGL-rendered sphere with organic deformations
- **4 Color Palettes** - Cyan, Violet, Gold, and Crimson themes
- **Mouse Interactions** - Hover effects and click to change colors
- **Multi-device Support** - Optimized for Desktop and Mobile (supports Touch)
- **Responsive FOV** - Dynamic camera adjustment for portrait and landscape screens
- **Smooth Animations** - Continuous rotation and floating motion

## 🚀 Live Demo

[View Live Demo](https://lumina-sphere.vercel.app/)

## 📁 Project Structure

```
DynamicSphere/
├── index.html          # Main HTML file with styles
├── gl-matrix.js        # Matrix math library
├── geometry.js         # Icosahedron geometry generation
├── shaders.js          # Vertex and fragment shaders
├── app.js              # Main WebGLOrb application
└── README.md           # This file
```

## 🛠️ Technologies

- **WebGL** - 3D graphics rendering
- **gl-matrix** - Matrix and vector math
- **Vanilla JavaScript** - No frameworks needed
- **GLSL** - Shader programming

## 💻 Local Development

1. Clone the repository:
```bash
git clone https://github.com/Varatharajan1808/luminasphere-webgl-main
cd luminasphere-webgl-main
```

2. Open with a local server:
   - **VS Code**: Right-click `index.html` → "Open with Live Server"
   - **Python**: `python -m http.server 8000`
   - **Node.js**: `npx http-server`

3. Open browser to `http://localhost:5500` (or your server's port)

## 🎨 Color Palettes

- **Cyan** - Vibrant teal and dark blue
- **Violet** - Purple gradient
- **Gold** - Warm yellow and orange
- **Crimson** - Red and pink tones

Click the orb to cycle through palettes!

## 📦 Deployment

Deploy to Vercel in seconds:

```bash
npm install -g vercel
vercel
```

Or push to GitHub and import to Vercel dashboard.

## 🎯 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any browser with WebGL support

## 📄 License

MIT License - feel free to use for your projects!

## 👤 Author

**T Varatharajan**
- Portfolio: [your-portfolio.com](https://varatharajanportfolio.vercel.app/)
- GitHub: [Varatharajan1808](https://github.com/Varatharajan1808)

## 🙏 Acknowledgments

- gl-matrix library for matrix operations
- WebGL community for shader techniques# luminasphere-webgl
