import { ArrowLeft, ArrowRight, Trash, Upload, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { MAX_FILE_SIZE } from "@shared/vars"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface PreviewFile {
	file: File;
	previewUrl: string;
	error?: string;
}

interface ImageUploadProps {
	onUpdate: (f: File[]) => void
	onSuccess?: (urls: string[]) => void;
}

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | undefined {
	if (!ALLOWED_TYPES.includes(file.type)) return "Unsupported file type";
	if (file.size > MAX_FILE_SIZE) return `Exceeds ${formatBytes(MAX_FILE_SIZE)} limit`;
}
export function ImageUpload(props: ImageUploadProps) {

	const [files, setFiles] = useState<PreviewFile[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const addFiles = useCallback((incoming: File[]) => {
		const next: PreviewFile[] = incoming.map((file) => ({
			file,
			previewUrl: URL.createObjectURL(file),
			error: validateFile(file),
		}));


		setFiles((prev) => {
			const combined = [...prev, ...next];
			return combined;
		});
	}, []);

	const removeFile = useCallback((index: number) => {
		setFiles((prev) => {
			const copy = [...prev];
			if (!copy[index]) {
				return copy
			}
			URL.revokeObjectURL(copy[index].previewUrl);
			copy.splice(index, 1);


			return copy;
		});
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const dropped = Array.from(e.dataTransfer.files).filter((f) =>
				f.type.startsWith("image/")
			);
			addFiles(dropped);
		},
		[addFiles]
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				addFiles(Array.from(e.target.files));
				props.onUpdate(Array.from(e.target.files));
				e.target.value = "";
			}
		},
		[addFiles]
	);

	const [current, setCurrent] = useState(0);
	const next = () => setCurrent((prev) => (prev + 1 + files.length) % files.length)
	const prev = () => setCurrent((prev) => (prev - 1 + files.length) % files.length)


	return (
		<div className="flex flex-col gap-4 w-1/2">
			{/* Drop zone */}



			{files && files[current] && (
				<div key={current} className="relative group rounded-lg overflow-hidden border border-gray-200 w-full">
					<img
						src={files[current].previewUrl}
						alt={files[current].file.name}
						className={["w-full aspect-auto object-fill", files[current].error ? "opacity - 40" : ""].join(" ")}
					/>

					<button onClick={next}
						className="absolute top-1/2 right-1.5 items-center flex justify-center p-2 rounded-xl bg-black/60 text-egg-yellow opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<ArrowRight />
					</button>

					<button onClick={prev}
						className="absolute top-1/2 left-1.5 items-center flex justify-center p-2 rounded-xl bg-black/60 text-egg-yellow opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<ArrowLeft />
					</button>
					<button
						onClick={() => {
							removeFile(current)
							const copy = [...files];
							if (!copy[current]) {
								return copy
							}
							copy.splice(current, 1);
							next()

							props.onUpdate(copy.map((f) => f.file))

						}}
						className="absolute top-1.5 right-1.5 flex items-center justify-center p-2 rounded-xl bg-black/60 text-egg-yellow opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<Trash />
					</button>
				</div>
			)}




			<div
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				className={[
					"flex flex-col items-center justify-center gap-2 rounded-4xl border-dashed border-dashed px-6 py-10 cursor-pointer transition-colors bg-dark-red",
					isDragging
						? "border-blue-400 bg-blue-50"
						: "hover:border-4 hover:border-egg-yellow",
				].join(" ")}
			>
				<Upload />
				<p className="text-sm font-medium text-egg-yellow">
					Drop images here or <span className="text-egg-yellow">browse</span>
				</p>
				<p className="text-xs text-gray-400">
					PNG, JPEG, WebP - max {formatBytes(MAX_FILE_SIZE)}
				</p>
				<input
					ref={inputRef}
					type="file"
					accept={ALLOWED_TYPES.join(",")}
					multiple
					className="hidden"
					onChange={handleInputChange}
				/>
			</div>
		</div>
	);
}
