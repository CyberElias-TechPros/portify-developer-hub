
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample skills data
const sampleSkills = [
  {
    name: "JavaScript",
    category: "languages",
    proficiency: 92,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
    year_acquired: 2016,
    endorsed: 32
  },
  {
    name: "TypeScript",
    category: "languages",
    proficiency: 88,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    year_acquired: 2018,
    endorsed: 28
  },
  {
    name: "React",
    category: "frameworks",
    proficiency: 95,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    year_acquired: 2017,
    endorsed: 45
  },
  {
    name: "Next.js",
    category: "frameworks",
    proficiency: 90,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    year_acquired: 2019,
    endorsed: 30
  },
  {
    name: "Node.js",
    category: "frameworks",
    proficiency: 85,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    year_acquired: 2017,
    endorsed: 25
  },
  {
    name: "Docker",
    category: "tools",
    proficiency: 78,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
    year_acquired: 2020,
    endorsed: 15
  },
  {
    name: "AWS",
    category: "tools",
    proficiency: 82,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
    year_acquired: 2019,
    endorsed: 20
  },
  {
    name: "GraphQL",
    category: "other",
    proficiency: 80,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg",
    year_acquired: 2020,
    endorsed: 18
  },
  {
    name: "Tailwind CSS",
    category: "frameworks",
    proficiency: 95,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg",
    year_acquired: 2020,
    endorsed: 38
  },
  {
    name: "Python",
    category: "languages",
    proficiency: 75,
    icon_url: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
    year_acquired: 2015,
    endorsed: 22
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!url || !serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables');
    }

    // Initialize Supabase client
    const supabase = createClient(url, serviceKey);

    // Since this is a demo seed function, we'll insert skills without a specific user_id
    // In a real app, you'd want to associate these with a specific user
    const { data, error } = await supabase
      .from('skills')
      .upsert(sampleSkills.map(skill => ({
        ...skill,
        user_id: null // This will work if we've modified the RLS to allow public access for demo purposes
      })), { onConflict: 'name' });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, message: 'Skills data seeded successfully', data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error seeding skills data:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
