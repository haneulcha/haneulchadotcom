module.exports = {
  //-- SITE SETTINGS -----
  author: "@haneulcha",
  siteTitle: "Haneul Cha's Portfolio",
  siteShortTitle: "Haneul Cha", // Used as logo text in header, footer, and splash screen
  siteDescription: "Haneul Cha, a junior frontend developer, shows her works",
  siteUrl: "https://chahaneul.me",
  siteLanguage: "en_US",
  siteIcon: "content/portfolio-favicon.png", // Relative to gatsby-config file
  seoTitleSuffix: "Haneul Cha's Portfolio", // SEO title syntax will be e.g. "Imprint - {seoTitleSuffix}"

  // -- THEME SETTINGS -----
  colors: {
    lightTheme: {
      primary: "#0A0A0A",
      secondary: "#6CB865", //Bud Green
      tertiary: "#C43140", // CARDINAL
      quaternary: "#0269B3", // HONOLULU BLUE
      text: "#040F0F", // Rich Black FOGRA 39
      subtext: "#555555",
      background: "#e9ecef", // CULTURED
      card: "#FFFFFF",
      scrollBar: "rgba(0, 0, 0, 0.5)",
      boxShadow: "rgba(0, 0, 0, 0.16)",
      boxShadowHover: "rgba(0, 0, 0, 0.32)",
    },
    darkTheme: {
      primary: "#FAFAFA",
      secondary: "#2A2926",
      tertiary: "#252525",
      text: "rgba(255, 255, 255, 0.87)",
      subtext: "#AAAAAA",
      background: "#121212",
      card: "#1C1C1C",
      scrollBar: "rgba(255, 255, 255, 0.5)",
      boxShadow: "rgba(0, 0, 0, 0.16)",
      boxShadowHover: "rgba(0, 0, 0, 0.32)",
    },
  },
  fonts: {
    primary: "Roboto, Arial, sans-serif",
  },

  //-- ARTICLES SECTION SETTINGS -----
  // You can create your own Medium feed with this rss to json converter: https://rss2json.com/
  // To access your Medium RSS feed, just replace this url with your username: https://medium.com/feed/@{yourname}
  // mediumRssFeed:
  //   "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmedium.com%2Ffeed%2F%40konstantinmuenster",
  // shownArticles: 3,

  //-- SOCIAL MEDIA SETTINGS -----
  // There are icons available for the following platforms:
  // Medium, GitHub, LinkedIn, XING, Behance
  socialMedia: [
    {
      name: "Linkedin",
      url: "https://www.linkedin.com/in/haneulcha/",
    },
    {
      name: "Github",
      url: "https://github.com/haneulcha/",
    },
    {
      name: "Blog",
      url: "https://haneulcha.github.io/",
    },
  ],

  //-- NAVIGATION SETTINGS -----
  navLinks: {
    menu: [
      {
        name: "About",
        url: "/#about",
      },
      {
        name: "Project",
        url: "/#projects",
      },
    ],
    button: {
      name: "Contact",
      url: "/#contact",
    },
  },
  footerLinks: [
    {
      name: "Privacy", //TODO
      url: "/privacy",
    },
    {
      name: "Imprint", //TODO
      url: "/imprint",
    },
  ],
}
