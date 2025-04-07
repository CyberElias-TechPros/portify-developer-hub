
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the Deno runtime key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Seed skills
    const skillsData = [
      {
        name: "JavaScript",
        category: "languages",
        proficiency: 90,
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
        yearAcquired: 2018
      },
      {
        name: "TypeScript",
        category: "languages",
        proficiency: 85,
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
        yearAcquired: 2019
      },
      {
        name: "React",
        category: "frameworks",
        proficiency: 92,
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
        yearAcquired: 2018
      },
      {
        name: "Next.js",
        category: "frameworks",
        proficiency: 88,
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
        yearAcquired: 2020
      },
      {
        name: "Node.js",
        category: "frameworks",
        proficiency: 85,
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
        yearAcquired: 2018
      },
      {
        name: "GraphQL",
        category: "tools",
        proficiency: 80,
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg",
        yearAcquired: 2020
      },
      {
        name: "Docker",
        category: "tools",
        proficiency: 75,
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
        yearAcquired: 2021
      },
      {
        name: "AWS",
        category: "tools",
        proficiency: 78,
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
        yearAcquired: 2020
      }
    ];
    
    // Insert skills
    const { error: skillsError } = await supabaseClient
      .from('skills')
      .upsert(skillsData, { onConflict: 'name' });
      
    if (skillsError) {
      throw skillsError;
    }
    
    // Seed projects
    const projectsData = [
      {
        title: "Portfolio Website",
        description: "Personal portfolio website built with React and Tailwind CSS",
        long_description: "A responsive portfolio website showcasing my projects and skills. Built with React, Tailwind CSS, and Framer Motion for animations.",
        tags: ["React", "TypeScript", "Tailwind CSS"],
        image_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
        repo_url: "https://github.com/username/portfolio",
        demo_url: "https://username-portfolio.vercel.app",
        featured: true,
        stars: 15,
        forks: 5,
        contributors: 1,
        category: "Web Development"
      },
      {
        title: "E-commerce Platform",
        description: "Fully functional e-commerce site with payment integration",
        long_description: "A comprehensive e-commerce platform built with Next.js, featuring product catalog, shopping cart, and Stripe payment integration.",
        tags: ["Next.js", "Redux", "Stripe", "MongoDB"],
        image_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
        repo_url: "https://github.com/username/ecommerce",
        demo_url: "https://demo-store.vercel.app",
        featured: true,
        stars: 28,
        forks: 12,
        contributors: 3,
        category: "Web Development"
      },
      {
        title: "Weather App",
        description: "Real-time weather forecast application",
        long_description: "A weather application that provides real-time forecasts based on location. Uses OpenWeather API and Mapbox for geolocation.",
        tags: ["React", "API", "Geolocation"],
        image_url: "https://images.unsplash.com/photo-1530908295418-a12e326966ba",
        repo_url: "https://github.com/username/weather-app",
        demo_url: "https://weather.example.com",
        featured: true,
        stars: 10,
        forks: 2,
        contributors: 1,
        category: "Web Application"
      }
    ];
    
    // Insert projects
    const { error: projectsError } = await supabaseClient
      .from('projects')
      .upsert(projectsData, { onConflict: 'title' });
      
    if (projectsError) {
      throw projectsError;
    }
    
    // Seed blog posts
    const blogPostsData = [
      {
        title: "Getting Started with React Hooks",
        content: "React Hooks were introduced in React 16.8 as a way to use state and other React features without writing a class. In this post, we'll explore the basics of React Hooks and how to use them effectively in your applications.\n\n## What are React Hooks?\n\nHooks are functions that let you \"hook into\" React state and lifecycle features from function components. They don't work inside classes — they let you use React without classes.\n\n## useState Hook\n\nThe useState hook lets you add state to functional components. Here's a simple example:\n\n```jsx\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\n\n## useEffect Hook\n\nThe useEffect hook lets you perform side effects in function components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount in React classes.\n\n```jsx\nimport React, { useState, useEffect } from 'react';\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n\n  // Similar to componentDidMount and componentDidUpdate\n  useEffect(() => {\n    document.title = `You clicked ${count} times`;\n  });\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\n\n## Conclusion\n\nReact Hooks provide a more direct API to the React concepts you already know: props, state, context, refs, and lifecycle. They also offer a new powerful way to compose behavior in your components.",
        excerpt: "Learn how to use React Hooks to add state and other React features to functional components.",
        slug: "getting-started-with-react-hooks",
        publish_date: new Date().toISOString(),
        tags: ["React", "JavaScript", "Web Development"],
        cover_image_url: "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
        category: "Frontend Development",
        series: "React Fundamentals",
        reading_time: 8,
        published: true
      },
      {
        title: "Introduction to TypeScript",
        content: "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. In this post, we'll cover the basics of TypeScript and why you might want to use it in your projects.\n\n## What is TypeScript?\n\nTypeScript is a superset of JavaScript that adds static type definitions. Types provide a way to describe the shape of an object, providing better documentation, and allowing TypeScript to validate that your code is working correctly.\n\n## Why Use TypeScript?\n\nThere are several reasons to use TypeScript:\n\n- **Type Safety**: Catch errors at compile time instead of runtime\n- **Better IDE Support**: Get intelligent code completion, navigation, and refactoring\n- **Improved Readability**: Types serve as documentation\n- **Easier Refactoring**: Make changes with confidence\n\n## Basic Types\n\nHere are some of the basic types in TypeScript:\n\n```typescript\n// Boolean\nlet isDone: boolean = false;\n\n// Number\nlet decimal: number = 6;\nlet hex: number = 0xf00d;\nlet binary: number = 0b1010;\n\n// String\nlet color: string = \"blue\";\ncolor = 'red';\n\n// Array\nlet list: number[] = [1, 2, 3];\nlet fruits: Array<string> = ['apple', 'orange', 'banana'];\n\n// Tuple\nlet x: [string, number] = [\"hello\", 10];\n\n// Enum\nenum Color {Red, Green, Blue}\nlet c: Color = Color.Green;\n\n// Any\nlet notSure: any = 4;\nnotSure = \"maybe a string instead\";\n\n// Void\nfunction warnUser(): void {\n  console.log(\"This is a warning message\");\n}\n\n// Null and Undefined\nlet u: undefined = undefined;\nlet n: null = null;\n\n// Never\nfunction error(message: string): never {\n  throw new Error(message);\n}\n```\n\n## Interfaces\n\nOne of TypeScript's core principles is that type checking focuses on the shape that values have. Interfaces fulfill the role of naming these types and defining contracts within your code.\n\n```typescript\ninterface Person {\n  firstName: string;\n  lastName: string;\n  age?: number; // Optional property\n  readonly id: number; // Read-only property\n}\n\nfunction greet(person: Person) {\n  return `Hello, ${person.firstName} ${person.lastName}`;\n}\n\nlet john: Person = {\n  firstName: \"John\",\n  lastName: \"Doe\",\n  id: 1\n};\n\nconsole.log(greet(john)); // Output: Hello, John Doe\n```\n\n## Conclusion\n\nTypeScript offers a robust type system that can help catch errors early in the development process. It's particularly valuable for large codebases and teams, where maintaining code quality becomes increasingly important.",
        excerpt: "Discover TypeScript - a strongly typed programming language that builds on JavaScript, providing better tooling at any scale.",
        slug: "introduction-to-typescript",
        publish_date: new Date().toISOString(),
        tags: ["TypeScript", "JavaScript", "Programming"],
        cover_image_url: "https://images.unsplash.com/photo-1516116216624-53e697fedbea",
        category: "Programming",
        series: "TypeScript Essentials",
        reading_time: 10,
        published: true
      }
    ];
    
    // Insert blog posts
    const { error: blogsError } = await supabaseClient
      .from('blog_posts')
      .upsert(blogPostsData, { onConflict: 'slug' });
      
    if (blogsError) {
      throw blogsError;
    }
    
    // Seed experiences
    const experiencesData = [
      {
        company: "Tech Innovations Inc.",
        position: "Senior Frontend Developer",
        start_date: "2021-06-01",
        end_date: null,
        description: "Leading frontend development for enterprise applications. Implementing modern web technologies and best practices for scalable applications.",
        logo_url: "https://logo.clearbit.com/techinnovations.example.com",
        location: "San Francisco, CA",
        technologies: ["React", "TypeScript", "GraphQL", "Tailwind CSS"],
        projects: ["Customer Portal Redesign", "Analytics Dashboard"]
      },
      {
        company: "Digital Solutions LLC",
        position: "Frontend Developer",
        start_date: "2019-03-15",
        end_date: "2021-05-30",
        description: "Developed responsive web applications for clients across various industries. Collaborated with designers and backend developers to create seamless user experiences.",
        logo_url: "https://logo.clearbit.com/digitalsolutions.example.com",
        location: "Austin, TX",
        technologies: ["JavaScript", "React", "Redux", "SASS"],
        projects: ["E-commerce Platform", "CRM System"]
      },
      {
        company: "Web Crafters",
        position: "Junior Developer",
        start_date: "2017-09-01",
        end_date: "2019-03-01",
        description: "Built and maintained websites for small to medium-sized businesses. Gained experience in full-stack development and project management.",
        logo_url: "https://logo.clearbit.com/webcrafters.example.com",
        location: "Portland, OR",
        technologies: ["JavaScript", "HTML", "CSS", "Node.js", "MongoDB"],
        projects: ["Portfolio Websites", "Booking System"]
      }
    ];
    
    // Insert experiences
    const { error: experiencesError } = await supabaseClient
      .from('experiences')
      .upsert(experiencesData, { onConflict: 'company,position' });
      
    if (experiencesError) {
      throw experiencesError;
    }
    
    // Seed site settings
    const siteSettingsData = [
      {
        key: "contact_info",
        value: {
          email: "johndoe@example.com",
          phone: "+1 (555) 123-4567",
          address: "San Francisco, CA",
          github: "https://github.com/johndoe",
          twitter: "https://twitter.com/johndoe",
          linkedin: "https://linkedin.com/in/johndoe"
        }
      },
      {
        key: "social_links",
        value: {
          github: "https://github.com/johndoe",
          twitter: "https://twitter.com/johndoe",
          linkedin: "https://linkedin.com/in/johndoe",
          instagram: "https://instagram.com/johndoe",
          youtube: "https://youtube.com/@johndoe",
          facebook: "https://facebook.com/johndoe"
        }
      },
      {
        key: "site_info",
        value: {
          title: "John Doe - Web Developer",
          description: "Portfolio and blog of a passionate web developer specialized in React and TypeScript",
          keywords: "web developer, frontend, react, typescript, portfolio",
          author: "John Doe",
          logoUrl: "/logo.svg",
          faviconUrl: "/favicon.ico"
        }
      }
    ];
    
    // Insert site settings
    const { error: settingsError } = await supabaseClient
      .from('site_settings')
      .upsert(siteSettingsData, { onConflict: 'key' });
      
    if (settingsError) {
      throw settingsError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully seeded database with sample data." 
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
