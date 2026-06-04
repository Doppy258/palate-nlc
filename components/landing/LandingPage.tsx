"use client";

import { useEffect } from "react";
import "./framer.css";
import { landingBodyHtml } from "./landing-body";
import { framerInlineScripts, framerModulePreloads } from "./framer-scripts";

type FramerScript = (typeof framerInlineScripts)[number];

function appendScript(script: FramerScript): HTMLScriptElement {
  const el = document.createElement("script");

  if (script.src) {
    el.src = script.src;
  } else if (script.content) {
    el.textContent = script.content;
  }

  if (script.type) {
    el.type = script.type;
  }

  if (script.id) {
    el.id = script.id;
  }

  if (script.dataFramerAppearAnimation) {
    el.setAttribute(
      "data-framer-appear-animation",
      script.dataFramerAppearAnimation,
    );
  }

  document.body.appendChild(el);
  return el;
}

function isStaticExportLinkScript(script: FramerScript): boolean {
  return (
    script.content?.includes("buildExportHref") === true ||
    script.content?.includes("remotebymodula.framer.website") === true
  );
}

export default function LandingPage() {
  useEffect(() => {
    const preloads = framerModulePreloads.map((href) => {
      const link = document.createElement("link");
      link.rel = "modulepreload";
      link.href = href;
      link.setAttribute("fetchpriority", "low");
      document.head.appendChild(link);
      return link;
    });

    const scripts = framerInlineScripts
      .filter((script) => !isStaticExportLinkScript(script))
      .map((script) => appendScript(script));

    return () => {
      preloads.forEach((link) => link.remove());
      scripts.forEach((script) => script.remove());
    };
  }, []);

  return (
    <div
      id="landing-page"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: landingBodyHtml }}
    />
  );
}
