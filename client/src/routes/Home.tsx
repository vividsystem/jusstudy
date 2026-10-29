import { Navigate } from "react-router"
import { useUser } from "@client/lib/useUser"

function Home() {
	const user = useUser();
	if (!user.regionId) {
		return <Navigate to={"/onboarding"} />
	}

	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			{user.banned && (<>
				<h1 className="text-5xl">You are banned</h1>
			</>)}

			{!user.yswsEligible && !user.banned && (<>
				<h1>You are not YSWS eligible right now!</h1>
				<p>This means that you are either 1. too old, 2. haven't finished your identity check or 3. have been banned</p>
			</>)}
		</div>
	)
}


export default Home
