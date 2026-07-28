import { authClient } from "@client/lib/auth-client";
import { User } from "lucide-react";
import { Navigate } from "react-router";


export function Avatar(props: { imageURL?: string | null, size?: number }) {
	return (
		<div>
			{props.imageURL ? (
				<div className="w-fit rounded-full">
					<img src={props.imageURL} className={`size-${String(props.size || 24)} rounded-full`} />
				</div>
			) : (

				<div className="bg-gray-600 w-fit rounded-full p-4">
					<User className={`size-${String(props.size || 24 - 6)} animate-pulse`} />
				</div>
			)}

		</div>
	)
}

export default function UserIcon() {
	const {
		data
	} = authClient.useSession()
	if (!data) {
		return <Navigate to={"/"} />
	}



	return (
		<Avatar imageURL={data.user.image} />
	)
}
