import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useMemo, useRef, useState} from "react";
import {usePuterStore} from "~/lib/puter";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume }) => {
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');
    const resumeUrlRef = useRef<string | null>(null);

    const hasFeedback = typeof feedback === 'object' && feedback !== null;
    const overallScore = hasFeedback ? feedback.overallScore ?? 0 : 0;

    // Prefer showing an actionable tip (improvement if available) beneath each card.
    const highlightTip = useMemo(() => {
        if (!hasFeedback) return null;
        const tips = feedback.ATS?.tips ?? [];
        if (!tips.length) return null;
        const improveTip = tips.find((tip) => tip.type === 'improve');
        return (improveTip ?? tips[0]).tip;
    }, [feedback, hasFeedback]);

    useEffect(() => {
        let isCancelled = false;

        const loadResume = async () => {
            try {
                const blob = await fs.read(imagePath);
                if (!blob) return;

                const url = URL.createObjectURL(blob);

                if (isCancelled) {
                    URL.revokeObjectURL(url);
                    return;
                }

                if (resumeUrlRef.current) {
                    URL.revokeObjectURL(resumeUrlRef.current);
                }

                resumeUrlRef.current = url;
                setResumeUrl(url);
            } catch (err) {
                console.error('Failed to read resume preview', err);
                setResumeUrl('');
            }
        };

        loadResume();
        return () => {
            isCancelled = true;
            if (resumeUrlRef.current) {
                URL.revokeObjectURL(resumeUrlRef.current);
                resumeUrlRef.current = null;
            }
        };
    }, [fs, imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex flex-col gap-1">
                    {companyName ? (
                        <h2 className="text-xl font-semibold text-slate-900 break-words">{companyName}</h2>
                    ) : (
                        <h2 className="text-xl font-semibold text-slate-900">Untitled resume</h2>
                    )}
                    {jobTitle && <p className="text-sm text-slate-500 break-words">{jobTitle}</p>}
                    <span className={`status-pill ${hasFeedback ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        <span className={`h-2 w-2 rounded-full ${hasFeedback ? 'bg-green-600' : 'bg-amber-600'}`} />
                        {hasFeedback ? 'Reviewed' : 'Processing'}
                    </span>
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={overallScore} />
                </div>
            </div>
            <div className="gradient-border animate-in fade-in duration-1000">
                <div className="w-full h-full">
                    {resumeUrl ? (
                        <img
                            src={resumeUrl}
                            alt="Resume preview"
                            className="h-[320px] w-full rounded-2xl object-cover object-top"
                        />
                    ) : (
                        <div className="flex h-[320px] w-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                            Preview not available yet
                        </div>
                    )}
                </div>
            </div>
            {highlightTip && (
                <p className="text-sm text-slate-600">{highlightTip}</p>
            )}
        </Link>
    )
}
export default ResumeCard
