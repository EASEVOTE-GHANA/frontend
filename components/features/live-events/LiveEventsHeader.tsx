export default function LiveEventsHeader() {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left">
      <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-secondary-600 font-bold uppercase text-sm tracking-wide">
          Events Happening Now
        </span>
      </div>

      <h2
        className="tracking-tight text-primary-600 text-[35px] sm:text-[45px] lg:text-[60px]"
      >
        Voting Events
      </h2>
    </div>
  );
}

