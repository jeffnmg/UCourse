import Link from "next/link";

type Props = {
  /** `nav`: barra superior. `auth`: páginas login/registro. */
  size?: "nav" | "auth";
  className?: string;
};

export function BrandWordmark({ size = "nav", className = "" }: Props) {
  const isAuth = size === "auth";
  return (
    <Link
      href="/"
      className={`inline-flex flex-col gap-0 sm:flex-row sm:items-baseline sm:gap-2 ${
        isAuth ? "items-center" : "items-start"
      } ${className}`}
    >
      <span
        className={`font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ${
          isAuth ? "text-2xl" : "text-lg leading-none"
        }`}
      >
        UCourse
      </span>
      <span
        className={`font-medium text-slate-500 dark:text-slate-400 ${
          isAuth ? "text-sm" : "text-xs sm:text-sm leading-tight sm:leading-none"
        }`}
      >
        de Virtual University
      </span>
    </Link>
  );
}
