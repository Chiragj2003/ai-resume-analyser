import {type FormEvent, useEffect, useMemo, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {AIResponseFormat, prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) navigate('/auth?next=/upload');
    }, [auth.isAuthenticated, isLoading, navigate]);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);
        setError(null);

        // Surface the current step in the UI while we stream work through Puter and the AI helper.
        try {
            setStatusText('Uploading resume…');
            const uploadedFile = await fs.upload([file]);
            if (!uploadedFile) throw new Error('Failed to upload the resume file.');

            setStatusText('Creating preview…');
            const imageFile = await convertPdfToImage(file);
            if (!imageFile.file) throw new Error('Unable to convert the PDF into an image preview.');

            setStatusText('Saving preview…');
            const uploadedImage = await fs.upload([imageFile.file]);
            if (!uploadedImage) throw new Error('Failed to upload the preview image.');

            setStatusText('Preparing analysis…');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: null,
            };
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Generating AI feedback…');
            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription, AIResponseFormat })
            );
            if (!feedback) throw new Error('Failed to analyse your resume. Please try again.');

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            data.feedback = JSON.parse(feedbackText);
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analysis complete! Redirecting…');
            navigate(`/resume/${uuid}`);
        } catch (err) {
            console.error('Failed to process resume', err);
            setError(err instanceof Error ? err.message : 'Something went wrong while analysing your resume.');
            setStatusText('Please review the form and try again.');
        } finally {
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if (!file) {
            setError('Choose a PDF resume before starting the analysis.');
            return;
        }

        if (!jobTitle?.trim()) {
            setError('Add the job title so we can tailor the feedback.');
            return;
        }

        setError(null);

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    const tips = useMemo(() => [
        'Upload PDF resumes up to 20MB.',
        'Add the job description so the AI can tailor recommendations.',
        'You will get structure, tone, and skills suggestions in minutes.',
    ], []);

    return (
        <main className="bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            <Navbar />

            <section className="main-section">
                <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[1.6fr,1fr] lg:items-start">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <h1>Upload a Resume for Personalised Insights</h1>
                            <p className="text-lg text-slate-600">
                                Provide the job you are targeting and we will generate ATS-friendly suggestions, highlight missing keywords, and surface instant fixes.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-slate-100 bg-white/95 p-8 shadow-xl shadow-slate-200/60 backdrop-blur">
                            <h2 className="text-2xl font-bold text-slate-900">Resume details</h2>
                            <p className="mt-2 text-sm text-slate-600">Fill in the job context and upload a PDF resume.</p>

                            {error && (
                                <div className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 flex items-start gap-3 animate-in fade-in duration-300">
                                    <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="mt-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-800 flex items-center gap-3 animate-in fade-in duration-300">
                                    <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="font-medium">{statusText}</span>
                                </div>
                            )}

                            <form id="upload-form" onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
                                <div className="form-div">
                                    <label htmlFor="company-name">Company name</label>
                                    <input type="text" name="company-name" placeholder="Acme Corp" id="company-name" autoComplete="organization" disabled={isProcessing} />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-title">Job title*</label>
                                    <input type="text" name="job-title" placeholder="Senior Product Manager" id="job-title" autoComplete="organization-title" required disabled={isProcessing} />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-description">Job description</label>
                                    <textarea rows={5} name="job-description" placeholder="Paste the JD or bullet points" id="job-description" disabled={isProcessing} />
                                </div>

                                <div className="form-div">
                                    <label htmlFor="uploader">Upload resume (PDF only)</label>
                                    <FileUploader onFileSelect={handleFileSelect} />
                                </div>

                                <button className="primary-button w-full text-lg py-4" type="submit" disabled={isProcessing}>
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analyzing…
                                        </span>
                                    ) : (
                                        <span>Analyze resume →</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <aside className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-indigo-50/30 p-8 shadow-xl shadow-slate-200/40 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-indigo-100 p-2">
                                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">What to expect</h2>
                        </div>
                        <ul className="flex flex-col gap-4 text-sm text-slate-700">
                            {tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-slate-100 transition-all duration-300 hover:bg-white hover:shadow-md">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex-shrink-0" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 px-5 py-4 text-sm text-indigo-800">
                            <strong className="font-semibold">💡 Pro tip:</strong> Push this project to GitHub and connect it to Vercel – it will detect the React Router app automatically.
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    )
}
export default Upload
