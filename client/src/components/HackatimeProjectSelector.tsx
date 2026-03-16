import { client } from "@client/lib/api-client";
import { useErrors } from "@client/lib/context/ErrorContext";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";

interface HackatimeProjectSelectorProps {
	onSelect: (p: string) => void
}

export default function HackatimeProjectSelector(props: HackatimeProjectSelectorProps) {
	const [alreadyUsed, setAlreadyUsed] = useState<string[]>([])
	const { pushError } = useErrors()
	const { data } = useQuery({
		queryKey: ["userHackatimeProjects"],
		queryFn: async () => {
			const res = await client.api.users["hackatime-projects"].$get()
			if (!res.ok) {
				const data = await res.json();
				pushError(data.message);
				throw new Error(data.message);
			}

			const data = await res.json();
			return data
		}
	})
	return (
		<div className="flex flex-col w-full p-4 gap-4 bg-light-brown rounded-2xl">
			<select name="projects" onChange={(ev) => {
				const name = ev.currentTarget.value
				setAlreadyUsed((prev) => [...prev, name])
				props.onSelect(name)
				ev.currentTarget.value = ""
			}} defaultValue="" className="border-2 rounded-lg p-2 bg-dark-red">
				<option value="">Select a project</option>
				{data?.unused.filter(n => !alreadyUsed.includes(n)).map((name) => (
					<option value={name}>{name}</option>
				))}
			</select>
			<div className="w-full">
				{alreadyUsed.map(name => (
					<div className="border-2 rounded-lg p-2 flex flex-row items-center justify-between w-full bg-dark-brown">
						{name}
						<div onClick={() => {
							setAlreadyUsed((prev) => prev.filter(n => n != name))
						}}>
							<X className="size-8" />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
