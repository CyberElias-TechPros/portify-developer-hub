
export const profile = {
  name: "Ellis Graham",
  title: "Full Stack Developer",
  bio: "Passionate about building beautiful, functional, and accessible web applications. I specialize in React, TypeScript, and Node.js.",
  location: "San Francisco, CA",
  email: "ellisgraham@example.com",
  phone: "+1 (555) 123-4567",
  avatarUrl: "/placeholder.svg",
  website: "https://ellisgraham.dev",
  github: "https://github.com/ellisgraham",
  twitter: "https://twitter.com/ellisgraham",
  linkedin: "https://linkedin.com/in/ellisgraham",
};

export const experiences = [
  {
    id: "1",
    company: "TechNova",
    position: "Senior Frontend Developer",
    startDate: "2021-03",
    endDate: null,
    current: true,
    description: "Lead frontend development for enterprise SaaS products. Implemented new features and improved performance by 40%.",
    location: "San Francisco, CA",
    logoUrl: "/placeholder.svg",
    technologies: ["React", "TypeScript", "GraphQL", "Tailwind CSS"],
    projects: ["Dashboard Redesign", "Authentication System", "Analytics Platform"]
  },
  {
    id: "2",
    company: "CodeWave Solutions",
    position: "Full Stack Developer",
    startDate: "2018-07",
    endDate: "2021-02",
    current: false,
    description: "Developed and maintained web applications for clients across various industries. Worked on both frontend and backend technologies.",
    location: "Boston, MA",
    logoUrl: "/placeholder.svg",
    technologies: ["React", "Node.js", "MongoDB", "Express"],
    projects: ["E-commerce Platform", "CRM System", "Booking Application"]
  },
  {
    id: "3",
    company: "InnoTech Startups",
    position: "Junior Web Developer",
    startDate: "2016-05",
    endDate: "2018-06",
    current: false,
    description: "Started as an intern and grew into a full-time role. Worked on developing and maintaining websites for multiple startups.",
    location: "New York, NY",
    logoUrl: "/placeholder.svg",
    technologies: ["JavaScript", "HTML", "CSS", "jQuery"],
    projects: ["Company Website", "Blog System", "Newsletter Integration"]
  }
];

export const skills = [
  {
    id: "1",
    name: "React",
    category: "frameworks",
    proficiency: 95,
    yearAcquired: 2018,
    endorsed: 28,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "2",
    name: "TypeScript",
    category: "languages",
    proficiency: 90,
    yearAcquired: 2019,
    endorsed: 22,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Node.js",
    category: "frameworks",
    proficiency: 85,
    yearAcquired: 2017,
    endorsed: 19,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "4",
    name: "GraphQL",
    category: "tools",
    proficiency: 80,
    yearAcquired: 2020,
    endorsed: 15,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "5",
    name: "Tailwind CSS",
    category: "frameworks",
    proficiency: 90,
    yearAcquired: 2020,
    endorsed: 17,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "6",
    name: "MongoDB",
    category: "tools",
    proficiency: 75,
    yearAcquired: 2018,
    endorsed: 12,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "7",
    name: "PostgreSQL",
    category: "tools",
    proficiency: 85,
    yearAcquired: 2017,
    endorsed: 16,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "8",
    name: "Docker",
    category: "tools",
    proficiency: 70,
    yearAcquired: 2019,
    endorsed: 10,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "9",
    name: "AWS",
    category: "tools",
    proficiency: 75,
    yearAcquired: 2019,
    endorsed: 14,
    iconUrl: "/placeholder.svg",
  },
  {
    id: "10",
    name: "Next.js",
    category: "frameworks",
    proficiency: 85,
    yearAcquired: 2020,
    endorsed: 18,
    iconUrl: "/placeholder.svg",
  }
];

export const projects = [
  {
    id: "1",
    title: "Portfolio Website",
    description: "A personal portfolio website built with React, TypeScript, and Tailwind CSS.",
    longDescription: "This portfolio website showcases my work and skills. It's built with React, TypeScript, and Tailwind CSS. It features a responsive design, dark mode, and a custom CMS.",
    tags: ["React", "TypeScript", "Tailwind CSS"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/ellisgraham/portfolio",
    demoUrl: "https://portfolio.ellisgraham.dev",
    featured: true,
    stars: 48,
    forks: 12,
    contributors: 2,
    category: "Web Development"
  },
  {
    id: "2",
    title: "Task Management App",
    description: "A task management application with drag-and-drop functionality.",
    longDescription: "A full-featured task management application with drag-and-drop functionality, user authentication, and real-time updates. Built with React, Node.js, and MongoDB.",
    tags: ["React", "Node.js", "MongoDB", "Express"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/ellisgraham/task-management",
    demoUrl: "https://tasks.ellisgraham.dev",
    featured: true,
    stars: 76,
    forks: 24,
    contributors: 3,
    category: "Web Application"
  },
  {
    id: "3",
    title: "Weather Dashboard",
    description: "A weather dashboard that displays current weather and forecasts.",
    longDescription: "A weather dashboard that displays current weather conditions and forecasts for multiple locations. Built with React, OpenWeatherMap API, and Chart.js.",
    tags: ["React", "API", "Chart.js"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/ellisgraham/weather-dashboard",
    demoUrl: "https://weather.ellisgraham.dev",
    featured: false,
    stars: 32,
    forks: 8,
    contributors: 1,
    category: "Web Application"
  },
  {
    id: "4",
    title: "E-commerce Platform",
    description: "A full-featured e-commerce platform with payment integration.",
    longDescription: "A full-featured e-commerce platform with product management, cart functionality, and payment integration. Built with React, Node.js, and MongoDB.",
    tags: ["React", "Node.js", "MongoDB", "Stripe"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/ellisgraham/ecommerce-platform",
    demoUrl: "https://ecommerce.ellisgraham.dev",
    featured: true,
    stars: 124,
    forks: 36,
    contributors: 5,
    category: "Web Application"
  },
  {
    id: "5",
    title: "Markdown Blog",
    description: "A simple markdown blog built with Next.js and MDX.",
    longDescription: "A simple markdown blog built with Next.js and MDX. Features syntax highlighting, dark mode, and a custom theme.",
    tags: ["Next.js", "MDX", "Tailwind CSS"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/ellisgraham/markdown-blog",
    demoUrl: "https://blog.ellisgraham.dev",
    featured: false,
    stars: 28,
    forks: 6,
    contributors: 1,
    category: "Web Development"
  }
];

export const education = [
  {
    id: "1",
    institution: "Massachusetts Institute of Technology",
    degree: "Master's",
    field: "Computer Science",
    startDate: "2014-09",
    endDate: "2016-05",
    logoUrl: "/placeholder.svg"
  },
  {
    id: "2",
    institution: "University of California, Berkeley",
    degree: "Bachelor's",
    field: "Computer Science",
    startDate: "2010-09",
    endDate: "2014-05",
    logoUrl: "/placeholder.svg"
  }
];

export const testimonials = [
  {
    id: "1",
    name: "Sarah Johnson",
    position: "CTO",
    company: "TechNova",
    text: "Ellis is an exceptional developer with a keen eye for detail. Their work consistently exceeds expectations, and they're a valuable asset to any team.",
    date: "2023-01-15"
  },
  {
    id: "2",
    name: "Michael Chen",
    position: "Product Manager",
    company: "CodeWave Solutions",
    text: "Working with Ellis was a pleasure. They understand client needs and deliver high-quality solutions that align perfectly with business objectives.",
    date: "2022-11-03"
  },
  {
    id: "3",
    name: "Jessica Williams",
    position: "CEO",
    company: "InnoTech Startups",
    text: "Ellis helped us transform our digital presence. Their technical expertise and problem-solving skills made our project a resounding success.",
    date: "2022-07-22"
  }
];
