import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";

const routeNames: Record<string, string> = {
  "/pricing": "Try Free",
  "/how-it-works": "How It Works",
  "/high-risk": "High-Risk Merchants",
  "/contact": "Contact",
  "/faq": "FAQ",
  "/connect": "Connect",
  "/statement-review": "Statement Analysis",
  "/refer": "Refer a Business",
  "/apply": "Apply",
  "/industries/restaurants": "Restaurants",
  "/industries/auto-shops": "Auto Shops",
  "/industries/salons": "Salons & Spas",
  "/locations/oahu": "O'ahu",
  "/locations/maui": "Maui",
  "/locations/big-island": "Big Island",
  "/locations/kauai": "Kaua'i",
};

export function Breadcrumb() {
  const [location] = useLocation();
  if (location === "/") return null;

  const name = routeNames[location] || location.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // Inject BreadcrumbList JSON-LD
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://techsavvyhawaii.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": name,
          "item": `https://techsavvyhawaii.com${location}`
        }
      ]
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-breadcrumb", "true");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [location, name]);

  return (
    <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-0" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground" itemScope itemType="https://schema.org/BreadcrumbList">
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1" itemProp="item">
            <Home className="w-3 h-3" />
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        <li><ChevronRight className="w-3 h-3" /></li>
        <li className="text-foreground font-medium" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <span itemProp="name">{name}</span>
          <meta itemProp="position" content="2" />
        </li>
      </ol>
    </nav>
  );
}
