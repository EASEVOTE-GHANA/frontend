import { Play } from "lucide-react";
import { VideoGuide } from "@/types";

const videoGuides: VideoGuide[] = [
  {
    id: "1",
    title: "How to Vote on EaseVote",
    thumbnail: "https://picsum.photos/seed/guide1/400/225",
    duration: "1:20",
  },
  {
    id: "2",
    title: "Creating Your First Event",
    thumbnail: "https://picsum.photos/seed/guide2/400/225",
    duration: "2:45",
  },
  {
    id: "3",
    title: "Withdrawing Your Revenue",
    thumbnail: "https://picsum.photos/seed/guide3/400/225",
    duration: "1:10",
  },
];

export default function VideoGuides() {
  return (
    <div className="mt-20">
      <h2 className="text-3xl font-display font-bold text-slate-900 mb-8">
        Video Tutorials
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {videoGuides.map((video) => (
          <div key={video.id} className="group cursor-pointer">
            <div className="relative rounded-xl overflow-hidden aspect-video mb-3 shadow-md">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-magenta-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={20} className="fill-current ml-1" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-md">
                {video.duration}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 group-hover:text-magenta-600 transition-colors">
              {video.title}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
}
