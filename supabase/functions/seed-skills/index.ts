
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Define the Supabase URL and key from environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Define types for our data models
interface Skill {
  name: string;
  category: string;
  proficiency: number;
  icon_url?: string;
  year_acquired?: number;
  endorsed?: number;
}

interface Project {
  title: string;
  description: string;
  long_description?: string;
  tags: string[];
  image_url: string;
  repo_url: string;
  demo_url?: string;
  featured: boolean;
  stars?: number;
  forks?: number;
  contributors?: number;
  category?: string;
}

interface Experience {
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string;
  logo_url?: string;
  location: string;
  technologies?: string[];
  projects?: string[];
}

interface BlogPost {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  publish_date: string;
  tags: string[];
  cover_image_url?: string;
  category?: string;
  series?: string;
  reading_time?: number;
  published: boolean;
}

interface SiteSettings {
  key: string;
  value: Record<string, any>;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Define the skill data
    const skills: Skill[] = [
      { name: "JavaScript", category: "languages", proficiency: 90, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg", year_acquired: 2015, endorsed: 32 },
      { name: "TypeScript", category: "languages", proficiency: 85, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg", year_acquired: 2017, endorsed: 27 },
      { name: "Python", category: "languages", proficiency: 75, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", year_acquired: 2018, endorsed: 18 },
      { name: "React", category: "frameworks", proficiency: 92, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg", year_acquired: 2016, endorsed: 45 },
      { name: "Next.js", category: "frameworks", proficiency: 88, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg", year_acquired: 2019, endorsed: 36 },
      { name: "Node.js", category: "frameworks", proficiency: 80, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg", year_acquired: 2016, endorsed: 29 },
      { name: "Tailwind CSS", category: "frameworks", proficiency: 95, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg", year_acquired: 2020, endorsed: 41 },
      { name: "Git", category: "tools", proficiency: 85, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg", year_acquired: 2015, endorsed: 22 },
      { name: "Docker", category: "tools", proficiency: 70, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg", year_acquired: 2019, endorsed: 15 },
      { name: "AWS", category: "tools", proficiency: 65, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg", year_acquired: 2018, endorsed: 12 },
      { name: "GraphQL", category: "other", proficiency: 78, icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg", year_acquired: 2019, endorsed: 20 },
      { name: "REST APIs", category: "other", proficiency: 90, icon_url: null, year_acquired: 2015, endorsed: 25 }
    ];

    // Define project data
    const projects: Project[] = [
      {
        title: "Portfolio Website",
        description: "Personal portfolio website built with React and Tailwind CSS",
        long_description: "A modern, responsive portfolio website showcasing my skills, projects, and experience. Built with React, TypeScript, and Tailwind CSS. Features include dark mode support, contact form, and blog integration.",
        tags: ["React", "TypeScript", "Tailwind CSS"],
        image_url: "/placeholder.svg",
        repo_url: "https://github.com/username/portfolio",
        demo_url: "https://portfolio.example.com",
        featured: true,
        stars: 24,
        forks: 8,
        contributors: 2,
        category: "web"
      },
      {
        title: "E-commerce Platform",
        description: "Full-stack e-commerce application with payment integration",
        long_description: "Complete e-commerce solution with product catalog, shopping cart, user authentication, and Stripe payment integration. Built with Next.js, PostgreSQL, and Tailwind CSS.",
        tags: ["Next.js", "PostgreSQL", "Stripe", "Supabase"],
        image_url: "/placeholder.svg",
        repo_url: "https://github.com/username/ecommerce",
        demo_url: "https://ecommerce.example.com",
        featured: true,
        stars: 56,
        forks: 17,
        contributors: 4,
        category: "web"
      },
      {
        title: "Task Management App",
        description: "Kanban-style task management application",
        long_description: "Productivity tool for managing tasks with kanban boards, drag-and-drop interface, and team collaboration features. Built with React, Redux, and Firebase.",
        tags: ["React", "Redux", "Firebase"],
        image_url: "/placeholder.svg",
        repo_url: "https://github.com/username/taskmanager",
        demo_url: "https://tasks.example.com",
        featured: true,
        stars: 38,
        forks: 12,
        contributors: 3,
        category: "productivity"
      },
      {
        title: "Weather Dashboard",
        description: "Real-time weather data visualization",
        long_description: "Weather forecast application with real-time data from OpenWeather API. Features include current conditions, 5-day forecast, location search, and temperature unit conversion.",
        tags: ["JavaScript", "API", "CSS"],
        image_url: "/placeholder.svg",
        repo_url: "https://github.com/username/weather",
        demo_url: "https://weather.example.com",
        featured: false,
        stars: 15,
        forks: 5,
        contributors: 1,
        category: "utility"
      },
      {
        title: "Recipe Finder",
        description: "Search and save recipes from multiple sources",
        long_description: "Recipe discovery application that allows users to search for recipes by ingredient, save favorites, and create shopping lists. Integrates with multiple recipe APIs.",
        tags: ["React", "Node.js", "MongoDB"],
        image_url: "/placeholder.svg",
        repo_url: "https://github.com/username/recipes",
        demo_url: "https://recipes.example.com",
        featured: false,
        stars: 22,
        forks: 7,
        contributors: 2,
        category: "lifestyle"
      }
    ];

    // Define experience data
    const experiences: Experience[] = [
      {
        company: "Tech Innovations Inc.",
        position: "Senior Frontend Developer",
        start_date: "2021-03-01",
        end_date: null,
        description: "Leading the frontend development team, implementing new features and optimizing performance for the company's main product. Introduced TypeScript and component testing to improve code quality and reliability.",
        logo_url: "/placeholder.svg",
        location: "San Francisco, CA",
        technologies: ["React", "TypeScript", "Redux", "Tailwind CSS"],
        projects: ["Customer Dashboard Redesign", "Performance Optimization Initiative", "Mobile App Integration"]
      },
      {
        company: "WebSolutions Co.",
        position: "Full Stack Developer",
        start_date: "2018-07-01",
        end_date: "2021-02-28",
        description: "Developed and maintained web applications for clients across various industries. Worked on both frontend and backend development using modern JavaScript frameworks and Node.js.",
        logo_url: "/placeholder.svg",
        location: "Austin, TX",
        technologies: ["JavaScript", "Node.js", "Express", "MongoDB", "React"],
        projects: ["E-commerce Platform", "Content Management System", "Real Estate Listing Portal"]
      },
      {
        company: "StartupVision",
        position: "Junior Developer",
        start_date: "2016-05-01",
        end_date: "2018-06-30",
        description: "Contributed to the development of a SaaS platform for startup analytics. Worked in an agile team environment and participated in all stages of the development lifecycle.",
        logo_url: "/placeholder.svg",
        location: "Boston, MA",
        technologies: ["JavaScript", "HTML/CSS", "jQuery", "PHP", "MySQL"],
        projects: ["User Dashboard", "Reporting Module", "Admin Panel"]
      }
    ];

    // Define blog post data
    const blogPosts: BlogPost[] = [
      {
        title: "Getting Started with React and TypeScript",
        content: "This is a comprehensive guide to setting up a new React project with TypeScript...",
        excerpt: "Learn how to set up a new React project with TypeScript for type-safe development.",
        slug: "getting-started-react-typescript",
        publish_date: "2023-04-10",
        tags: ["React", "TypeScript", "Frontend"],
        cover_image_url: "/placeholder.svg",
        category: "Development",
        reading_time: 5,
        published: true
      },
      {
        title: "Building Responsive Layouts with Tailwind CSS",
        content: "In this article, we'll explore how to create responsive designs using Tailwind CSS...",
        excerpt: "Explore the power of utility-first CSS with Tailwind for creating responsive designs.",
        slug: "responsive-layouts-tailwind",
        publish_date: "2023-03-25",
        tags: ["CSS", "Tailwind", "Responsive Design"],
        cover_image_url: "/placeholder.svg",
        category: "Design",
        reading_time: 7,
        published: true
      },
      {
        title: "State Management in Modern React Applications",
        content: "Let's compare different state management approaches from Context API to Redux and Zustand...",
        excerpt: "Compare different state management approaches from Context API to Redux and Zustand.",
        slug: "state-management-react",
        publish_date: "2023-02-17",
        tags: ["React", "State Management", "Redux"],
        cover_image_url: "/placeholder.svg",
        category: "Development",
        reading_time: 10,
        published: true
      },
      {
        title: "Optimizing API Calls with React Query",
        content: "Learn how to implement efficient data fetching strategies with React Query...",
        excerpt: "Learn how to implement efficient data fetching with React Query for better UX.",
        slug: "optimizing-api-calls-react-query",
        publish_date: "2023-01-29",
        tags: ["React", "API", "Performance"],
        cover_image_url: "/placeholder.svg",
        category: "Performance",
        reading_time: 8,
        published: true
      }
    ];

    // Define site settings
    const siteSettings: SiteSettings[] = [
      {
        key: "contact_info",
        value: {
          email: "contact@example.com",
          phone: "+1 (555) 123-4567",
          address: "San Francisco, CA",
          github: "https://github.com/username",
          twitter: "https://twitter.com/username",
          linkedin: "https://linkedin.com/in/username"
        }
      },
      {
        key: "social_links",
        value: {
          github: "https://github.com/username",
          twitter: "https://twitter.com/username",
          linkedin: "https://linkedin.com/in/username",
          instagram: "https://instagram.com/username",
          youtube: "https://youtube.com/@username",
          facebook: "https://facebook.com/username"
        }
      },
      {
        key: "site_info",
        value: {
          title: "Developer Portfolio",
          description: "Personal portfolio and blog showcasing my web development projects and skills.",
          keywords: "web development, frontend, react, javascript, portfolio",
          author: "Your Name",
          logoUrl: "/logo.svg",
          faviconUrl: "/favicon.ico"
        }
      },
      {
        key: "theme",
        value: {
          layout: "multi-page",
          colorScheme: "system",
          primaryColor: "#3b82f6",
          fontFamily: "Inter",
          showBadge: true
        }
      }
    ];

    // Insert skills
    console.log('Seeding skills data...');
    await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { data: skillsData, error: skillsError } = await supabase.from('skills').insert(skills).select();
    
    if (skillsError) {
      throw new Error(`Failed to seed skills: ${skillsError.message}`);
    }

    // Insert projects
    console.log('Seeding projects data...');
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: projectsError } = await supabase.from('projects').insert(projects);
    
    if (projectsError) {
      throw new Error(`Failed to seed projects: ${projectsError.message}`);
    }

    // Insert experiences
    console.log('Seeding experiences data...');
    await supabase.from('experiences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: experiencesError } = await supabase.from('experiences').insert(experiences);
    
    if (experiencesError) {
      throw new Error(`Failed to seed experiences: ${experiencesError.message}`);
    }

    // Insert blog posts
    console.log('Seeding blog posts data...');
    await supabase.from('blog_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: blogPostsError } = await supabase.from('blog_posts').insert(blogPosts);
    
    if (blogPostsError) {
      throw new Error(`Failed to seed blog posts: ${blogPostsError.message}`);
    }

    // Insert site settings
    console.log('Seeding site settings data...');
    await supabase.from('site_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: settingsError } = await supabase.from('site_settings').insert(siteSettings);
    
    if (settingsError) {
      throw new Error(`Failed to seed site settings: ${settingsError.message}`);
    }

    console.log('Seeding completed successfully!');

    return new Response(
      JSON.stringify({ success: true, message: "Database seeded successfully!" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in seed-skills function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
