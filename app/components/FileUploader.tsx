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
        () => `uplader-drag-area border-2 border-dashed transition-all duration-300 ${
            isDragActive 
                ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-lg' 
                : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
        } rounded-2xl`,
        [isDragActive]
    );


    return (
        <div className="w-full">
            <div {...getRootProps({ className: uploaderStyles })}>
                <input {...getInputProps()} />

                <div className="space-y-4 cursor-pointer">
                    {selectedFile ? (
                        <div className="uploader-selected-file animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
                            <img src="/images/pdf.png" alt="PDF" className="size-12" />
                            <div className="flex items-center space-x-3 flex-1">
                                <div>
                                    <p className="text-base font-semibold text-gray-800 truncate max-w-xs">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-gray-600 font-medium">
                                        {formatSize(selectedFile.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                    onFileSelect?.(null);
                                }}
                            >
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ): (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 transition-all duration-300">
                                <svg className="h-10 w-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base text-gray-700 font-medium">
                                    <span className="font-bold text-indigo-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-sm text-gray-500 mt-1">PDF up to {formatSize(maxFileSize)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default FileUploader
