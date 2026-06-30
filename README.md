# 🦉 Ibis Physics Portal — Developer & AI Agent Manual

Welcome to the **Ibis Physics Portal** codebase. This repository contains the frontend implementation of a premium, zero-noise, and board-optimized physics learning platform designed by Ganesh.

This document serves as the **unavoidable guidelines, architectural specification, and codebase rules** for any developer—human or AI agent—working on this project. Read it in full before modifying the codebase.

---

## 🎯 Project Overview & Core Philosophy

Ibis is not a standard learning website. It is an immersive, high-fidelity web application built to offer an editorial, distraction-free learning experience. The core design principles are:
* **Rich Aesthetics**: High-end dark mode, glassmorphism, responsive editorial layout, animated mesh gradient backgrounds, and fluid mouse-tracking physics.
* **Zero Noise**: Clean typography (Fraunces + Manrope), interactive visual elements, and zero unnecessary visual clutter.
* **Physics & Math Authenticity**: Integrated KaTeX LaTeX equation rendering, bespoke academic icons, and interactive visual aids.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 18+ (using JSX and TSX modules).
* **Build System**: Vite.
* **Styling**: Vanilla CSS (no TailwindCSS unless explicitly requested; confirm versions first).
* **Animations**: Framer Motion for UI triggers, custom WebGL/Canvas shaders (via OGL and `@paper-design/shaders`) for liquid metal buttons and interactive backdrops.
* **Icons**: Lucide React.
* **Math Typography**: KaTeX.

---

## 📂 Core Directory & File Architecture

* **[src/main.jsx](file:///Users/prafula/Desktop/p/src/main.jsx)**: The central brain of the application. Handles routing via local state hooks (e.g., toggling `screen === "why-ibis"`, `screen === "pricing"`, etc.). It coordinates layout transitions and mounts screens.
* **[src/styles.css](file:///Users/prafula/Desktop/p/src/styles.css)**: The central design system. All custom layout sheets, responsive grid rules, animations, interactive state modifiers, and floating blurred mesh blobs reside here.
* **[src/components/ui/](file:///Users/prafula/Desktop/p/src/components/ui)**: Premium reusable UI components:
  * [award-badge.tsx](file:///Users/prafula/Desktop/p/src/components/ui/award-badge.tsx): Houses dynamic, translucent, 3D-tilting credential badges (CBSE Gold/Amber vs Harvard Silver/Platinum) with custom animated sheens.
  * [liquid-metal-button.tsx](file:///Users/prafula/Desktop/p/src/components/ui/liquid-metal-button.tsx): Liquid metal effect shader button.
  * [FaultyTerminal.jsx](file:///Users/prafula/Desktop/p/src/components/ui/FaultyTerminal.jsx): Retro retro-interactive command-line interface.
  * [switch.tsx](file:///Users/prafula/Desktop/p/src/components/ui/switch.tsx): Custom toggles (e.g. `RockerSwitch`).
  * [timeline-animation.tsx](file:///Users/prafula/Desktop/p/src/components/ui/timeline-animation.tsx): Sequential fade-in/out triggers.

---

## 🚫 UNAVOIDABLE AGENT RULES (Development Contracts)

### Rule 1: Viewport & Scroll Containment
* **Never let containers or screens overflow the viewport height.**
* If page content is long, always confine the scroll internal to the screen wrapper using `height: 100vh; overflow-y: auto;` or grid row constraints.
* Resizing the browser window to mobile or tablet viewport must stack elements vertically and permit clean internal scrolling without cutting off layouts.

### Rule 2: CSS Styling Hygiene & Conventions
* Do **NOT** use CSS Utility libraries (like TailwindCSS) or inline CSS overrides for layout styling unless explicitly instructed by the user.
* Maintain all styles inside [src/styles.css](file:///Users/prafula/Desktop/p/src/styles.css).
* Use CSS `clamp()` and relative viewport units (`vh`, `vw`, `em`) for headings, text spacing, and margins to ensure responsive fluidity.

### Rule 3: Dynamic Theme Contrast & Legibility
* When designing transparent/glass panels, do **NOT** use generic white transparency over warm clay/terracotta gradients, as it creates low-contrast blending.
* Always define dynamic theme parameters (backdrop filters, border colors, icon fills, and sheens) using specific HSL/RGBA definitions to ensure they pop distinctly (e.g., Gold/Amber theme vs Silver/Platinum theme).

### Rule 4: Preserving Code Integrity
* Keep all comments, inline documentation, and unrelated helper functions intact.
* When executing edits, make targeted replacements to preserve existing state bindings, timeline indexes, and animation transitions.

### Rule 5: No Obvious AI Clichés
* Do not use generic icons (like the lightning `Zap` symbol) for checkout actions or premiums. Use academic-themed or physics-themed graphics (like `AcademicHatIcon` / graduation caps).
* Make layout designs feel premium, state-of-the-art, and custom-tailored.

---

## 🚀 Running & Developing

### Local Dev Server
Start the development server with:
```bash
npm run dev
```
By default, the package script sets host and port flags, but always check Vite's console output for the active port (usually `3002` or `3005`).

### Production Build Verification
Before finishing any modifications, always verify that the project compiles successfully:
```bash
npm run build
```
Ensure zero bundle compile errors or code-splitting errors are generated.
