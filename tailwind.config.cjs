/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "onsikku-dark-orange": "#FB923C",
        "light-orange": "#FEC598",
        "button-selected-light-orange": "#FFEDD0",
        "onsikku-main-orange": "#FFF5E9",
        "onsikku-light-gray": "#FAFBFB",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
