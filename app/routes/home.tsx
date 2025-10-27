import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useMemo, useState} from "react";

export function meta({}: Route.MetaArgs) {
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
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
              <span className="text-sm font-medium text-slate-500">Resumes analyzed</span>
              <span className="text-3xl font-semibold text-slate-900">{totalApplications}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
              <span className="text-sm font-medium text-slate-500">Avg. overall score</span>
              <span className="text-3xl font-semibold text-slate-900">
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
                <img src="/icons/info.svg" alt="Upload" className="h-16 w-16" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-slate-900">Ready for your first analysis?</h2>
                  <p className="text-base text-slate-600">
                    Upload a resume and paste the job description to get a personalised report in seconds.
                  </p>
                </div>
                <Link to="/upload" className="primary-button">
                  Get Started
                </Link>
              </div>
          )}
        </section>
      </main>
  )
}
