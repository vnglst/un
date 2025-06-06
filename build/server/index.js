import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, Meta, Links, ScrollRestoration, Scripts, Link, useSearchParams, data } from "react-router";
import { renderToString } from "react-dom/server";
import Database from "better-sqlite3";
import { join } from "path";
import * as React from "react";
import { useState } from "react";
import { Globe, BookOpen, Search, Calendar, FileText, User, ChevronLeft, ChevronRight, Filter, ArrowLeft, MapPin } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cva } from "class-variance-authority";
function handleRequest(request, responseStatusCode, responseHeaders, routerContext) {
  const html = renderToString(/* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }));
  return new Response(`<!DOCTYPE html>${html}`, {
    status: responseStatusCode,
    headers: {
      ...Object.fromEntries(responseHeaders),
      "Content-Type": "text/html"
    }
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const db = new Database(join(process.cwd(), "un_speeches.db"));
function getAllSpeeches(page = 1, limit = 20, filters = {}) {
  let query = "SELECT * FROM speeches";
  let countQuery = "SELECT COUNT(*) as total FROM speeches";
  const params = [];
  const conditions = [];
  if (filters.country) {
    conditions.push("(country_name LIKE ? OR country_code LIKE ?)");
    params.push(`%${filters.country}%`, `%${filters.country}%`);
  }
  if (filters.year) {
    conditions.push("year = ?");
    params.push(filters.year);
  }
  if (filters.session) {
    conditions.push("session = ?");
    params.push(filters.session);
  }
  if (filters.search) {
    conditions.push("(text LIKE ? OR speaker LIKE ? OR post LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  if (conditions.length > 0) {
    const whereClause = " WHERE " + conditions.join(" AND ");
    query += whereClause;
    countQuery += whereClause;
  }
  const totalResult = db.prepare(countQuery).get(...params);
  const total = totalResult.total;
  const totalPages = Math.ceil(total / limit);
  query += " ORDER BY year DESC, session DESC, country_name ASC";
  query += " LIMIT ? OFFSET ?";
  params.push(limit, (page - 1) * limit);
  const speeches = db.prepare(query).all(...params);
  return {
    speeches,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
}
function getSpeechById(id) {
  const query = "SELECT * FROM speeches WHERE id = ?";
  return db.prepare(query).get(id);
}
function getCountries() {
  const query = "SELECT DISTINCT country_name, country_code FROM speeches WHERE country_name IS NOT NULL ORDER BY country_name ASC";
  return db.prepare(query).all();
}
function getYears() {
  const query = "SELECT DISTINCT year FROM speeches WHERE year IS NOT NULL ORDER BY year DESC";
  const results = db.prepare(query).all();
  return results.map((r) => r.year);
}
function getSessions() {
  const query = "SELECT DISTINCT session FROM speeches WHERE session IS NOT NULL ORDER BY session DESC";
  const results = db.prepare(query).all();
  return results.map((r) => r.session);
}
function Header() {
  return /* @__PURE__ */ jsx("header", { className: "bg-un-blue text-white shadow-lg", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-16", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx(Globe, { className: "h-8 w-8" }),
      /* @__PURE__ */ jsx(Link, { to: "/", className: "text-xl font-bold", children: "UN General Assembly Speeches" })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "flex space-x-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center space-x-1 hover:text-un-light-blue transition-colors", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { children: "Browse" })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/search", className: "flex items-center space-x-1 hover:text-un-light-blue transition-colors", children: [
        /* @__PURE__ */ jsx(Search, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { children: "Search" })
      ] })
    ] })
  ] }) }) });
}
function Footer() {
  return /* @__PURE__ */ jsx("footer", { className: "bg-gray-50 border-t mt-auto", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "UN General Assembly Speeches Database" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-2", children: "Explore decades of diplomatic discourse from the United Nations General Assembly" })
  ] }) }) });
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm", className),
    ...props
  }
));
Card.displayName = "Card";
const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("h3", { ref, className: cn("font-semibold leading-none tracking-tight", className), ...props })
);
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("p", { ref, className: cn("text-sm text-gray-500", className), ...props })
);
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
function SpeechCard({ speech }) {
  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };
  return /* @__PURE__ */ jsxs(Card, { className: "hover:shadow-lg transition-shadow duration-200", children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-lg text-un-dark-blue", children: /* @__PURE__ */ jsx(Link, { to: `/speech/${speech.id}`, className: "hover:underline", children: speech.country_name || speech.country_code }) }),
        /* @__PURE__ */ jsxs(CardDescription, { className: "flex items-center space-x-4 mt-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center space-x-1", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { children: speech.year })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center space-x-1", children: [
            /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Session ",
              speech.session
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-xs bg-un-blue text-white px-2 py-1 rounded", children: speech.country_code })
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { children: [
      speech.speaker && /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1 text-sm text-gray-600 mb-2", children: [
        /* @__PURE__ */ jsx(User, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { children: speech.speaker }),
        speech.post && /* @__PURE__ */ jsxs("span", { children: [
          "• ",
          speech.post
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-700 leading-relaxed", children: truncateText(speech.text) }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: `/speech/${speech.id}`,
          className: "inline-block mt-3 text-un-blue hover:text-un-dark-blue font-medium text-sm",
          children: "Read full speech →"
        }
      )
    ] })
  ] });
}
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-un-blue text-white shadow hover:bg-un-dark-blue",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border border-un-blue text-un-blue bg-white shadow-sm hover:bg-un-blue hover:text-white",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-un-blue underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return /* @__PURE__ */ jsx("button", { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
});
Button.displayName = "Button";
function Pagination({ currentPage, totalPages, onPageChange }) {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }
    rangeWithDots.push(...range);
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }
    return rangeWithDots;
  };
  if (totalPages <= 1) return null;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center space-x-2 mt-8", children: [
    /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => onPageChange(currentPage - 1), disabled: currentPage === 1, children: [
      /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }),
      "Previous"
    ] }),
    getPageNumbers().map((page, index) => /* @__PURE__ */ jsx("div", { children: page === "..." ? /* @__PURE__ */ jsx("span", { className: "px-2", children: "..." }) : /* @__PURE__ */ jsx(
      Button,
      {
        variant: currentPage === page ? "default" : "outline",
        size: "sm",
        onClick: () => onPageChange(page),
        children: page
      }
    ) }, index)),
    /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "outline",
        size: "sm",
        onClick: () => onPageChange(currentPage + 1),
        disabled: currentPage === totalPages,
        children: [
          "Next",
          /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
        ]
      }
    )
  ] });
}
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      className: cn(
        "flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-un-blue disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ref,
      ...props
    }
  );
});
Input.displayName = "Input";
const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "select",
    {
      className: cn(
        "flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-un-blue disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ref,
      ...props,
      children
    }
  );
});
Select.displayName = "Select";
function meta$1() {
  return [{
    title: "UN General Assembly Speeches"
  }, {
    name: "description",
    content: "Browse and search speeches from the UN General Assembly"
  }];
}
async function loader$1({
  request
}) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const country = url.searchParams.get("country") || "";
  const year = url.searchParams.get("year") ? parseInt(url.searchParams.get("year")) : void 0;
  const session = url.searchParams.get("session") ? parseInt(url.searchParams.get("session")) : void 0;
  const search = url.searchParams.get("search") || "";
  const filters = {
    country,
    year,
    session,
    search
  };
  const result = getAllSpeeches(page, 20, filters);
  const countries = getCountries();
  const years = getYears();
  const sessions = getSessions();
  return {
    ...result,
    countries,
    years,
    sessions,
    currentFilters: filters
  };
}
const home = UNSAFE_withComponentProps(function Home({
  loaderData
}) {
  var _a, _b;
  const {
    speeches,
    pagination,
    countries,
    years,
    sessions,
    currentFilters
  } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    country: currentFilters.country || "",
    year: ((_a = currentFilters.year) == null ? void 0 : _a.toString()) || "",
    session: ((_b = currentFilters.session) == null ? void 0 : _b.toString()) || "",
    search: currentFilters.search || ""
  });
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };
  const applyFilters = () => {
    const newParams = new URLSearchParams();
    if (filters.country) newParams.set("country", filters.country);
    if (filters.year) newParams.set("year", filters.year);
    if (filters.session) newParams.set("session", filters.session);
    if (filters.search) newParams.set("search", filters.search);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
  const clearFilters = () => {
    setFilters({
      country: "",
      year: "",
      session: "",
      search: ""
    });
    setSearchParams({});
  };
  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };
  const hasActiveFilters = filters.country || filters.year || filters.session || filters.search;
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen flex flex-col bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("main", {
      className: "flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold text-gray-900 mb-2",
          children: "UN General Assembly Speeches"
        }), /* @__PURE__ */ jsxs("p", {
          className: "text-gray-600",
          children: ["Explore ", pagination.total, " speeches from ", years.length, " years of United Nations General Assembly sessions"]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "bg-white rounded-lg shadow-sm border p-6 mb-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex items-center space-x-2 mb-4",
          children: [/* @__PURE__ */ jsx(Filter, {
            className: "h-5 w-5 text-gray-500"
          }), /* @__PURE__ */ jsx("h2", {
            className: "text-lg font-semibold",
            children: "Filters"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-1",
              children: "Search Text"
            }), /* @__PURE__ */ jsx(Input, {
              placeholder: "Search speeches...",
              value: filters.search,
              onChange: (e) => handleFilterChange("search", e.target.value)
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-1",
              children: "Country"
            }), /* @__PURE__ */ jsxs(Select, {
              value: filters.country,
              onChange: (e) => handleFilterChange("country", e.target.value),
              children: [/* @__PURE__ */ jsx("option", {
                value: "",
                children: "All Countries"
              }), countries.map((country) => /* @__PURE__ */ jsx("option", {
                value: country.country_name,
                children: country.country_name
              }, country.country_code))]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-1",
              children: "Year"
            }), /* @__PURE__ */ jsxs(Select, {
              value: filters.year,
              onChange: (e) => handleFilterChange("year", e.target.value),
              children: [/* @__PURE__ */ jsx("option", {
                value: "",
                children: "All Years"
              }), years.map((year) => /* @__PURE__ */ jsx("option", {
                value: year,
                children: year
              }, year))]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-1",
              children: "Session"
            }), /* @__PURE__ */ jsxs(Select, {
              value: filters.session,
              onChange: (e) => handleFilterChange("session", e.target.value),
              children: [/* @__PURE__ */ jsx("option", {
                value: "",
                children: "All Sessions"
              }), sessions.map((session) => /* @__PURE__ */ jsxs("option", {
                value: session,
                children: ["Session ", session]
              }, session))]
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex space-x-2",
          children: [/* @__PURE__ */ jsxs(Button, {
            onClick: applyFilters,
            children: [/* @__PURE__ */ jsx(Search, {
              className: "h-4 w-4 mr-2"
            }), "Apply Filters"]
          }), hasActiveFilters && /* @__PURE__ */ jsx(Button, {
            variant: "outline",
            onClick: clearFilters,
            children: "Clear Filters"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "mb-6",
        children: [/* @__PURE__ */ jsxs("h2", {
          className: "text-xl font-semibold text-gray-900 mb-2",
          children: [pagination.total, " speeches found"]
        }), /* @__PURE__ */ jsxs("p", {
          className: "text-gray-600",
          children: ["Showing page ", pagination.page, " of ", pagination.totalPages]
        })]
      }), speeches.length === 0 ? /* @__PURE__ */ jsxs("div", {
        className: "text-center py-12",
        children: [/* @__PURE__ */ jsx("p", {
          className: "text-gray-500 text-lg",
          children: "No speeches found matching your criteria."
        }), /* @__PURE__ */ jsx(Button, {
          variant: "outline",
          onClick: clearFilters,
          className: "mt-4",
          children: "Clear Filters"
        })]
      }) : /* @__PURE__ */ jsxs(Fragment, {
        children: [/* @__PURE__ */ jsx("div", {
          className: "grid gap-6 mb-8",
          children: speeches.map((speech) => /* @__PURE__ */ jsx(SpeechCard, {
            speech
          }, speech.id))
        }), /* @__PURE__ */ jsx(Pagination, {
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          onPageChange: handlePageChange
        })]
      })]
    }), /* @__PURE__ */ jsx(Footer, {})]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  loader: loader$1,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function meta({
  loaderData
}) {
  if (!loaderData.speech) {
    return [{
      title: "Speech Not Found"
    }];
  }
  return [{
    title: `${loaderData.speech.country_name} - ${loaderData.speech.year} UN Speech`
  }, {
    name: "description",
    content: `Speech by ${loaderData.speech.speaker || loaderData.speech.country_name} at the ${loaderData.speech.year} UN General Assembly, Session ${loaderData.speech.session}`
  }];
}
async function loader({
  params
}) {
  const speechId = parseInt(params.id);
  const speech = getSpeechById(speechId);
  if (!speech) {
    throw data("Speech not found", {
      status: 404
    });
  }
  return {
    speech
  };
}
const speech_$id = UNSAFE_withComponentProps(function SpeechDetail({
  loaderData
}) {
  const {
    speech
  } = loaderData;
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen flex flex-col bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("main", {
      className: "flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
      children: [/* @__PURE__ */ jsx("div", {
        className: "mb-6",
        children: /* @__PURE__ */ jsx(Link, {
          to: "/",
          children: /* @__PURE__ */ jsxs(Button, {
            variant: "outline",
            size: "sm",
            children: [/* @__PURE__ */ jsx(ArrowLeft, {
              className: "h-4 w-4 mr-2"
            }), "Back to Speeches"]
          })
        })
      }), /* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "border-b bg-gradient-to-r from-un-blue to-un-dark-blue text-white",
          children: [/* @__PURE__ */ jsx("div", {
            className: "flex items-start justify-between",
            children: /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx(CardTitle, {
                className: "text-2xl mb-2",
                children: speech.country_name || speech.country_code
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex flex-wrap items-center gap-4 text-sm opacity-90",
                children: [/* @__PURE__ */ jsxs("span", {
                  className: "flex items-center space-x-1",
                  children: [/* @__PURE__ */ jsx(Calendar, {
                    className: "h-4 w-4"
                  }), /* @__PURE__ */ jsx("span", {
                    children: speech.year
                  })]
                }), /* @__PURE__ */ jsxs("span", {
                  className: "flex items-center space-x-1",
                  children: [/* @__PURE__ */ jsx(FileText, {
                    className: "h-4 w-4"
                  }), /* @__PURE__ */ jsxs("span", {
                    children: ["Session ", speech.session]
                  })]
                }), /* @__PURE__ */ jsxs("span", {
                  className: "flex items-center space-x-1",
                  children: [/* @__PURE__ */ jsx(MapPin, {
                    className: "h-4 w-4"
                  }), /* @__PURE__ */ jsx("span", {
                    children: speech.country_code
                  })]
                })]
              })]
            })
          }), speech.speaker && /* @__PURE__ */ jsx("div", {
            className: "mt-4 pt-4 border-t border-white/20",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center space-x-2 text-sm",
              children: [/* @__PURE__ */ jsx(User, {
                className: "h-4 w-4"
              }), /* @__PURE__ */ jsx("span", {
                className: "font-medium",
                children: speech.speaker
              }), speech.post && /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx("span", {
                  children: "•"
                }), /* @__PURE__ */ jsx("span", {
                  children: speech.post
                })]
              })]
            })
          })]
        }), /* @__PURE__ */ jsx(CardContent, {
          className: "p-8",
          children: /* @__PURE__ */ jsx("div", {
            className: "prose prose-lg max-w-none",
            children: /* @__PURE__ */ jsx("div", {
              className: "whitespace-pre-wrap text-gray-800 leading-relaxed",
              children: speech.text
            })
          })
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "mt-8 text-center",
        children: /* @__PURE__ */ jsx(Link, {
          to: "/",
          children: /* @__PURE__ */ jsxs(Button, {
            children: [/* @__PURE__ */ jsx(ArrowLeft, {
              className: "h-4 w-4 mr-2"
            }), "Back to All Speeches"]
          })
        })
      })]
    }), /* @__PURE__ */ jsx(Footer, {})]
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: speech_$id,
  loader,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-DIsBjC9v.js", "imports": ["/assets/chunk-NL6KNZEE-B6_Ba6Pt.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/root-C9gSSV-I.js", "imports": ["/assets/chunk-NL6KNZEE-B6_Ba6Pt.js"], "css": ["/assets/root-BsAPpmhM.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-BQR2PiNj.js", "imports": ["/assets/chunk-NL6KNZEE-B6_Ba6Pt.js", "/assets/button--G0Y8acw.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/speech.$id": { "id": "routes/speech.$id", "parentId": "root", "path": "speech/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/speech._id-Mk93KBTo.js", "imports": ["/assets/chunk-NL6KNZEE-B6_Ba6Pt.js", "/assets/button--G0Y8acw.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-345db565.js", "version": "345db565", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/speech.$id": {
    id: "routes/speech.$id",
    parentId: "root",
    path: "speech/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
