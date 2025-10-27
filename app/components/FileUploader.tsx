import {useCallback, useMemo, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import { formatSize } from '../lib/utils'

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const nextFile = acceptedFiles[0] || null;
        setSelectedFile(nextFile);
        onFileSelect?.(nextFile);
    }, [onFileSelect]);

    const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf']},
        maxSize: maxFileSize,
    })

    const uploaderStyles = useMemo(
        () => `uplader-drag-area border border-dashed ${isDragActive ? 'border-indigo-400 bg-white' : 'border-slate-200 bg-white/90'} rounded-2xl`,
        [isDragActive]
    );


    return (
        <div className="w-full">
            <div {...getRootProps({ className: uploaderStyles })}>
                <input {...getInputProps()} />

                <div className="space-y-4 cursor-pointer">
                    {selectedFile ? (
                        <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                            <img src="/images/pdf.png" alt="PDF" className="size-10" />
                            <div className="flex items-center space-x-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatSize(selectedFile.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                    onFileSelect?.(null);
                                }}
                            >
                                <img src="/icons/cross.svg" alt="Remove" className="w-4 h-4" />
                            </button>
                        </div>
                    ): (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                                <img src="/icons/info.svg" alt="Upload" className="h-8 w-8" />
                            </div>
                            <p className="text-base text-gray-600">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-sm text-gray-500">PDF up to {formatSize(maxFileSize)}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default FileUploader
