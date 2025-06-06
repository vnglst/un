/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "un-blue": "#009edb",
        "un-dark-blue": "#1f4e79",
        "un-light-blue": "#4fc3f7",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
