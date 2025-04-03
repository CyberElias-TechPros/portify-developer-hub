
import { Profile, Project, Skill, Experience, Education, BlogPost } from '../types/portfolio';

export const profile: Profile = {
  id: "1",
  name: "Alex Morgan",
  title: "Full Stack Developer",
  bio: "I'm a passionate full-stack developer with over 5 years of experience building web applications. I specialize in React, Node.js, and TypeScript, and I'm always exploring new technologies to expand my skill set.",
  location: "San Francisco, CA",
  email: "alex@example.com",
  github: "github.com/alexmorgan",
  linkedin: "linkedin.com/in/alexmorgan",
  twitter: "twitter.com/alexmorgan",
  website: "alexmorgan.dev",
  avatarUrl: "/placeholder.svg"
};

export const projects: Project[] = [
  {
    id: "1",
    title: "E-Commerce Platform",
    description: "A full-featured e-commerce platform with payment processing, inventory management, and analytics.",
    longDescription: "This e-commerce platform is built with React, Node.js, and MongoDB. It features a responsive design, user authentication, product filtering, cart functionality, payment processing with Stripe, and admin dashboard for inventory management and analytics. The application is deployed on AWS using Docker and CI/CD with GitHub Actions.",
    tags: ["React", "Node.js", "MongoDB", "Stripe", "AWS"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/alexmorgan/ecommerce",
    demoUrl: "https://ecommerce.alexmorgan.dev",
    featured: true
  },
  {
    id: "2",
    title: "Task Management App",
    description: "A collaborative task management application with real-time updates and team features.",
    longDescription: "This task management app allows teams to collaborate on projects with real-time updates. It includes features like task assignment, due dates, priority levels, comments, file attachments, and progress tracking. Built with React, Firebase, and TypeScript, it's optimized for both desktop and mobile use.",
    tags: ["React", "Firebase", "TypeScript", "Real-time"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/alexmorgan/taskmanager",
    demoUrl: "https://tasks.alexmorgan.dev",
    featured: true
  },
  {
    id: "3",
    title: "Weather Dashboard",
    description: "A weather dashboard that displays current conditions and forecasts for multiple locations.",
    longDescription: "The weather dashboard uses the OpenWeatherMap API to fetch current conditions and 5-day forecasts for multiple locations. Users can save favorite locations and view detailed information including temperature, humidity, wind speed, and precipitation probability. Built with React and Chart.js for data visualization.",
    tags: ["React", "API Integration", "Chart.js"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/alexmorgan/weatherapp",
    demoUrl: "https://weather.alexmorgan.dev",
    featured: false
  },
  {
    id: "4",
    title: "Developer Portfolio Generator",
    description: "A tool that generates customizable developer portfolios from GitHub profiles.",
    longDescription: "This application creates professional developer portfolios by importing data from GitHub profiles and allowing customization through a user-friendly interface. It fetches repository data, contribution graphs, and user information via the GitHub API, then generates a static website that can be deployed to GitHub Pages or Netlify.",
    tags: ["React", "GitHub API", "Static Site Generation"],
    imageUrl: "/placeholder.svg",
    repoUrl: "https://github.com/alexmorgan/portfolio-generator",
    demoUrl: "https://portfolio-gen.alexmorgan.dev",
    featured: false
  }
];

export const skills: Skill[] = [
  {
    id: "1",
    name: "JavaScript",
    category: "languages",
    proficiency: 90
  },
  {
    id: "2",
    name: "TypeScript",
    category: "languages",
    proficiency: 85
  },
  {
    id: "3",
    name: "Python",
    category: "languages",
    proficiency: 75
  },
  {
    id: "4",
    name: "React",
    category: "frameworks",
    proficiency: 90
  },
  {
    id: "5",
    name: "Node.js",
    category: "frameworks",
    proficiency: 80
  },
  {
    id: "6",
    name: "GraphQL",
    category: "frameworks",
    proficiency: 75
  },
  {
    id: "7",
    name: "MongoDB",
    category: "tools",
    proficiency: 80
  },
  {
    id: "8",
    name: "PostgreSQL",
    category: "tools",
    proficiency: 75
  },
  {
    id: "9",
    name: "Docker",
    category: "tools",
    proficiency: 70
  },
  {
    id: "10",
    name: "AWS",
    category: "tools",
    proficiency: 65
  }
];

export const experiences: Experience[] = [
  {
    id: "1",
    company: "Tech Innovators",
    position: "Senior Frontend Developer",
    startDate: "2022-01",
    endDate: null,
    description: "Leading the frontend development team in building a SaaS platform using React and TypeScript. Implemented CI/CD pipelines and improved performance by 40%. Mentoring junior developers and conducting code reviews.",
    location: "San Francisco, CA",
    logoUrl: "/placeholder.svg"
  },
  {
    id: "2",
    company: "Digital Solutions Inc.",
    position: "Full Stack Developer",
    startDate: "2019-03",
    endDate: "2021-12",
    description: "Developed and maintained multiple web applications using React, Node.js, and MongoDB. Collaborated with UX designers to implement responsive designs and improved API performance by 30%.",
    location: "Seattle, WA",
    logoUrl: "/placeholder.svg"
  },
  {
    id: "3",
    company: "WebTech Startup",
    position: "Junior Developer",
    startDate: "2017-06",
    endDate: "2019-02",
    description: "Worked on frontend feature development using JavaScript and React. Participated in agile development processes and contributed to internal tool development.",
    location: "Portland, OR",
    logoUrl: "/placeholder.svg"
  }
];

export const education: Education[] = [
  {
    id: "1",
    institution: "University of California, Berkeley",
    degree: "Master's Degree",
    field: "Computer Science",
    startDate: "2015-09",
    endDate: "2017-05",
    logoUrl: "/placeholder.svg"
  },
  {
    id: "2",
    institution: "Stanford University",
    degree: "Bachelor's Degree",
    field: "Software Engineering",
    startDate: "2011-09",
    endDate: "2015-05",
    logoUrl: "/placeholder.svg"
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Understanding React Hooks: A Deep Dive",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    excerpt: "An in-depth look at React's hooks system and how it can improve your components.",
    slug: "understanding-react-hooks",
    publishDate: "2023-05-15",
    tags: ["React", "JavaScript", "Web Development"],
    coverImageUrl: "/placeholder.svg"
  },
  {
    id: "2",
    title: "Building Scalable Node.js Applications",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    excerpt: "Learn how to structure Node.js applications for scalability and maintainability.",
    slug: "scalable-nodejs-applications",
    publishDate: "2023-03-28",
    tags: ["Node.js", "Backend", "Architecture"],
    coverImageUrl: "/placeholder.svg"
  },
  {
    id: "3",
    title: "TypeScript: Why You Should Make the Switch",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    excerpt: "The benefits of TypeScript and how it can improve your development workflow.",
    slug: "typescript-benefits",
    publishDate: "2023-02-10",
    tags: ["TypeScript", "JavaScript", "Development"],
    coverImageUrl: "/placeholder.svg"
  }
];
