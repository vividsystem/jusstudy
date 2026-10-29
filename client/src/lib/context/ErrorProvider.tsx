import { ErrorToastContainer } from "@client/components/ErrorToastContainer";
import { type ReactNode } from "react";

export function ErrorProvider({ children }: { children: ReactNode }) {
	return (
		<>
			{children}
			<ErrorToastContainer />
		</>
	);
}
