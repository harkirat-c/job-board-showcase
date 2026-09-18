import { useNavigate } from "react-router-dom";

function LandingPage() {
    const buttonStyle =
        "cursor-pointer whitespace-nowrap rounded-full border border-white/25 bg-white/10 px-5 py-2 text-base font-medium text-white transition hover:bg-white/20 sm:px-8 sm:text-xl";
    const navigate = useNavigate();
    
    return (
        <section className="flex min-h-screen w-full items-center justify-between bg-linear-to-b from-fuchsia-600 via-purple-700 to-purple-900 px-6 pt-28 text-white sm:px-[6%] sm:pt-32 lg:px-[8%]">
            <div className="flex max-w-3xl flex-col items-start justify-center gap-y-6 py-10 sm:py-14">
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                    Get that 
                    <span className="inline-block bg-[#FFCC4D] rotate-6 ml-6 translate-y-1 px-3 py-1.5 text-[#3E006E]">
                        Job!
                    </span>
                    <span className="text-lg fond-medium text-white/75 ml-2">
                        .com
                    </span>
                    </h1>
                <p className="mb-3 max-w-2xl text-left text-xl leading-relaxed text-white/80">
                    Find your next role with personalized job recommendations tailored
                    to your expertise and preferences. Create a dynamic profile, upload
                    your resume, and stand out to top employers today.
                </p>
                <div className="flex flex-wrap items-center justify-start gap-3">
                    <button className={buttonStyle} onClick={() => navigate('/jobs')}>
                        Start Exploring
                    </button>
                    <button className={buttonStyle} onClick={() => navigate('/login')}>
                        Sign In
                    </button>
                    <a className="basis-full cursor-pointer text-sm text-white/70 underline transition hover:text-white sm:basis-auto"
                        onClick={() => navigate('/register')}>
                        Don't have an account? Sign Up
                    </a>
                </div>
            </div>
            <div className="hidden flex-1 items-center justify-center text-[240px] md:flex lg:text-[260px]">
                🤑
            </div>
        </section>
    );
}

export default LandingPage;