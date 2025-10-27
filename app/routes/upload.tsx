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

                        <div className="rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
                            <h2 className="text-2xl font-semibold text-slate-900">Resume details</h2>
                            <p className="mt-1 text-sm text-slate-500">Fill in the job context and upload a PDF resume.</p>

                            {error && (
                                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    {error}
                                </div>
                            )}

                            {isProcessing && (
                                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                                    {statusText}
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

                                <button className="primary-button w-full" type="submit" disabled={isProcessing}>
                                    {isProcessing ? 'Analyzing…' : 'Analyze resume'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <aside className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-lg shadow-slate-200/40">
                        <h2 className="text-xl font-semibold text-slate-900">What to expect</h2>
                        <ul className="flex flex-col gap-4 text-sm text-slate-600">
                            {tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                            Need help deploying? Push this project to GitHub and connect it to Vercel – it will detect the React Router app automatically.
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    )
}
export default Upload
