import { authClient } from "@client/lib/auth-client";
import { User } from "lucide-react";
import { Navigate } from "react-router";

export default function UserIcon() {
	const {
		data
	} = authClient.useSession()
	if (!data) {
		return <Navigate to={"/"} />
	}



	return (
		<div>
			{data.user.image ? (
				<div className="w-fit rounded-full">
					<img src={data.user.image} className="size-24 rounded-full" />
				</div>
			) : (

				<div className="bg-gray-600 w-fit rounded-full p-4">
					<User className="size-18" />
				</div>
			)}

		</div>
	)
}
