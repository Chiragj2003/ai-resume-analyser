interface Suggestion {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const ATS = ({ score, suggestions }: ATSProps) => {
  // Determine background gradient based on score
  const getScoreStyles = (score: number) => {
    if (score > 69) return {
      gradient: 'from-green-100 to-emerald-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: '/icons/ats-good.svg',
      subtitle: 'Great Job! 🎉',
      titleColor: 'text-green-900'
    };
    if (score > 49) return {
      gradient: 'from-amber-100 to-yellow-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      icon: '/icons/ats-warning.svg',
      subtitle: 'Good Start 👍',
      titleColor: 'text-amber-900'
    };
    return {
      gradient: 'from-red-100 to-rose-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: '/icons/ats-bad.svg',
      subtitle: 'Needs Improvement 💪',
      titleColor: 'text-red-900'
    };
  };

  const styles = getScoreStyles(score);

  return (
  <div className={`w-full rounded-3xl border border-slate-100 bg-gradient-to-br ${styles.gradient} p-8 shadow-xl shadow-slate-200/60 animate-in fade-in duration-700`}>
      {/* Top section with icon and headline */}
      <div className="flex items-center gap-5 mb-6">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${styles.iconBg}`}>
          <img src={styles.icon} alt="ATS Score Icon" className="w-10 h-10" />
        </div>
        <div>
          <h2 className={`text-3xl font-bold ${styles.titleColor}`}>ATS Score: {score}/100</h2>
          <h3 className="text-lg font-semibold text-slate-700 mt-1">{styles.subtitle}</h3>
        </div>
      </div>

      {/* Description section */}
      <div className="mb-6 bg-white/50 rounded-2xl p-6 border border-white/60">
  <p className="mb-5 text-slate-700 leading-relaxed">
          This score represents how well your resume is likely to perform in Applicant Tracking Systems used by employers.
        </p>

        {/* Suggestions list */}
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 transition-all duration-300 hover:shadow-md">
              <div className={`rounded-full p-1.5 ${suggestion.type === "good" ? 'bg-green-100' : 'bg-amber-100'}`}>
                <img
                  src={suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                  alt={suggestion.type === "good" ? "Check" : "Warning"}
                  className="w-5 h-5"
                />
              </div>
              <p className={`flex-1 leading-relaxed ${suggestion.type === "good" ? "text-green-800 font-medium" : "text-amber-800"}`}>
                {suggestion.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Closing encouragement */}
      <p className="italic text-slate-700 text-center bg-white/40 rounded-xl p-4 border border-white/60">
        💡 Keep refining your resume to improve your chances of getting past ATS filters and into the hands of recruiters.
      </p>
    </div>
  )
}

export default ATS
