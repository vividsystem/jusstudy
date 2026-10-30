import type React from "react";

export default function PageHeader({ children }: { children: React.ReactNode }) {
	return <h1 className="text-4xl lg:text-5xl text-dark-brown w-fit">{children}</h1>
}
