import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Navbar from "~/components/Navbar";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export const meta = () => ([
    { title: 'Resumind | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

type StoredResumeRecord = {
    resumePath?: string;
    imagePath?: string;
    feedback?: Feedback | null;
};

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [isLoadingResume, setIsLoadingResume] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const resumeUrlRef = useRef<string | null>(null);
    const imageUrlRef = useRef<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [auth.isAuthenticated, id, isLoading, navigate])

    useEffect(() => {
        let isCancelled = false;

        // Pull the stored resume assets from Puter and manage their lifecycle safely.
        const clearObjectUrls = () => {
            if (resumeUrlRef.current) {
                URL.revokeObjectURL(resumeUrlRef.current);
                resumeUrlRef.current = null;
            }

            if (imageUrlRef.current) {
                URL.revokeObjectURL(imageUrlRef.current);
                imageUrlRef.current = null;
            }
        };

        const loadResume = async () => {
            setIsLoadingResume(true);
            setError(null);

            try {
                const resume = await kv.get(`resume:${id}`);

                if (!resume) {
                    if (!isCancelled) {
                        setFeedback(null);
                    }
                    return;
                }

                let data: StoredResumeRecord;

                try {
                    data = JSON.parse(resume);
                } catch (parseError) {
                    throw new Error('Stored resume data is not valid JSON.');
                }

                if (!data.resumePath || !data.imagePath) {
                    throw new Error('Stored resume data is incomplete.');
                }

                const resumeBlob = await fs.read(data.resumePath);
                if (!resumeBlob) {
                    throw new Error('Unable to locate the resume PDF.');
                }

                const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
                const nextResumeUrl = URL.createObjectURL(pdfBlob);

                const imageBlob = await fs.read(data.imagePath);
                if (!imageBlob) {
                    URL.revokeObjectURL(nextResumeUrl);
                    throw new Error('Unable to locate the resume preview.');
                }

                const nextImageUrl = URL.createObjectURL(imageBlob);

                if (isCancelled) {
                    URL.revokeObjectURL(nextResumeUrl);
                    URL.revokeObjectURL(nextImageUrl);
                    return;
                }

                if (resumeUrlRef.current) URL.revokeObjectURL(resumeUrlRef.current);
                resumeUrlRef.current = nextResumeUrl;
                setResumeUrl(nextResumeUrl);

                if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
                imageUrlRef.current = nextImageUrl;
                setImageUrl(nextImageUrl);

                setFeedback(data.feedback ?? null);
            } catch (err) {
                console.error('Failed to load resume', err);
                if (!isCancelled) {
                    setFeedback(null);
                    setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading the resume.');
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingResume(false);
                }
            }
        }

        if (id) {
            loadResume();
        } else {
            setIsLoadingResume(false);
            setFeedback(null);
        }

        return () => {
            isCancelled = true;
            clearObjectUrls();
        };
    }, [fs, id, kv]);

    return (
        <main className="bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            <Navbar />
            <section className="main-section">
                <Link to="/" className="back-button w-fit">
                    <img src="/icons/back.svg" alt="Back" className="h-3 w-3" />
                    <span className="text-sm font-semibold text-slate-700">Back to dashboard</span>
                </Link>

                <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
                    <aside className="space-y-6">
                        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-200/50">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">Resume preview</h2>
                                {resumeUrl && !isLoadingResume && !error && (
                                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="secondary-button text-sm">
                                        Open PDF
                                    </a>
                                )}
                            </div>
                            <div className="mt-4">
                                {isLoadingResume && (
                                    <div className="flex h-[520px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-100/60 text-sm text-slate-500">
                                        Loading preview…
                                    </div>
                                )}
                                {!isLoadingResume && !error && imageUrl && (
                                    <img
                                        src={imageUrl}
                                        className="h-[520px] w-full rounded-2xl border border-slate-100 object-contain bg-white"
                                        alt="Resume preview"
                                    />
                                )}
                                {!isLoadingResume && error && (
                                    <div className="flex h-[520px] items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
                                        {error}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    <section className="flex flex-col gap-8">
                        <div className="flex flex-col gap-3">
                            <h1>Resume Review</h1>
                            <p className="text-base text-slate-600">
                                Explore the overall score, ATS readiness, and detailed improvement plan tailored to this role.
                            </p>
                        </div>

                        {isLoadingResume && (
                            <div className="flex flex-col gap-6 animate-pulse">
                                <div className="h-14 w-4/5 rounded-2xl bg-slate-200" />
                                <div className="h-40 rounded-2xl bg-slate-200" />
                                <div className="h-32 rounded-2xl bg-slate-200" />
                            </div>
                        )}

                        {!isLoadingResume && error && (
                            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {!isLoadingResume && !error && feedback ? (
                            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                                <Summary feedback={feedback} />
                                <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                                <Details feedback={feedback} />
                            </div>
                        ) : null}

                        {!isLoadingResume && !error && !feedback && (
                            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600">
                                Resume data is not available yet. Please re-upload your resume from the homepage.
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    )
}
export default Resume
