import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useMemo, useState} from "react";

export function meta() {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated, navigate])

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      setError(null);

      try {
        const items = (await kv.list("resume:*", true)) as KVItem[];
        const parsedResumes = items?.map((resume) => JSON.parse(resume.value) as Resume) ?? [];
        setResumes(parsedResumes);
      } catch (err) {
        console.error("Failed to load resumes", err);
        setError("Unable to load your resumes right now. Please try again.");
      } finally {
        setLoadingResumes(false);
      }
    };

    loadResumes();
  }, [kv]);

  const totalApplications = useMemo(() => resumes.length, [resumes]);

  const averageOverallScore = useMemo(() => {
    if (resumes.length === 0) return null;

    return resumes.reduce(
        (acc, resume) => {
          const score =
              typeof resume.feedback === "object" && resume.feedback
                  ? resume.feedback.overallScore ?? 0
                  : null;

          if (typeof score === "number") {
            return {
              total: acc.total + score,
              count: acc.count + 1,
            };
          }

          return acc;
        },
        { total: 0, count: 0 }
    );
  }, [resumes]);

  return (
      <main className="bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <Navbar />

        <section className="main-section">
          <div className="page-heading">
            <div className="flex flex-col gap-4">
              <h1>Track Resumes With Confidence</h1>
              <p className="text-lg text-slate-600">
                Upload your resume once and come back any time to see AI-powered scores, ATS feedback, and actionable tips tailored to each role.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <Link to="/upload" className="primary-button">
                Analyze a Resume
              </Link>
              <Link to="/upload" className="secondary-button">
                See how it works
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-center sm:text-left">
            <div className="flex flex-1 min-w-[200px] flex-col gap-2 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-indigo-100 p-2">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-indigo-700">Resumes analyzed</span>
              </div>
              <span className="text-4xl font-bold text-indigo-900">{totalApplications}</span>
            </div>
            <div className="flex flex-1 min-w-[200px] flex-col gap-2 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-purple-700">Avg. overall score</span>
              </div>
              <span className="text-4xl font-bold text-purple-900">
                {averageOverallScore && averageOverallScore.count > 0
                    ? Math.round(averageOverallScore.total / averageOverallScore.count)
                    : "—"}
              </span>
            </div>
          </div>

          {loadingResumes && (
              <div className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-64 animate-pulse rounded-3xl bg-white/70" />
                ))}
              </div>
          )}

          {!loadingResumes && error && (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
                {error}
              </div>
          )}

          {!loadingResumes && !error && resumes.length > 0 && (
              <div className="resumes-section">
                {resumes.map((resume) => (
                    <ResumeCard key={resume.id} resume={resume} />
                ))}
              </div>
          )}

          {!loadingResumes && !error && resumes.length === 0 && (
              <div className="empty-state">
                <div className="rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 p-6">
                  <svg className="h-16 w-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-slate-900">Ready for your first analysis?</h2>
                  <p className="text-lg text-slate-600 max-w-md mx-auto">
                    Upload a resume and paste the job description to get a personalised report in seconds.
                  </p>
                </div>
                <Link to="/upload" className="primary-button text-lg px-10 py-4">
                  Get Started →
                </Link>
              </div>
          )}
        </section>
      </main>
  )
}
