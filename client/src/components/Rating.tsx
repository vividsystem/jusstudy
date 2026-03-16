import { Star } from "lucide-react"

interface RatingProps {
	n: number
	rating: number
	setRating: (n: number) => void
}
export default function Rating(props: RatingProps) {
	return (
		<div className="flex flex-row gap-0.5">
			{[...Array.from(Array(props.n).keys())].map((i) => (
				<div onClick={() => {
					if (props.rating != i + 1) {
						props.setRating(i + 1)
					} else {
						props.setRating(0)
					}
				}}>
					<Star className={`${props.rating > i ? "fill-dark-brown" : ""} size-8`} />
				</div>
			))}
		</div>


	)
}
