import * as React from "react";

export function Card({ children, className }) {
  return (
    <div className={`p-4 rounded-lg shadow-md bg-white ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={`mb-2 font-bold ${className}`}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h3 className={`text-lg ${className}`}>{children}</h3>;
}
