import ScoreGauge from "~/components/ScoreGauge";
import ScoreBadge from "~/components/ScoreBadge";

const Category = ({ title, score }: { title: string, score: number }) => {
    const getColorClasses = (score: number) => {
        if (score > 70) return {
            text: 'text-green-700',
            bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
            border: 'border-green-200'
        };
        if (score > 49) return {
            text: 'text-amber-700',
            bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
            border: 'border-amber-200'
        };
        return {
            text: 'text-red-700',
            bg: 'bg-gradient-to-r from-red-50 to-rose-50',
            border: 'border-red-200'
        };
    };

    const colors = getColorClasses(score);

    return (
        <div className={`flex flex-row gap-3 items-center ${colors.bg} rounded-2xl p-5 w-full justify-between border ${colors.border} transition-all duration-300 hover:shadow-md`}>
            <div className="flex flex-row gap-3 items-center justify-start">
                <p className="text-lg font-bold text-slate-900">{title}</p>
                <ScoreBadge score={score} />
            </div>
            <p className="text-xl font-bold">
                <span className={colors.text}>{score}</span>
                <span className="text-slate-400 text-base">/100</span>
            </p>
        </div>
    )
}

const Summary = ({ feedback }: { feedback: Feedback }) => {
    return (
        <div className="w-full rounded-3xl border border-slate-100 bg-white/95 shadow-xl shadow-slate-200/60 backdrop-blur animate-in fade-in duration-700">
            <div className="flex flex-row items-center p-8 gap-8 border-b border-slate-100">
                <ScoreGauge score={feedback.overallScore} />

                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold text-slate-900">Your Resume Score</h2>
                    <p className="text-sm text-slate-600">
                        This score is calculated based on the variables listed below.
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <Category title="Tone & Style" score={feedback.toneAndStyle.score} />
                <Category title="Content" score={feedback.content.score} />
                <Category title="Structure" score={feedback.structure.score} />
                <Category title="Skills" score={feedback.skills.score} />
            </div>
        </div>
    )
}
export default Summary
