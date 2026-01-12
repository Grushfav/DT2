module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0B1D3A',
        teal: '#0FB7A4',
        gold: '#D4AF37'
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'Segoe UI', 'Roboto']
      }
    }
  },
  plugins: []
}
