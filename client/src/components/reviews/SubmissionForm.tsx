import { useState } from "react"
import { Lock } from "lucide-react"
import Button from "../Button"
import { useNavigate } from "react-router"
import { useErrors } from "@client/lib/context/ErrorContext"
import { useMutation } from "@tanstack/react-query"
import { client } from "@client/lib/api-client"

interface SubmissionFormProps {
	shipId: string
}

export default function ReviewSubmissionForm(props: SubmissionFormProps) {
	const [passed, setPassed] = useState(false)

	const [comment, setComment] = useState("");
	const [note, setNotes] = useState<string | undefined>();

	const navigate = useNavigate()
	const { pushError } = useErrors()

	const { mutate: submitReview } = useMutation({
		mutationFn: async () => {
			if (note == "") setNotes(undefined)
			const res = await client.api.ships[":id"].reviews.$post({
				param: {
					id: props.shipId
				},
				json: {
					passed,
					comment,
					note,
				}
			})

			if (!res.ok) {
				const data = await res.json()
				pushError(data.message)
				throw new Error(data.message)
			}


			navigate("/reviews")
		},
	})
	return <div className="border-4 border-dark-red rounded-2xl p-4 bg-egg-yellow text-dark-red text-xl flex flex-col gap-3">
		<div className="flex flex-col gap-1">
			<legend className="font-bold">Verdict</legend>
			<div className="flex gap-2 items-center">
				<label htmlFor="pass" className={`${passed ? "bg-green-400" : "bg-transparent"} border-2 border-green-400 p-2 w-full rounded-xl`}>
					<input type="radio" id="pass" name="verdict" value="pass" className="hidden"
						onChange={(e) => setPassed(e.target.value === "pass")}
						checked={passed}
					/>
					<h4 className="uppercase text-2xl text-center">Pass</h4>
				</label>

				<label htmlFor="fail" className={`${!passed ? "bg-red-400" : "bg-transparent"} border-2 border-red-400 p-2 w-full rounded-xl`}>
					<input type="radio" id="fail" name="verdict" value="fail" className="hidden"
						onChange={(e) => setPassed(e.target.value === "pass")}
						checked={!passed}
					/>
					<h4 className="uppercase text-2xl text-center">Fail</h4>
				</label>
			</div>
		</div>
		<div className="flex flex-col gap-1">
			<label className="font-bold">Comment</label>
			<textarea
				className="border rounded-xl line-clamp-4 h-26 px-2"
				placeholder="Things you wish to tell the user about his project. Keep criticism constructive."
				onInput={(e) => setComment(e.currentTarget.value)}
			/>
		</div>
		<div className="flex flex-col gap-1">
			<label className="flex gap-2 items-center font-bold">
				<Lock />
				<span>Note (internal)</span>
			</label>
			<textarea
				className="border rounded-xl line-clamp-4 h-26 px-2"
				placeholder="Put potential red-flags etc. here. These notes can only be seen by staff."
				onInput={(e) => setNotes(e.currentTarget.value)}
			/>
		</div>
		<div className="flex gap-2">
			<Button
				className={`${passed ? "bg-green-400" : "bg-red-400"} w-full`}
				onClick={(e) => {
					e.preventDefault()
					submitReview()
				}}
			>
				{passed ? "Pass" : "Fail"} review
			</Button>
			<button
				className="bg-red-400 w-fit rounded-2xl p-4"
			>
				<Lock className="size-8" />
			</button>
		</div>
	</div >
}
