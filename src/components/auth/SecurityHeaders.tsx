
import { useEffect } from "react";

export const SecurityHeaders = () => {
  useEffect(() => {
    // Adicionar meta tags de segurança
    const metaTags = [
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
      { httpEquiv: "X-Frame-Options", content: "DENY" },
      { httpEquiv: "X-XSS-Protection", content: "1; mode=block" },
      { httpEquiv: "Strict-Transport-Security", content: "max-age=31536000; includeSubDomains" },
      { httpEquiv: "Content-Security-Policy", content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://socrnutfpqtcjmetskta.supabase.co;" }
    ];

    metaTags.forEach(tag => {
      const meta = document.createElement("meta");
      if (tag.name) meta.name = tag.name;
      if (tag.httpEquiv) meta.httpEquiv = tag.httpEquiv;
      meta.content = tag.content;
      document.head.appendChild(meta);
    });

    return () => {
      // Cleanup: remover meta tags quando o componente for desmontado
      metaTags.forEach(tag => {
        const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[http-equiv="${tag.httpEquiv}"]`;
        const meta = document.querySelector(selector);
        if (meta) {
          document.head.removeChild(meta);
        }
      });
    };
  }, []);

  return null;
};
