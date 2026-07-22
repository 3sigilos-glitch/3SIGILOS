import type { MetadataRoute } from "next";

// Conteúdo de estudo reservado: proibir a indexação por qualquer robot.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
