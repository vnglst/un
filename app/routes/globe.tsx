import { useLoaderData, Link } from "react-router";
import { getCountrySpeechCounts, type CountrySpeechCount } from "~/lib/database";
import Header from "~/components/header";
import Footer from "~/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useEffect, useRef } from "react";

type LoaderData = {
  countryCounts: CountrySpeechCount[];
};

export function meta() {
  return [
    { title: "UN Speeches Globe - Interactive World Map" },
    {
      name: "description",
      content:
        "Explore an interactive globe showing how often countries have spoken at the UN General Assembly. Click on any country to see their speeches.",
    },
  ];
}

export async function loader(): Promise<LoaderData> {
  const countryCounts = getCountrySpeechCounts();
  return { countryCounts };
}

declare global {
  interface Window {
    d3: any;
    topojson: any;
  }
}

export default function Globe() {
  const { countryCounts } = useLoaderData<LoaderData>();
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load D3 and TopoJSON from CDN
    const loadScripts = async () => {
      if (typeof window === "undefined") return;

      // Load D3
      if (!window.d3) {
        const d3Script = document.createElement("script");
        d3Script.src = "https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js";
        d3Script.integrity =
          "sha512-vc58qvvBdrDR4etbxMdlTt4GBQk1qjvyORR2nrsPsFPyrs+/u5c3+1Ct6upOgdZoIl7eq6k3a1UPDSNAQi/32A==";
        d3Script.crossOrigin = "anonymous";
        document.head.appendChild(d3Script);
        await new Promise((resolve) => (d3Script.onload = resolve));
      }

      // Load TopoJSON
      if (!window.topojson) {
        const topoScript = document.createElement("script");
        topoScript.src = "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
        topoScript.integrity =
          "sha512-4UKI/XKm3xrvJ6pZS5oTRvIQGIzZFoXR71rRBb1y2N+PbwAsKa5tPl2J6WvbEvwN3TxQCm8hMzsl/pO+82iRlg==";
        topoScript.crossOrigin = "anonymous";
        document.head.appendChild(topoScript);
        await new Promise((resolve) => (topoScript.onload = resolve));
      }

      initializeGlobe();
    };

    const initializeGlobe = async () => {
      if (!globeRef.current || !window.d3 || !window.topojson) return;

      const container = globeRef.current;
      const { width, height } = container.getBoundingClientRect();

      // Clear any existing content
      container.innerHTML = "";

      const svg = window.d3.select(container).append("svg").attr("width", width).attr("height", height);

      const globe = svg.append("g");

      // Create projection
      const projection = window.d3
        .geoOrthographic()
        .scale(Math.min(width, height) / 2.5)
        .translate([width / 2, height / 2])
        .rotate([-10, -20, 0]);

      const path = window.d3.geoPath().projection(projection);

      // Add water background
      globe
        .append("circle")
        .attr("fill", "#e0f4ff")
        .attr("stroke", "#009edb")
        .attr("stroke-width", 2)
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", projection.scale());

      // Create country lookup map
      const countryLookup = new Map();
      countryCounts.forEach((country) => {
        countryLookup.set(country.country_code, country.speech_count);
      });

      // Find max count for color scaling
      const maxCount = Math.max(...countryCounts.map((c) => c.speech_count));
      const colorScale = window.d3.scaleSequential(window.d3.interpolateBlues).domain([0, maxCount]);

      // Load and render world data
      try {
        const worldData = await window.d3.json("/data/topology_with_iso_code.json");
        const countries = window.topojson.feature(worldData, worldData.objects.countries);

        // Render countries
        const countryPaths = globe
          .selectAll("path")
          .data(countries.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", (d: any) => {
            const count = countryLookup.get(d.properties.code) || 0;
            return count > 0 ? colorScale(count) : "#f3f4f6";
          })
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer");

        // Add interactivity
        countryPaths
          .on("mouseover", function (this: any, event: any, d: any) {
            const count = countryLookup.get(d.properties.code) || 0;
            window.d3.select(this).attr("stroke-width", 2).attr("stroke", "#009edb");

            // Tooltip
            window.d3
              .select("body")
              .append("div")
              .attr("class", "tooltip")
              .style("position", "absolute")
              .style("background", "rgba(0, 0, 0, 0.8)")
              .style("color", "white")
              .style("padding", "8px")
              .style("border-radius", "4px")
              .style("font-size", "12px")
              .style("pointer-events", "none")
              .style("z-index", "1000")
              .html(`<strong>${d.properties.name}</strong><br/>${count} speeches`)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 10 + "px");
          })
          .on("mouseout", function (this: any) {
            window.d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#ffffff");

            window.d3.selectAll(".tooltip").remove();
          })
          .on("click", function (_event: any, d: any) {
            const count = countryLookup.get(d.properties.code) || 0;
            if (count > 0) {
              // Navigate to country speeches page
              window.location.href = `/country/${d.properties.code}`;
            }
          });

        // Add rotation
        let rotationSpeed = 0.5;
        let isRotating = true;

        const rotate = () => {
          if (isRotating) {
            const currentRotation = projection.rotate();
            projection.rotate([currentRotation[0] + rotationSpeed, currentRotation[1], currentRotation[2]]);
            countryPaths.attr("d", path);
          }
        };

        const rotationInterval = setInterval(rotate, 100);

        // Stop rotation on interaction
        svg
          .on("mouseenter", () => {
            isRotating = false;
          })
          .on("mouseleave", () => {
            isRotating = true;
          });

        // Cleanup function
        return () => clearInterval(rotationInterval);
      } catch (error) {
        console.error("Error loading world data:", error);
      }
    };

    loadScripts();
  }, [countryCounts]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">UN General Assembly Globe</h1>
          <p className="text-gray-600">
            Explore how often countries have spoken at the UN General Assembly. Click on a country to see their
            speeches.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Globe */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Globe</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={globeRef} className="w-full h-96 lg:h-[500px] bg-gray-50 rounded-lg border" />
                <p className="text-sm text-gray-500 mt-4">
                  Hover over countries to see speech counts. Click to view their speeches. Countries are colored by
                  frequency of speeches - darker blue means more speeches.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Speaking Countries */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Top Speaking Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {countryCounts.slice(0, 10).map((country, index) => (
                    <Link
                      key={country.country_code}
                      to={`/country/${country.country_code}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {index + 1}. {country.country_name || country.country_code}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{country.speech_count} speeches</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
