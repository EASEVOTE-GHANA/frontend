import { ArrowRightIcon, Smartphone, Globe } from "lucide-react";

export default function DidYouKnow() {
  return (
    <div className="mb-20">
      <h2 className="text-3xl font-display font-bold text-slate-900 mb-8">
        Did You Know?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* USSD Card */}
      <div className="group h-80 perspective-1000 cursor-pointer">
        <div className="flip-card-inner relative w-full h-full transition-all duration-700 preserve-3d shadow-xl rounded-3xl">
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center border-b-4 border-primary-500">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 text-primary-600">
              <Smartphone size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Voting via USSD?
            </h3>
            <p className="text-slate-500">Dial *920*195#</p>
            <div className="mt-6 text-xs font-bold text-primary-500 uppercase tracking-widest flex items-center gap-2">
              Hover to reveal steps <ArrowRightIcon className="w-4 h-4" />
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary-900 text-white rounded-3xl p-8 flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4 text-center text-white! border-b border-white/20 pb-2">
              USSD Steps
            </h3>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex gap-3">
                <span className="font-bold text-secondary-400">1.</span> Dial
                *920*195#
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-secondary-400">2.</span> Select
                &quot;Vote&quot;
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-secondary-400">3.</span> Enter
                Nominee Code
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-secondary-400">4.</span> Enter
                Number of Votes
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-secondary-400">5.</span> Enter
                PIN to Confirm
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Website Card */}
      <div className="group h-80 perspective-1000 cursor-pointer">
        <div className="flip-card-inner relative w-full h-full transition-all duration-700 preserve-3d shadow-xl rounded-3xl">
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center border-b-4 border-secondary-500">
            <div className="w-20 h-20 bg-secondary-50 rounded-full flex items-center justify-center mb-6 text-secondary-600">
              <Globe size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Voting Online?
            </h3>
            <p className="text-slate-500">www.easevotegh.com</p>
            <div className="mt-6 text-xs font-bold text-secondary-500 uppercase tracking-widest flex items-center gap-2">
              Hover to reveal steps <ArrowRightIcon className="w-4 h-4" />
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-secondary-700 text-white rounded-3xl p-8 flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4 text-center text-white! border-b border-white/20 pb-2">
              Web Steps
            </h3>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex gap-3">
                <span className="font-bold text-primary-300">1.</span> Visit
                easevotegh.com
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary-300">2.</span> Search
                Event Name
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary-300">3.</span> Select
                Candidate
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary-300">4.</span> Choose
                Payment Method
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary-300">5.</span> Confirm
                Details
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* CSS Utility for 3D Transform since it's not default in all Tailwind configs */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .group:hover .flip-card-inner { transform: rotateY(180deg); }
      `}</style>
      </div>
    </div>
  );
}
