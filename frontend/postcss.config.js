export default {
    plugins: {
        // Keep Vercel/PostCSS on the canonical config even when other
        // Tailwind config files are present in the workspace.
        tailwindcss: { config: './tailwind.config.ts' },
        autoprefixer: {},
    },
}
