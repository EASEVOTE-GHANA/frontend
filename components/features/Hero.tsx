"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { russoOne } from "../ui/fonts";

const FALLBACK_SLIDES = [
  { imageUrl: "/images/hero/slide-1.webp", title: "EaseVote Ghana" },
  { imageUrl: "/images/hero/slide-2.webp", title: "EaseVote Ghana" },
  { imageUrl: "/images/hero/slide-3.webp", title: "EaseVote Ghana" },
  { imageUrl: "/images/hero/slide-4.webp", title: "EaseVote Ghana" },
  { imageUrl: "/images/hero/slide-5.webp", title: "EaseVote Ghana" },
  { imageUrl: "/images/hero/slide-6.webp", title: "EaseVote Ghana" },
];

interface Banner {
  _id: string;
  imageUrl: string;
  title?: string;
  linkUrl?: string;
}

interface HeroProps {
  banners?: Banner[];
}

const Hero = ({ banners }: HeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  const displayBanners = banners && banners.length > 0 ? banners : FALLBACK_SLIDES;

  // Responsive logic for carousel items
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 768) {
          setItemsPerView(1);
        } else if (window.innerWidth < 1024) {
          setItemsPerView(2);
        } else {
          setItemsPerView(3);
        }
      }
    };
    handleResize(); // Init
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = displayBanners.length - itemsPerView;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index: number) => {
    // Ensure index doesn't overshoot
    if (index > maxIndex) index = maxIndex;
    setCurrentIndex(index);
  };

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, itemsPerView]);

  return (
    <section className="relative w-full bg-white overflow-hidden py-12 lg:py-20 bg-linear-to-br from-purple-50 via-white to-pink-50">
      {/* Animated Mesh Background (Simplified via CSS/Tailwind) */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-magenta-500/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Split: Text Content */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-10">
          <div className="lg:w-1/2 space-y-6 text-center lg:text-left animate-fade-in">
            <h1
              className={`${russoOne.className} text-4xl lg:text-6xl font-heading leading-tight`}
            >
              Vote Smart, <br />
              <span>Vote Secure!</span> <br />
              <span className="text-brand-bright">Vote Easy!</span>
            </h1>
            <p className="text-lg lg:text-xl text-text-muted">
              Transform Your Events with Effortless E-Voting. Make Every Vote
              Count with Confidence!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/events/voting"
                className="bg-brand-bright text-white! px-8 py-3 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 inline-block text-center"
              >
                Vote Now
              </Link>
              <Link
                href="/events/ticketing"
                className="border-2 border-brand-deep text-primary-700! px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-50 transition-all hover:-translate-y-1 inline-block text-center"
              >
                Buy Ticket
              </Link>
            </div>
          </div>

          <div className="lg:w-1/2 relative hidden lg:block">
            {/* Abstract Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-bright/10 rounded-full blur-3xl -z-10"></div>
            <Image
              src="/images/hero/hero-1.webp"
              alt="Ghana Event"
              className="rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border-4 border-white"
              width={600}
              height={400}
              priority
            />
          </div>
        </div>

        {/* Bottom Split: Carousel */}
        <div className="relative mt-8">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{
                transform: `translateX(-${
                  currentIndex * (100 / itemsPerView)
                }%)`,
              }}
            >
              {displayBanners.map((banner: any, idx) => (
                <div
                  key={banner._id || idx}
                  className="flex-shrink-0 relative cursor-pointer"
                  style={{ width: `calc(${100 / itemsPerView}% - 16px)` }} // Adjust for gap
                  onClick={() => banner.linkUrl && (window.location.href = banner.linkUrl)}
                >
                  <div className="w-full h-64 relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || `Event Slide ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/80 to-transparent rounded-xl flex items-end p-4">
                    <span className="text-white font-bold text-sm">
                      {banner.title || "EaseVote Ghana"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
              {Array.from({
                length: Math.ceil(displayBanners.length / itemsPerView),
              }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx * itemsPerView)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    Math.floor(currentIndex / itemsPerView) === idx
                      ? "bg-brand-bright"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-full border border-gray-300 hover:bg-brand-bright hover:text-white transition-colors text-brand-deep"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-full border border-gray-300 hover:bg-brand-bright hover:text-white transition-colors text-brand-deep"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
